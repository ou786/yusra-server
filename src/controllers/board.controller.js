const Board2 = require('../models/Board');
const Workspace2 = require('../models/Workspace');
const Column2 = require('../models/Column');
const Card2 = require('../models/Card'); 
const asyncHandler3 = require('express-async-handler');

const createBoard = asyncHandler3(async (req, res) => {
  const { title, workspaceId } = req.body;
  if (!title || !workspaceId) { res.status(400); throw new Error('Title and workspaceId required'); }
  const workspace = await Workspace2.findById(workspaceId);
  if (!workspace) { res.status(404); throw new Error('Workspace not found'); }
  if (!workspace.members.includes(req.user._id)) { res.status(403); throw new Error('Not a member of workspace'); }

  const board = await Board2.create({ title, workspace: workspaceId, members: [req.user._id] });
  workspace.boards.push(board._id);
  await workspace.save();

  // create default columns: Todo, Doing, Done
  const todo = await Column2.create({ title: 'Todo', board: board._id, position: 0 });
  const doing = await Column2.create({ title: 'Doing', board: board._id, position: 1 });
  const done = await Column2.create({ title: 'Done', board: board._id, position: 2 });
  board.columns = [todo._id, doing._id, done._id];
  await board.save();

  res.status(201).json(board);
});

const getBoardsInWorkspace = asyncHandler3(async (req, res) => {
  const { workspaceId } = req.params;
  const boards = await Board2.find({ workspace: workspaceId }).populate('columns');
  res.json(boards);
});

const addMemberToBoard = asyncHandler3(async (req, res) => {
  const { boardId } = req.params;
  const { userId } = req.body;
  const board = await Board2.findById(boardId);
  if (!board) { res.status(404); throw new Error('Board not found'); }
  if (!board.members.includes(userId)) board.members.push(userId);
  await board.save();
  res.json(board);
});

const deleteBoard = asyncHandler3(async (req, res) => {
  const { boardId } = req.params;

  const board = await Board2.findById(boardId);
  if (!board) {
    res.status(404);
    throw new Error("Board not found");
  }

  // Permission check: user must be a workspace member
  const workspace = await Workspace2.findById(board.workspace);
  if (!workspace) {
    res.status(404);
    throw new Error("Parent workspace not found");
  }

  if (!workspace.members.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  // 1. Delete all columns of this board
  const columns = await Column2.find({ board: boardId });

  // 2. Delete all cards inside each column
  for (const col of columns) {
    await Card2.deleteMany({ column: col._id });
  }

  // 3. Delete all columns
  await Column2.deleteMany({ board: boardId });

  // 4. Remove board from workspace.boards array
  workspace.boards = workspace.boards.filter(
    (b) => b.toString() !== boardId.toString()
  );
  await workspace.save();

  // 5. Delete the board itself
  await Board2.deleteOne({ _id: boardId });

  res.json({ message: "Board and all its contents deleted" });
});

const getBoardDetails = asyncHandler3(async (req, res) => {
  const { boardId } = req.params;

  const board = await Board2.findById(boardId).populate('members');
  if (!board) {
    res.status(404);
    throw new Error('Board not found');
  }

  // Ensure current user is a member of this board's workspace
  const workspace = await Workspace2.findById(board.workspace);
  if (!workspace.members.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  // Load all columns with cards populated
  const columns = await Column2.find({ board: boardId })
    .sort({ position: 1 })
    .populate('cards');

  res.json({
    board,
    columns
  });
});

const renameBoard = asyncHandler3(async (req, res) => {
  const { boardId } = req.params;
  const { title } = req.body;

  if (!title) {
    res.status(400);
    throw new Error("New title required");
  }

  const board = await Board2.findById(boardId);
  if (!board) {
    res.status(404);
    throw new Error("Board not found");
  }

  // Only board member can rename
  if (!board.members.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  board.title = title;
  await board.save();

  res.json(board);
});


module.exports = { createBoard, getBoardsInWorkspace, addMemberToBoard, deleteBoard,getBoardDetails,renameBoard };