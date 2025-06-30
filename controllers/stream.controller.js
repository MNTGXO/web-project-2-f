const streamingService = require('../services/streaming.service');
const { NotFoundError } = require('../utils/errors');

exports.getCurrentStream = async (req, res, next) => {
  try {
    const currentVideo = await streamingService.getCurrentStream();
    res.json({
      success: true,
      data: currentVideo
    });
  } catch (error) {
    next(error);
  }
};

exports.streamVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    await streamingService.streamVideo(videoId, req, res);
  } catch (error) {
    next(error);
  }
};

exports.nextVideo = async (req, res, next) => {
  try {
    const nextVideo = await streamingService.getNextVideo();
    res.json({
      success: true,
      data: nextVideo
    });
  } catch (error) {
    next(error);
  }
};
