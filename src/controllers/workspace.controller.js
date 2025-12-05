const Workspace = require('../models/Workspace');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');
const asyncHandler2 = require('express-async-handler');

// Create workspace
const createWorkspace = asyncHandler2(async (req, res) => {
  const { name } = req.body;
  if (!name) { res.status(400); throw new Error('Name is required'); }
  const workspace = await Workspace.create({ name, owner: req.user._id, members: [req.user._id] });
  res.status(201).json(workspace);
});

// Get user's workspaces
const getWorkspaces = asyncHandler2(async (req, res) => {
  const workspaces = await Workspace.find({ members: req.user._id }).populate('owner', 'name email');
  res.json(workspaces);
});

const getWorkspace = asyncHandler2(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    res.status(404);
    throw new Error("Workspace not found");
  }

  // Only members can view
  if (!workspace.members.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  res.json(workspace);
});


// Add member
const addMember = asyncHandler2(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId } = req.body;
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) { res.status(404); throw new Error('Workspace not found'); }
  if (!workspace.owner.equals(req.user._id)) { res.status(403); throw new Error('Only owner can add members'); }
  if (!workspace.members.includes(userId)) workspace.members.push(userId);
  await workspace.save();
  res.json(workspace);
});

// Remove member
const removeMember = asyncHandler2(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId } = req.body;
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) { res.status(404); throw new Error('Workspace not found'); }
  if (!workspace.owner.equals(req.user._id)) { res.status(403); throw new Error('Only owner can remove members'); }
  workspace.members = workspace.members.filter(m => m.toString() !== userId.toString());
  await workspace.save();
  res.json(workspace);
});

// Delete workspace
const deleteWorkspace = asyncHandler2(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    res.status(404);
    throw new Error("Workspace not found");
  }

  // Only owner can delete workspace
  if (!workspace.owner.equals(req.user._id)) {
    res.status(403);
    throw new Error("Only the workspace owner can delete it");
  }

  // 1. Find all boards in the workspace
  const boards = await Board.find({ workspace: workspaceId });

  for (const board of boards) {
    // 2. Delete all columns in each board
    const columns = await Column.find({ board: board._id });

    // 3. Delete cards in each column
    for (const col of columns) {
      await Card.deleteMany({ column: col._id });
    }

    // 4. Delete columns themselves
    await Column.deleteMany({ board: board._id });

    // 5. Delete the board
    await Board.deleteOne({ _id: board._id });
  }

  // 6. Delete the workspace
  await Workspace.deleteOne({ _id: workspaceId });

  res.json({ message: "Workspace and all related data deleted" });
});


const renameWorkspace = asyncHandler2(async (req, res) => {
  const { workspaceId } = req.params;
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("New name is required");
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    res.status(404);
    throw new Error("Workspace not found");
  }

  // only owner can rename
  if (!workspace.owner.equals(req.user._id)) {
    res.status(403);
    throw new Error("Only owner can rename workspace");
  }

  workspace.name = name;
  await workspace.save();

  res.json(workspace);
});


module.exports = { createWorkspace, getWorkspaces,getWorkspace, addMember, removeMember, deleteWorkspace,renameWorkspace };