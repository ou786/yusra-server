const mongoose3 = require('mongoose');

const ColumnSchema = new mongoose3.Schema({
  title: { type: String, required: true },
  board: { type: mongoose3.Schema.Types.ObjectId, ref: 'Board', required: true },
  position: { type: Number, default: 0 },
  cards: [{ type: mongoose3.Schema.Types.ObjectId, ref: 'Card' }],
}, { timestamps: true });

module.exports = mongoose3.model('Column', ColumnSchema);