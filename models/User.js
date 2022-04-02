const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');

module.exports = mongoose.model('Users', new mongoose.Schema({
  teleBotId: Number,
  teleChatId: Number,
  teleChatData: Object,
  userLoginInfo: Object,
  userCookie: Object,
  userRole: Number,
  queue: Boolean,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}).plugin(findOrCreate))