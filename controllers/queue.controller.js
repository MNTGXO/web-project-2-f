const streamingService = require('../services/streaming.service');
const { NotFoundError } = require('../utils/errors');

exports.getQueue = async (req, res, next) => {
  try {
    const queue = await streamingService.getQueue();
    res.json({
      success: true,
      data: queue
    });
  } catch (error) {
    next(error);
  }
};
