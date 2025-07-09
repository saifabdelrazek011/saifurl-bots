// Import commands from commands.js
const { handleCommands, setupBotCommands } = require("./commands");
const { handleApiKeyCallback } = require("./callbacks");

const loadCommands = async (bot) => {
  try {
    // Handle text messages
    bot.on("message", async (msg) => {
      if (!msg || !msg.text) {
        console.error("Invalid message received:", msg);
        return;
      }
      try {
        if (msg.text.startsWith("/")) {
          // Handle commands
          await handleCommands(bot, msg);
        }
      } catch (error) {
        console.error("Error handling message:", error);
        await bot.sendMessage(
          msg.chat.id,
          "An error occurred while processing your message. Please try again later."
        );
      }
    });

    bot.on("callback_query", async (query) => {
      if (!query || !query.data) {
        console.error("Invalid callback query received:", query);
        return;
      }
      try {
        // Handle all callback queries (API key and short URL callbacks)
        await handleApiKeyCallback(bot, query);
      } catch (error) {
        console.error("Error handling callback query:", error);
        await bot.answerCallbackQuery(query.id, {
          text: "An error occurred while processing your request. Please try again later.",
          show_alert: true,
        });
      }
    });

    // ✅ Handle bot errors
    bot.on("error", (error) => {
      console.error("Bot error occurred:", error);
    });

    // ✅ Handle polling errors
    bot.on("polling_error", (error) => {
      console.error("Polling error occurred:", error);
    });

    console.log("🤖 Bot is ready to receive messages and callbacks!");
  } catch (error) {
    console.error("❌ Error loading commands:", error);
    throw error; // Re-throw only for critical setup errors
  }
};

module.exports = { loadCommands, setupBotCommands };
