const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'field is mandatory'],
    minlength: [3, 'should be at least 3 characters long'],
    unique: true,
  },
  name: String,
  passwordHash: {
    type: String,
    required: [true, 'field is mandatory'],
  },
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
    },
  ],
});

userSchema.plugin(uniqueValidator);

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    // the passwordHash should not be revealed
    delete returnedObject.passwordHash;
    returnedObject.blogs.forEach((blog) => blog.toString());
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
