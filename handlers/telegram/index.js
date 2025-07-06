// Import commands from commands.js
const { handleCommands } = require("./commands");
const { handleApiKeyCallback } = require("./callbacks");

const loadCommands = (bot, res) => {
  try {
    bot.on("message", (msg) => {
      console.log("Received message:", msg.text);
      handleCommands(bot, msg);
    });

    bot.on("callback_query", (query) => {
      handleApiKeyCallback(bot, query);
    });
  } catch (error) {
    console.error("Error loading commands:", error);
    bot.sendMessage(
      query.message.chat.id,
      "An error occurred while processing your request. Please try again later."
    );
  }
};

module.exports = { loadCommands };
