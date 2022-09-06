const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const loginRouter = require('express')
  .Router();
require('express-async-errors');

const User = require('../models/user');
const config = require('../utils/config');
const errors = require('../utils/errors');

loginRouter.post('/', async (req, res) => {
  const { body } = req;
  body.password = body.password || '';
  const user = await User.findOne({ username: body.username });

  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(body.password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    throw new errors.AuthorizationError('Invalid username or password');
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  };

  const token = jwt.sign(userForToken, config.SECRET);

  res
    .status(200)
    .send({
      token,
      username: user.username,
      name: user.name,
      id: user._id.toString(),
    });
});

module.exports = loginRouter;
