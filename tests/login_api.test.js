const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const supertest = require('supertest');
const _ = require('lodash');

const helper = require('./test_helper');
const app = require('../app');
const User = require('../models/user');

const api = supertest(app);

describe('logging in when there is initially a user in db', () => {
  const userDetails = helper.userDetails[0];
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash(userDetails.password, 10);
    const user = new User({
      ..._.pick(userDetails, ['username', 'name']),
      passwordHash,
    });

    await user.save();
  });

  test('succeeds with correct username and password', async () => {
    const res = await api
      .post('/api/login')
      .send(_.pick(userDetails, ['username', 'password']))
      .expect(200);

    const { body } = res;
    expect(body)
      .toHaveProperty('token');
    expect(body.name)
      .toBe(userDetails.name);
    expect(body.username)
      .toBe(userDetails.username);
  });

  test('fails if password is missing', async () => {
    await api
      .post('/api/login')
      .send(_.pick(userDetails, ['username']))
      .expect(401, { error: 'Invalid username or password' });
  });

  test('fails if username is missing', async () => {
    await api
      .post('/api/login')
      .send(_.pick(userDetails, ['password']))
      .expect(401, { error: 'Invalid username or password' });
  });

  test('fails if password is wrong', async () => {
    await api
      .post('/api/login')
      .send({
        username: userDetails.username,
        password: `${userDetails.password}xx`,
      })
      .expect(401, { error: 'Invalid username or password' });
  });

  test('fails if username is wrong', async () => {
    await api
      .post('/api/login')
      .send({
        username: `${userDetails.username}xx`,
        password: userDetails.password,
      })
      .expect(401, { error: 'Invalid username or password' });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
