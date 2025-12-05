const Card2 = require('../models/Card');
const Column4 = require('../models/Column');
const Board4 = require('../models/Board');
const Comment2 = require('../models/Comment');
const asyncHandler5 = require('express-async-handler');
const Workspace2 = require('../models/Workspace');


const createCard = asyncHandler5(async (req, res) => {
  const { title, description, boardId, columnId } = req.body;
  if (!title || !boardId || !columnId) { res.status(400); throw new Error('title, boardId, columnId required'); }
  const board = await Board4.findById(boardId);
  if (!board) { res.status(404); throw new Error('Board not found'); }
  if (!board.members.includes(req.user._id)) { res.status(403); throw new Error('Not a board member'); }
  const column = await Column4.findById(columnId);
  if (!column) { res.status(404); throw new Error('Column not found'); }
  const position = column.cards.length;
  const card = await Card2.create({ title, description, board: boardId, column: columnId, position });
  column.cards.push(card._id);
  await column.save();
  res.status(201).json(card);
});

const moveCard = asyncHandler5(async (req, res) => {
  const { cardId, toColumnId, toPosition } = req.body;
  const card = await Card2.findById(cardId);
  if (!card) { res.status(404); throw new Error('Card not found'); }
  const board = await Board4.findById(card.board);
  if (!board.members.includes(req.user._id)) { res.status(403); throw new Error('Not authorized'); }

  const fromColumn = await Column4.findById(card.column);
  const toColumn = await Column4.findById(toColumnId);
  if (!toColumn) { res.status(404); throw new Error('Destination column not found'); }

  // remove from old column
  fromColumn.cards = fromColumn.cards.filter(c => c.toString() !== cardId.toString());
  await fromColumn.save();

  // insert into new column at position
  toColumn.cards.splice(toPosition, 0, card._id);
  await toColumn.save();

  // update card
  card.column = toColumn._id;
  card.position = toPosition;
  await card.save();

  // reindex positions in both columns (simple approach)
  for (let i = 0; i < toColumn.cards.length; i++) {
    await Card2.findByIdAndUpdate(toColumn.cards[i], { position: i });
  }
  for (let i = 0; i < fromColumn.cards.length; i++) {
    await Card2.findByIdAndUpdate(fromColumn.cards[i], { position: i });
  }

  res.json({ message: 'Card moved' });
});

const updateCard = asyncHandler5(async (req, res) => {
  const { cardId } = req.params;
  const updates = req.body;
  const card = await Card2.findById(cardId);
  if (!card) { res.status(404); throw new Error('Card not found'); }
  const board = await Board4.findById(card.board);
  if (!board.members.includes(req.user._id)) { res.status(403); throw new Error('Not authorized'); }
  Object.assign(card, updates);
  await card.save();
  res.json(card);
});

const addComment = asyncHandler5(async (req, res) => {
  const { cardId } = req.params;
  const { text } = req.body;
  if (!text) { res.status(400); throw new Error('Text required'); }
  const card = await Card2.findById(cardId);
  if (!card) { res.status(404); throw new Error('Card not found'); }
  const board = await Board4.findById(card.board);
  if (!board.members.includes(req.user._id)) { res.status(403); throw new Error('Not authorized'); }
  const comment = await Comment2.create({ card: card._id, user: req.user._id, text });
  card.comments.push(comment._id);
  await card.save();
  res.status(201).json(comment);
});

// safe deleteCard handler
const deleteCard = asyncHandler5(async (req, res) => {
  const { cardId } = req.params;

  console.log("DELETE CARD REQ:", cardId, "by user:", req.user?._id);

  const card = await Card2.findById(cardId);
  if (!card) {
    res.status(404);
    throw new Error("Card not found");
  }

  // Load parent column - handle missing parent gracefully
  const column = await Column4.findById(card.column).exec();
  if (!column) {
    // Log but allow deletion to proceed (card exists but parent column missing)
    console.warn(`Warning: parent column ${card.column} for card ${cardId} not found.`);
  }

  // Verify user has access via board -> workspace
  const board = await Board4.findById(card.board).exec();
  if (!board) {
    res.status(404);
    throw new Error("Parent board not found");
  }

  const workspace = await Workspace2.findById(board.workspace).exec();
  if (!workspace) {
    res.status(404);
    throw new Error("Parent workspace not found");
  }

  if (!workspace.members.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  // If column exists, remove reference; do it safely
  if (column) {
    try {
      column.cards = column.cards.filter((c) => c.toString() !== cardId.toString());
      await column.save();
    } catch (err) {
      console.error("Error removing card ref from column:", err);
      // don't fail the whole request — attempt to delete card anyway
    }
  }

  // Finally remove the card document
  try {
    // .deleteOne() is a bit safer than .remove() in some contexts
    await Card2.deleteOne({ _id: cardId });
  } catch (err) {
    console.error("Error deleting card document:", err);
    res.status(500);
    throw new Error("Failed to delete card");
  }

  console.log("Card deleted OK:", cardId);
  return res.json({ message: "Card deleted" });
});


module.exports = { createCard, moveCard, updateCard, addComment, deleteCard };