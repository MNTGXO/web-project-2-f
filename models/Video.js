const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  fileId: { type: String, required: true, unique: true },
  telegramMessageId: { type: Number, required: true },
  title: { type: String },
  description: { type: String },
  duration: { type: Number },
  width: { type: Number },
  height: { type: Number },
  mimeType: { type: String },
  fileSize: { type: Number },
  thumbnail: { type: String },
  telegramChannelId: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
  lastStreamed: { type: Date },
  streamCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Video', VideoSchema);
