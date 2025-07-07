// Import commands from commands.js
const { handleCommands, commandList } = require("./commands");
const { handleApiKeyCallback } = require("./callbacks");

const loadCommands = async (bot) => {
  try {
    // ✅ Set bot commands
    try {
      await bot.setMyCommands(commandList);
      console.log("✅ Bot commands set successfully!");
    } catch (error) {
      console.error("❌ Error setting bot commands:", error.message);
      throw error;
    }

    // ✅ Handle text messages
    bot.on("message", async (msg) => {
      if (!msg || !msg.text) {
        console.error("Invalid message received:", msg);
        return;
      }
      try {
        if (msg.text.startsWith("/")) {
          // Handle commands
          await handleCommands(bot, msg);
        } else {
          // Handle non-command messages (e.g., URLs for shortening)
          console.log("Non-command message:", msg.text);
          // You can add URL detection and auto-shortening here later
          // Example:
          // if (isUrl(msg.text)) {
          //   await handleUrlShortening(bot, msg);
          // }
        }
      } catch (error) {
        console.error("Error handling message:", error);
        await bot.sendMessage(
          msg.chat.id,
          "An error occurred while processing your message. Please try again later."
        );
        // ✅ Don't re-throw here - it will crash the bot
      }
    });

    // ✅ Handle callback queries (for both API key and short URL management)
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
        // ✅ Don't re-throw here - it will crash the bot
      }
    });

    // ✅ Handle inline queries (optional - for future features)
    bot.on("inline_query", async (query) => {
      try {
        // You can implement inline query handling here
        // For example, quick URL shortening via inline mode
        await bot.answerInlineQuery(query.id, []);
      } catch (error) {
        console.error("Error handling inline query:", error);
      }
    });

    // ✅ Handle pre-checkout queries (optional - for future payment features)
    bot.on("pre_checkout_query", async (query) => {
      try {
        await bot.answerPreCheckoutQuery(query.id, true);
      } catch (error) {
        console.error("Error handling pre-checkout query:", error);
      }
    });

    // ✅ Handle successful payments (optional - for future payment features)
    bot.on("successful_payment", async (msg) => {
      try {
        console.log("Successful payment received:", msg.successful_payment);
        // Handle successful payment logic here
      } catch (error) {
        console.error("Error handling successful payment:", error);
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

    console.log("✅ All event handlers loaded successfully!");
    console.log("🤖 Bot is ready to receive messages and callbacks!");
  } catch (error) {
    console.error("❌ Error loading commands:", error);
    throw error; // Re-throw only for critical setup errors
  }
};

module.exports = { loadCommands };
