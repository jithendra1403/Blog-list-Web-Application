const listHelper = require('../utils/list_helper');

test('dummy returns one', () => {
  const blogs = [];

  const result = listHelper.dummy(blogs);
  expect(result)
    .toBe(1);
});

const listWithNoBlogs = [];

const listWithOneBlog = [
  {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    __v: 0,
  },
];

const listWithMoreBlogs = [
  {
    _id: '5a422a851b54a676234d17f7',
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    __v: 0,
  },
  {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    __v: 0,
  },
  {
    _id: '5a422b3a1b54a676234d17f9',
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    __v: 0,
  },
  {
    _id: '5a422b891b54a676234d17fa',
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10,
    __v: 0,
  },
  {
    _id: '5a422ba71b54a676234d17fb',
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0,
    __v: 0,
  },
  {
    _id: '5a422bc61b54a676234d17fc',
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
    __v: 0,
  },
];

describe('total likes', () => {
  test('when list has no blogs, equals to zero', () => {
    const result = listHelper.totalLikes(listWithNoBlogs);
    expect(result)
      .toBe(0);
  });

  test('when list has only one blog, equals the likes of that', () => {
    const result = listHelper.totalLikes(listWithOneBlog);
    expect(result)
      .toBe(5);
  });

  test('when list has more than one blog, equals the sum of likes of all blogs', () => {
    const result = listHelper.totalLikes(listWithMoreBlogs);
    expect(result)
      .toBe(36);
  });
});

describe('favorite blog', () => {
  test('when list has no blogs, equals to undefined', () => {
    const result = listHelper.favoriteBlog(listWithNoBlogs);
    expect(result)
      .toBeUndefined();
  });

  test('when list has only one blog, equals the only blog', () => {
    const result = listHelper.favoriteBlog(listWithOneBlog);
    expect(result)
      .toEqual({
        title: listWithOneBlog[0].title,
        author: listWithOneBlog[0].author,
        likes: listWithOneBlog[0].likes,
      });
  });

  test('when list has more than one blog, equals to the blag with the highest likes', () => {
    const result = listHelper.favoriteBlog(listWithMoreBlogs);
    expect(result)
      .toEqual({
        title: 'Canonical string reduction',
        author: 'Edsger W. Dijkstra',
        likes: 12,
      });
  });
});

describe('most blogs', () => {
  test('when list has no blogs, equals to undefined', () => {
    const result = listHelper.mostBlogs(listWithNoBlogs);
    expect(result)
      .toBeUndefined();
  });

  test('when list has only one blog, equals to author of that blog', () => {
    const result = listHelper.mostBlogs(listWithOneBlog);
    expect(result)
      .toEqual({
        author: listWithOneBlog[0].author,
        blogs: 1,
      });
  });

  test('when list has more than one blog, equals to the author with the most number of blogs', () => {
    const result = listHelper.mostBlogs(listWithMoreBlogs);
    expect(result)
      .toEqual({
        author: 'Robert C. Martin',
        blogs: 3,
      });
  });
});

describe('most likes', () => {
  test('when list has no blogs, equals to undefined', () => {
    const result = listHelper.mostLikes(listWithNoBlogs);
    expect(result)
      .toBeUndefined();
  });

  test('when list has only one blog, equals to the author of that blog', () => {
    const result = listHelper.mostLikes(listWithOneBlog);
    expect(result)
      .toEqual({
        author: listWithOneBlog[0].author,
        likes: 5,
      });
  });

  test('when list has more than one blog, equals to the author with the most number of blogs', () => {
    const result = listHelper.mostLikes(listWithMoreBlogs);
    expect(result)
      .toEqual({
        author: 'Edsger W. Dijkstra',
        likes: 17,
      });
  });
});
