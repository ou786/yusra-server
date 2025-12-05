const mongoose4 = require('mongoose');

const CardSchema = new mongoose4.Schema({
  title: { type: String, required: true },
  description: String,
  board: { type: mongoose4.Schema.Types.ObjectId, ref: 'Board', required: true },
  column: { type: mongoose4.Schema.Types.ObjectId, ref: 'Column', required: true },
  position: { type: Number, default: 0 },
  labels: [String],
  assignedTo: [{ type: mongoose4.Schema.Types.ObjectId, ref: 'User' }],
  dueDate: Date,
  comments: [{ type: mongoose4.Schema.Types.ObjectId, ref: 'Comment' }],
}, { timestamps: true });

module.exports = mongoose4.model('Card', CardSchema);