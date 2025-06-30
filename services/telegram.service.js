const TelegramBot = require('node-telegram-bot-api');
const Video = require('../models/Video');
const Queue = require('../models/Queue');
const config = require('../config/telegram');

class TelegramService {
  constructor() {
    this.bot = new TelegramBot(config.token, { polling: true });
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.on('message', async (msg) => {
      if (msg.chat.id.toString() === config.channelId) {
        await this.handleChannelMessage(msg);
      }
    });
  }

  async handleChannelMessage(msg) {
    if (msg.video) {
      await this.processVideoMessage(msg);
    } else if (msg.document && msg.document.mime_type?.startsWith('video/')) {
      await this.processDocumentMessage(msg);
    }
  }

  async processVideoMessage(msg) {
    try {
      const { video, message_id, chat } = msg;
      await this.saveMedia({
        fileId: video.file_id,
        telegramMessageId: message_id,
        title: video.file_name || `Video ${message_id}`,
        duration: video.duration,
        width: video.width,
        height: video.height,
        mimeType: video.mime_type,
        fileSize: video.file_size,
        thumbnail: video.thumb?.file_id,
        telegramChannelId: chat.id
      });
    } catch (error) {
      console.error('Error processing video message:', error);
    }
  }

  async processDocumentMessage(msg) {
    try {
      const { document, message_id, chat } = msg;
      await this.saveMedia({
        fileId: document.file_id,
        telegramMessageId: message_id,
        title: document.file_name || `Video ${message_id}`,
        mimeType: document.mime_type,
        fileSize: document.file_size,
        telegramChannelId: chat.id
      });
    } catch (error) {
      console.error('Error processing document message:', error);
    }
  }

  async saveMedia(mediaData) {
    const existingVideo = await Video.findOne({ fileId: mediaData.fileId });
    if (existingVideo) return;

    const newVideo = new Video(mediaData);
    await newVideo.save();

    const queueCount = await Queue.countDocuments();
    const newQueueItem = new Queue({
      videoId: newVideo._id,
      position: queueCount + 1
    });

    await newQueueItem.save();
    console.log(`New media added to queue: ${mediaData.title}`);
  }

  async getFileStream(fileId) {
    try {
      const fileLink = await this.bot.getFileLink(fileId);
      return { stream: true, url: fileLink };
    } catch (error) {
      console.error('Error getting file stream:', error);
      return { error: 'Failed to get file stream' };
    }
  }
}

module.exports = new TelegramService();
