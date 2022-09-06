require('dotenv')
  .config();

const PORT = process.env.PORT || 3003;

let { MONGODB_URL } = process.env;
if (process.env.NODE_ENV === 'test') {
  MONGODB_URL = process.env.TEST_MONGODB_URL;
}
const { SECRET } = process.env;

module.exports = {
  mongoUrl: MONGODB_URL,
  PORT,
  SECRET,
};
