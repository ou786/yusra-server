const Column3 = require('../models/Column');
const Board3 = require('../models/Board');
const Card2 = require('../models/Card');
const asyncHandler4 = require('express-async-handler');

const createColumn = asyncHandler4(async (req, res) => {
  const { boardId, title } = req.body;
  if (!boardId || !title) { res.status(400); throw new Error('boardId and title required'); }
  const board = await Board3.findById(boardId);
  if (!board) { res.status(404); throw new Error('Board not found'); }
  if (!board.members.includes(req.user._id)) { res.status(403); throw new Error('Not a board member'); }
  const position = board.columns.length;
  const column = await Column3.create({ title, board: boardId, position });
  board.columns.push(column._id);
  await board.save();
  res.status(201).json(column);
});

const renameColumn = asyncHandler4(async (req, res) => {
  const { columnId } = req.params;
  const { title } = req.body;
  const column = await Column3.findById(columnId);
  if (!column) { res.status(404); throw new Error('Column not found'); }
  const board = await Board3.findById(column.board);
  if (!board.members.includes(req.user._id)) { res.status(403); throw new Error('Not authorized'); }
  column.title = title || column.title;
  await column.save();
  res.json(column);
});

const reorderColumns = asyncHandler4(async (req, res) => {
  const { boardId, orderedColumnIds } = req.body;

  const board = await Board3.findById(boardId);
  if (!board) {
    res.status(404);
    throw new Error("Board not found");
  }

  // Workspace access check
  const workspace = await Workspace2.findById(board.workspace);
  if (!workspace.members.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  // Update board.columns order
  board.columns = orderedColumnIds;
  await board.save();

  // Update position of each column
  for (let i = 0; i < orderedColumnIds.length; i++) {
    await Column3.findByIdAndUpdate(orderedColumnIds[i], {
      position: i
    });
  }

  res.json({ message: "Columns reordered successfully" });
});


const deleteColumn = asyncHandler4(async (req, res) => {
  const { columnId } = req.params;

  const column = await Column3.findById(columnId);
  if (!column) {
    res.status(404);
    throw new Error("Column not found");
  }

  // Load parent board
  const board = await Board3.findById(column.board);
  if (!board) {
    res.status(404);
    throw new Error("Parent board not found");
  }

  // Check permissions
  if (!board.members.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  // 1. Remove column from board.columns
  board.columns = board.columns.filter(
    (c) => c.toString() !== columnId.toString()
  );
  await board.save();

  // 2. Delete all cards in this column
  await Card2.deleteMany({ column: columnId });

  // 3. Delete the column itself
  await Column3.deleteOne({ _id: columnId });

  res.json({ message: "Column and its cards deleted" });
});


module.exports = { createColumn, renameColumn, reorderColumns, deleteColumn };