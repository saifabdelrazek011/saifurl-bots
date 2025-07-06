const Joi = require("joi");

const urlSchema = Joi.string()
  .pattern(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  )
  .message("Invalid URL format");

module.exports = {
  urlSchema,
};
