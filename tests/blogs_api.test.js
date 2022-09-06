const mongoose = require('mongoose');
const supertest = require('supertest');
const _ = require('lodash');

const helper = require('./test_helper');
const app = require('../app');
const Blog = require('../models/blog');
const User = require('../models/user');

const api = supertest(app);

// using users api and login api. So, ensure corresponding tests pass before testing blogs api
describe('when there is initially some blogs saved', () => {
  let savedUser;
  let otherSavedUser;
  beforeEach(async () => {
    await Blog.deleteMany({});
    await User.deleteMany({});

    const savedUserRes = await api
      .post('/api/users')
      .send(helper.userDetails[0]);
    savedUser = savedUserRes.body;

    const otherSavedUserRes = await api
      .post('/api/users')
      .send(helper.userDetails[1]);
    otherSavedUser = otherSavedUserRes.body;

    const blogObjs = helper.initialBlogs
      .map((blog) => ({
        ...blog,
        user: savedUser.id,
      }))
      .map((blog) => new Blog(blog));
    const savedBlogs = await Promise.all(blogObjs.map((blogObj) => blogObj.save()));
    const userFound = await User.findById(savedUser.id);
    savedBlogs.forEach((savedBlog) => {
      userFound.blogs = userFound.blogs.concat(savedBlog._id);
    });
    await userFound.save();

    const otherBlogObjs = helper.otherInitialBlogs
      .map((blog) => ({
        ...blog,
        user: otherSavedUser.id,
      }))
      .map((blog) => new Blog(blog));
    const otherSavedBlogs = await Promise.all(otherBlogObjs.map((blogObj) => blogObj.save()));
    const otherUserFound = await User.findById(otherSavedUser.id);
    otherSavedBlogs.forEach((otherSavedBlog) => {
      otherUserFound.blogs = otherUserFound.blogs.concat(otherSavedBlog._id);
    });
    await otherUserFound.save();
  });

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('all blogs are returned', async () => {
    const { body } = await api
      .get('/api/blogs')
      .expect(200);
    expect(body)
      .toHaveLength(helper.initialBlogs.length + helper.otherInitialBlogs.length);
  });

  test('blogs have identifier property named id', async () => {
    const { body } = await api
      .get('/api/blogs');
    body.forEach((blog) => {
      expect(blog)
        .toHaveProperty('id');
    });
  });

  describe('without a valid token', () => {
    test('addition of new blog fails', async () => {
      const newBlog = {
        title: 'Go To Statement Considered Harmful',
        author: 'Edsger W. Dijkstra',
        url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
        likes: 5,
      };

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401, { error: 'token missing or invalid' });

      const blogsAtEnd = await helper.blogsInDb();
      expect(blogsAtEnd)
        .toHaveLength(helper.initialBlogs.length + helper.otherInitialBlogs.length);
    });

    test('addition of new comment to valid blog fails', async () => {
      const comment = { comment: 'Comment!!' };

      const blogs = await helper.blogsInDb(savedUser.id);
      const blogToComment = blogs[0];
      await api
        .post(`/api/blogs/${blogToComment.id}/comments`)
        .send(comment)
        .expect(401, { error: 'token missing or invalid' });
    });
  });

  describe('with a valid token', () => {
    let token;
    beforeEach(async () => {
      const { body } = await api
        .post('/api/login')
        .send(_.pick(helper.userDetails[0], ['username', 'password']));
      token = body.token;
    });

    describe('addition of a new blog', () => {
      test('succeeds with valid data', async () => {
        const newBlog = {
          title: 'Go To Statement Considered Harmful',
          author: 'Edsger W. Dijkstra',
          url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
          likes: 5,
        };

        await api
          .post('/api/blogs')
          .set('Authorization', `Bearer ${token}`)
          .send(newBlog)
          .expect(201)
          .expect('Content-Type', /application\/json/);

        const blogsAtEnd = await helper.blogsInDb();
        expect(blogsAtEnd)
          .toHaveLength(helper.initialBlogs.length + helper.otherInitialBlogs.length + 1);
      });

      test('succeeds and and has correct user details', async () => {
        const newBlog = {
          title: 'Go To Statement Considered Harmful',
          author: 'Edsger W. Dijkstra',
          url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
          likes: 5,
        };

        const { body } = await api
          .post('/api/blogs')
          .set('Authorization', `Bearer ${token}`)
          .send(newBlog)
          .expect(201)
          .expect('Content-Type', /application\/json/);

        expect(_.pick(body.user, ['username', 'name', 'id']))
          .toEqual(_.pick(savedUser, ['username', 'name', 'id']));
      });

      test('fails without a title', async () => {
        const invalidBlog = {
          author: 'Jayanth PSY',
          url: 'https://localhost:8080/no-title',
          likes: 5,
        };
        await api
          .post('/api/blogs')
          .set('Authorization', `Bearer ${token}`)
          .send(invalidBlog)
          .expect(400);
      });

      test('fails without a url', async () => {
        const invalidBlog = {
          title: 'Is url field mandatory?',
          author: 'Jayanth PSY',
          likes: 1,
        };
        await api
          .post('/api/blogs')
          .set('Authorization', `Bearer ${token}`)
          .send(invalidBlog)
          .expect(400);
      });

      test('with no likes field gets likes: 0 by default', async () => {
        const newBlog = {
          title: 'This blog is not Liked',
          author: 'Jayanth PSY',
          url: 'https://localhost:8080/no-likes',
        };

        const { body } = await api
          .post('/api/blogs')
          .set('Authorization', `Bearer ${token}`)
          .send(newBlog)
          .expect(201)
          .expect('Content-Type', /application\/json/);
        expect(body.likes)
          .toBe(0);
      });
    });

    describe('deletion of a blog', () => {
      test('succeeds with an existing id of user\'s blog', async () => {
        const blogs = await helper.blogsInDb(savedUser.id);
        const blogToDelete = blogs[0];

        await api
          .delete(`/api/blogs/${blogToDelete.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(204);

        const blogsNew = await helper.blogsInDb(savedUser.id);
        expect(blogsNew.length)
          .toBe(blogs.length - 1);
      });

      test('fails with an existing id of other user\'s blog', async () => {
        const blogs = await helper.blogsInDb(otherSavedUser.id);
        const blogToDelete = blogs[0];

        await api
          .delete(`/api/blogs/${blogToDelete.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);

        const blogsNew = await helper.blogsInDb(otherSavedUser.id);
        expect(blogsNew.length)
          .toBe(blogs.length);
      });
    });

    describe('updating likes of a blog of same user', () => {
      test('succeeds with an existing id and responds with the same updated information', async () => {
        const blogs = await helper.blogsInDb(savedUser.id);
        const blogToUpdate = blogs[0];
        const updatedBlog = {
          ...blogToUpdate,
          likes: blogToUpdate.likes + Math.round(Math.random() * 10),
        };
        delete updatedBlog.id;

        const { body } = await api
          .put(`/api/blogs/${blogToUpdate.id}`)
          .send(updatedBlog)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', /application\/json/);

        expect(body.likes)
          .toBe(updatedBlog.likes);
      });

      test('changes reflect in the database with an existing id', async () => {
        const blogs = await helper.blogsInDb(savedUser.id);
        const blogToUpdate = blogs[0];
        const updatedBlog = {
          ...blogToUpdate,
          likes: blogToUpdate.likes + Math.round(Math.random() * 10),
        };
        delete updatedBlog.id;

        await api
          .put(`/api/blogs/${blogToUpdate.id}`)
          .send(updatedBlog)
          .set('Authorization', `Bearer ${token}`);

        const blogsNew = await helper.blogsInDb();
        expect(blogsNew)
          .toContainEqual({
            ...updatedBlog,
            id: blogToUpdate.id,
          });
      });
    });

    describe('updating likes of a blog of other user', () => {
      test('succeeds with an existing id and responds with the same updated information', async () => {
        const blogs = await helper.blogsInDb(otherSavedUser.id);
        const blogToUpdate = blogs[0];
        const updatedBlog = {
          ...blogToUpdate,
          likes: blogToUpdate.likes + Math.round(Math.random() * 10),
        };
        delete updatedBlog.id;

        const { body } = await api
          .put(`/api/blogs/${blogToUpdate.id}`)
          .send(updatedBlog)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', /application\/json/);

        expect(body.likes)
          .toBe(updatedBlog.likes);
      });

      test('changes reflect in the database with an existing id', async () => {
        const blogs = await helper.blogsInDb(otherSavedUser.id);
        const blogToUpdate = blogs[0];
        const updatedBlog = {
          ...blogToUpdate,
          likes: blogToUpdate.likes + Math.round(Math.random() * 10),
        };
        delete updatedBlog.id;

        await api
          .put(`/api/blogs/${blogToUpdate.id}`)
          .send(updatedBlog)
          .set('Authorization', `Bearer ${token}`);

        const blogsNew = await helper.blogsInDb(otherSavedUser.id);
        expect(blogsNew)
          .toContainEqual({
            ...updatedBlog,
            id: blogToUpdate.id,
          });
      });
    });

    describe('updating other information of a blog of same user', () => {
      test('succeeds with an existing id and responds with the same updated information', async () => {
        const blogs = await helper.blogsInDb(savedUser.id);
        const blogToUpdate = blogs[0];
        const updatedBlog = {
          ...blogToUpdate,
          author: 'Marshall Mayers',
        };
        delete updatedBlog.id;

        const { body } = await api
          .put(`/api/blogs/${blogToUpdate.id}`)
          .send(updatedBlog)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', /application\/json/);

        expect(_.pick(body, ['id', 'author', 'likes', 'url', 'title']))
          .toEqual(_.pick({
            ...updatedBlog,
            id: blogToUpdate.id,
          }, ['id', 'author', 'likes', 'url', 'title']));
      });

      test('changes reflect in the database with an existing id', async () => {
        const blogs = await helper.blogsInDb(savedUser.id);
        const blogToUpdate = blogs[0];
        const updatedBlog = {
          ...blogToUpdate,
          author: 'Marshall Mayers',
        };
        delete updatedBlog.id;

        await api
          .put(`/api/blogs/${blogToUpdate.id}`)
          .send(updatedBlog)
          .set('Authorization', `Bearer ${token}`);

        const blogsNew = await helper.blogsInDb();
        expect(blogsNew)
          .toContainEqual({
            ...updatedBlog,
            id: blogToUpdate.id,
          });
      });
    });

    describe('updating other information of a blog of other user', () => {
      test('changes do not reflect in the database with an existing id', async () => {
        const blogs = await helper.blogsInDb(otherSavedUser.id);
        const blogToUpdate = blogs[0];
        const updatedBlog = {
          ...blogToUpdate,
          author: 'Marshall',
        };
        delete updatedBlog.id;

        await api
          .put(`/api/blogs/${blogToUpdate.id}`)
          .send(updatedBlog)
          .set('Authorization', `Bearer ${token}`);

        const blogsNew = await helper.blogsInDb(otherSavedUser.id);
        expect(blogsNew)
          .toContainEqual(blogToUpdate);
      });
    });

    describe('addition of a new comment to a exisiting blog', () => {
      test('succeeds and responds with updated blog', async () => {
        const comment = { comment: 'Comment!!' };

        const blogs = await helper.blogsInDb(savedUser.id);
        const blogToComment = blogs[0];
        const { body } = await api
          .post(`/api/blogs/${blogToComment.id}/comments`)
          .send(comment)
          .set('Authorization', `Bearer ${token}`)
          .expect(201)
          .expect('Content-Type', /application\/json/);

        expect(body.comments)
          .toContain(comment.comment);

        expect(body.id)
          .toEqual(blogToComment.id);
      });
    });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
