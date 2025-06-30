const axios = require('axios');
const Queue = require('../models/Queue');
const Video = require('../models/Video');
const telegramService = require('./telegram.service');
const { NotFoundError } = require('../utils/errors');

class StreamingService {
  async getCurrentStream() {
    const currentItem = await Queue.findOne().sort({ position: 1 }).populate('videoId');
    if (!currentItem || !currentItem.videoId) {
      throw new NotFoundError('No videos in queue');
    }
    return currentItem.videoId;
  }

  async getNextVideo() {
    const currentItem = await Queue.findOne().sort({ position: 1 });
    if (!currentItem) {
      throw new NotFoundError('No videos in queue');
    }

    await Queue.findByIdAndDelete(currentItem._id);
    await Video.findByIdAndUpdate(currentItem.videoId, {
      $inc: { streamCount: 1 },
      lastStreamed: new Date()
    });

    const nextItem = await Queue.findOne().sort({ position: 1 }).populate('videoId');
    return nextItem?.videoId || null;
  }

  async streamVideo(videoId, req, res) {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    const fileStream = await telegramService.getFileStream(video.fileId);
    if (fileStream.error) {
      throw new Error(fileStream.error);
    }

    try {
      const headResponse = await axios.head(fileStream.url, {
        headers: {
          Range: 'bytes=0-',
        },
      });

      const fileSize = parseInt(headResponse.headers['content-length'], 10);
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        const videoResponse = await axios.get(fileStream.url, {
          headers: {
            Range: `bytes=${start}-${end}`,
          },
          responseType: 'stream',
        });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': video.mimeType || 'video/mp4',
        });

        videoResponse.data.pipe(res);
      } else {
        const videoResponse = await axios.get(fileStream.url, {
          responseType: 'stream',
        });

        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': video.mimeType || 'video/mp4',
        });

        videoResponse.data.pipe(res);
      }
    } catch (err) {
      throw new NotFoundError('Video not found');
    }
  }

  async getQueue() {
    return await Queue.find().sort({ position: 1 }).populate('videoId');
  }
}

module.exports = new StreamingService();
