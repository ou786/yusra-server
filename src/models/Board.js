const mongoose2 = require('mongoose');

const BoardSchema = new mongoose2.Schema({
  title: { type: String, required: true },
  workspace: { type: mongoose2.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  members: [{ type: mongoose2.Schema.Types.ObjectId, ref: 'User' }],
  columns: [{ type: mongoose2.Schema.Types.ObjectId, ref: 'Column' }],
}, { timestamps: true });

module.exports = mongoose2.model('Board', BoardSchema);