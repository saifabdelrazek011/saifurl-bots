const mongoose = require("mongoose");

const saifurlsBotUsersSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  languageCode: {
    type: String,
    required: false,
  },
  isBot: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  encryptedApiKey: {
    type: String,
    required: false,
  },
  lookupHash: {
    type: String,
    required: false,
  },
});

const SaifurlsBotUsers = mongoose.model(
  "SaifurlsBotUsers",
  saifurlsBotUsersSchema,
  "saifurls_bot_users"
);

module.exports = SaifurlsBotUsers;
