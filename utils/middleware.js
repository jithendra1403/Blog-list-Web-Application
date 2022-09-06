const logger = require('./logger');
const errors = require('./errors');

const tokenExtractor = (req, res, next) => {
  const authorization = req.get('authorization');
  if (authorization && authorization.toLowerCase()
    .startsWith('bearer ')) {
    req.token = authorization.substring(7);
  }
  next();
};

const unknownEndpoint = (req, res) => {
  throw new errors.ResourceError('unknown endpoint');
};

// eslint-disable-next-line consistent-return
const errorHandler = (error, req, res, next) => {
  logger.error(error.message);

  if (error.name === 'CastError') {
    return res.status(400)
      .json({ error: 'malformatted id' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400)
      .json({ error: error.message });
  }
  if (error instanceof errors.ClientError) {
    return res.status(error.statusCode)
      .json({ error: error.message });
  }
  if (error.name === 'JsonWebTokenError') {
    return res.status(401)
      .json({ error: 'token missing or invalid' });
  }

  next(error);
};
module.exports = {
  tokenExtractor,
  unknownEndpoint,
  errorHandler,
};
