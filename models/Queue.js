const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  position: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now }
});

QueueSchema.index({ position: 1 });

module.exports = mongoose.model('Queue', QueueSchema);
