const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const supertest = require('supertest');

const helper = require('./test_helper');
const app = require('../app');
const User = require('../models/user');

const api = supertest(app);

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('NotAfraid', 10);
    const user = new User({
      username: 'root',
      name: 'Superuser',
      passwordHash,
    });

    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'jtesla',
      name: 'Jayanth PSY',
      password: 'LoseYourself',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames)
      .toContain(newUser.username);
  });

  test('creation fails with an existing username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root',
      name: 'Admin',
      password: 'Venom',
    };

    const { body } = await api
      .post('/api/users')
      .send(newUser)
      .expect(400);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length);

    expect(body.error)
      .toBe(`User validation failed: username: Error, expected \`username\` to be unique. Value: \`${newUser.username}\``);
  });

  test('creation fails with a short username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'jj',
      name: 'Jay Jay',
      password: 'Godzilla',
    };

    const { body } = await api
      .post('/api/users')
      .send(newUser)
      .expect(400);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length);

    expect(body.error)
      .toBe('User validation failed: username: should be at least 3 characters long');
  });

  test('creation fails with a short username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'z-man',
      name: 'Zeeman',
      password: 'sh',
    };

    const { body } = await api
      .post('/api/users')
      .send(newUser)
      .expect(400);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length);

    expect(body.error)
      .toBe('User validation failed: password: should be at least 3 characters long');
  });

  test('creation fails with a no username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      name: 'Hollow man',
      password: 'Without Me',
    };

    const { body } = await api
      .post('/api/users')
      .send(newUser)
      .expect(400);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length);

    expect(body.error)
      .toBe('User validation failed: username: field is mandatory');
  });

  test('creation fails with a no password', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'elliot',
      name: 'Elliot',
    };

    const { body } = await api
      .post('/api/users')
      .send(newUser)
      .expect(400);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length);

    expect(body.error)
      .toBe('User validation failed: password: field is mandatory');
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
