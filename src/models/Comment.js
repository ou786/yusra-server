const mongoose5 = require('mongoose');

const CommentSchema = new mongoose5.Schema({
  card: { type: mongoose5.Schema.Types.ObjectId, ref: 'Card', required: true },
  user: { type: mongoose5.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose5.model('Comment', CommentSchema);