const express = require('express');
const path = require('path');

const app = express();

const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');

const logger = require('./utils/logger');

const loginRouter = require('./controllers/login');
const usersRouter = require('./controllers/users');
const blogsRouter = require('./controllers/blogs');
const config = require('./utils/config');
const middleware = require('./utils/middleware');

mongoose.connect(config.mongoUrl).then(() => {
  logger.info(`connected to ${config.mongoUrl}`);
})
  .catch(((reason) => {
    logger.error(`failed to connect to${config.mongoUrl}`);
    logger.error(reason);
    process.exit(500);
  }));

app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));
app.use(middleware.tokenExtractor);
app.use('/api/login', loginRouter);
app.use('/api/users', usersRouter);
app.use('/api/blogs', blogsRouter);

app.use(express.static(`${__dirname}/build`));
app.get('*', (request, response) => {
  response.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line global-require
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
