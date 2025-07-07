const TelegramBot = require("node-telegram-bot-api");
const { loadCommands } = require("../handlers/telegram");
const { TELEGRAM_BOT_TOKEN, SERVER_URL } = require("../config/env");
const { promisify } = require("util");
const setTimeoutAsync = promisify(setTimeout);

let botInstance = null;

const start = async () => {
  // ✅ Remove req, res parameters
  try {
    const token = TELEGRAM_BOT_TOKEN;

    if (!token || !SERVER_URL) {
      throw new Error(
        "Telegram bot token or server URL is not set. Please check your environment variables."
      );
    }

    let bot;

    // Initialize the Telegram bot
    try {
      bot = new TelegramBot(token);
      botInstance = bot;
      console.log("✅ Telegram bot initialized successfully!");
    } catch (error) {
      console.error("❌ Error initializing Telegram bot:", error.message);
      throw error;
    }

    try {
      // Await webhook setup
      await bot.setWebHook(`${SERVER_URL}/webhook/telegram`);
      // Error handling
      bot.on("webhook_error", (error) => {
        // Wrap the async logic in an IIFE and handle the promise
        (async () => {
          console.error("❌ Webhook error:", error.message);
          console.error("Full error:", error);

          await setTimeoutAsync(5000);
          console.log("🔄 Retrying to reset webhook...");

          try {
            console.log("🔄 Attempting to reset webhook...");
            await bot.setWebHook(`${SERVER_URL}/webhook/telegram`);
            console.log("✅ Webhook reset successfully!");
          } catch (resetError) {
            console.error("❌ Failed to reset webhook:", resetError.message);
          }
        })().catch((asyncError) => {
          console.error(
            "❌ Error in webhook error handler:",
            asyncError.message
          );
        });
      });
    } catch (error) {
      console.error("❌ Error setting webhook:", error.message);
      throw error;
    }

    console.log("✅ Webhook set successfully!");

    try {
      await bot
        .getMe()
        .then((botInfo) => {
          console.log(`✅ Bot info retrieved: ${botInfo.username}`);
          try {
            console.log("🔄 Loading commands...");
            loadCommands(bot);
            console.log("✅ Commands loaded successfully!");
          } catch (error) {
            console.error("❌ Error loading commands:", error.message);
            throw error;
          }
        })
        .catch((error) => {
          console.error("❌ Error getting bot info:", error.message);
          throw error;
        });
    } catch (error) {
      console.error("❌ Error getting bot info:", error.message);
      throw error;
    }
  } catch (error) {
    console.error("❌ Error starting bot:", error.message);
    throw error;
  }
};

const getBot = () => {
  try {
    if (!botInstance) {
      throw new Error("Bot instance is not initialized. Call start() first.");
    }
    return botInstance;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  start,
  getBot,
};
