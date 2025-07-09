/* eslint-disable no-undef */
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Export environment variables
module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  SERVER_URL: process.env.SERVER_URL,
  SAIFAPI_URL: process.env.SAIFAPI_URL || "http://localhost:3333/v1",
  PUBLIC_API_KEY: process.env.PUBLIC_API_KEY || "public_api_key",

  MONGODB_URI: process.env.MONGODB_URI,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  HASH_SALT: process.env.HASH_SALT,

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
};
