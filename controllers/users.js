const bcrypt = require('bcrypt');
const usersRouter = require('express')
  .Router();
require('express-async-errors');

const User = require('../models/user');
const errors = require('../utils/errors');

usersRouter.get('/', async (req, res) => {
  let users = await User.find({})
    .populate('blogs');
  users = await users.map((blog) => blog.toJSON());
  res.json(users);
});

usersRouter.post('/', async (req, res) => {
  const { body } = req;
  const saltRounds = 10;
  if (!body.password) throw new errors.ValidationError('User validation failed: password: field is mandatory');
  if (body.password.length < 3) throw new errors.ValidationError('User validation failed: password: should be at least 3 characters long');
  const passwordHash = await bcrypt.hash(body.password, saltRounds);

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash,
  });

  const savedUser = await user.save();

  res.json(savedUser.toJSON());
});

module.exports = usersRouter;
