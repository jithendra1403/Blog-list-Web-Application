const jwt = require('jsonwebtoken');
const blogsRouter = require('express')
  .Router();
require('express-async-errors');
const _ = require('lodash');

const Blog = require('../models/blog');
const User = require('../models/user');
const config = require('../utils/config');
const errors = require('../utils/errors');

blogsRouter.get('/', async (req, res) => {
  let blogs = await Blog.find({})
    .populate('user');
  blogs = await blogs.map((blog) => blog.toJSON());
  res.json(blogs);
});

blogsRouter.post('/', async (req, res) => {
  const { body, token } = req;

  const decodedToken = jwt.verify(token, config.SECRET);
  if (!token || !decodedToken.id) {
    throw new errors.AuthorizationError('token missing or invalid');
  }

  const user = await User.findById(decodedToken.id);
  if (!user) {
    throw new errors.AuthorizationError('token missing or invalid');
  }
  let blog = _.pick(body, ['title', 'author', 'url', 'likes']);
  blog = {
    ...blog,
    user: user._id,
    comments: [],
  };
  blog = new Blog(blog);

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
  await Blog.populate(savedBlog, { path: 'user' });
  res.status(201)
    .json(savedBlog.toJSON());
});

blogsRouter.delete('/:id', async (req, res) => {
  const { token } = req;
  const decodedToken = jwt.verify(token, config.SECRET);
  if (!token || !decodedToken.id) {
    throw new errors.AuthorizationError('token missing or invalid');
  }

  const user = await User.findById(decodedToken.id);
  if (!user) {
    throw new errors.AuthorizationError('token missing or invalid');
  }
  const blogToUpdate = await Blog.findById(req.params.id);
  if (!blogToUpdate) {
    return;
  }
  if (user._id.toString() !== blogToUpdate.user.toString()) {
    throw new errors.PermissionError('user does not have access to modify the requested resource');
  }

  await Blog.findByIdAndDelete(req.params.id);

  user.blogs = user.blogs.filter((blog) => blog.toString() !== req.params.id);
  await user.save();
  res.status(204)
    .end();
});

blogsRouter.put('/:id', async (req, res) => {
  const {
    body,
    token,
  } = req;
  const decodedToken = jwt.verify(token, config.SECRET);
  if (!token || !decodedToken.id) {
    throw new errors.AuthorizationError('token missing or invalid');
  }

  const user = await User.findById(decodedToken.id);
  if (!user) {
    throw new errors.AuthorizationError('token missing or invalid');
  }
  const blogToUpdate = await Blog.findById(req.params.id);
  if (!blogToUpdate) {
    throw new errors.ResourceError('requested resource is not found');
  }
  let changeableProperties = ['likes'];
  if (user._id.toString() === blogToUpdate.user.toString()) {
    changeableProperties = _.concat(changeableProperties, ['title', 'author', 'url']);
  }
  const updatedBlog = await Blog.findByIdAndUpdate(
    req.params.id,
    _.pick(body, changeableProperties),
    {
      new: true,
      runValidators: true,
      context: 'query',
    },
  );
  await Blog.populate(updatedBlog, { path: 'user' });
  res.json(updatedBlog.toJSON());
});

blogsRouter.post('/:id/comments', async (req, res) => {
  const { token } = req;
  const decodedToken = jwt.verify(token, config.SECRET);
  if (!token || !decodedToken.id) {
    throw new errors.AuthorizationError('token missing or invalid');
  }

  const user = await User.findById(decodedToken.id);
  if (!user) {
    throw new errors.AuthorizationError('token missing or invalid');
  }
  const blogToUpdate = await Blog.findById(req.params.id);
  if (!blogToUpdate) {
    return;
  }

  if (req.body.comment) {
    blogToUpdate.comments = [...blogToUpdate.comments, req.body.comment];
    const savedBlog = await blogToUpdate.save();
    await Blog.populate(savedBlog, { path: 'user' });
    res.status(201)
      .json(savedBlog.toJSON());
  } else {
    res.status(400)
      .json(({ error: 'comment is missing in request' }).toJSON());
  }
});

module.exports = blogsRouter;
