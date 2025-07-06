const TelegramBot = require("node-telegram-bot-api");
const { loadCommands, commandList } = require("../handlers/telegram");
const { TELEGRAM_BOT_TOKEN, SERVER_URL } = require("../config/env");

let botInstance = null;
// Configuration
const start = async (req, res) => {
  try {
    const token = TELEGRAM_BOT_TOKEN;
    // Validate token
    if (!token) {
      console.error(
        "❌ Please set your TELEGRAM_BOT_TOKEN environment variable!"
      );
      console.error(
        "   Example: export TELEGRAM_BOT_TOKEN='123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11'"
      );
    }

    const bot = await new TelegramBot(token);
    botInstance = bot;

    bot.setWebHook(`${SERVER_URL}/webhook/telegram`);
    // Load all commands using the loadCommands function
    loadCommands(bot);

    // Error handling
    bot.on("webhook_error", (error) => {
      console.error("🚨 Webhook error:", error.message);
    });

    // Bot ready confirmation
    bot
      .getMe()
      .then(() => {
        console.log(`✅ Bot started successfully!`);

        bot
          .setMyCommands(commandList)
          .then(() => {
            console.log("✅ Bot commands set successfully!");
          })
          .catch((error) => {
            console.error("❌ Failed to set bot commands:", error.message);
          });
      })
      .catch((error) => {
        console.error("❌ Failed to start bot:", error.message);
        if (error.message.includes("404")) {
          console.error("💡 This usually means your bot token is invalid.");
        } else if (error.message.includes("BOT_COMMAND_INVALID")) {
          console.error("💡 Bot command format is invalid. Commands must:");
          console.error("   - Not include '/' prefix");
          console.error("   - Not include parameters like <url>");
          console.error("   - Be lowercase");
          console.error("   - Be 1-32 characters long");
        }
      });
    // res.status(200).json({
    //   status: "success",
    //   message: "Bot started successfully!",
    // });
  } catch (error) {
    console.error("❌ Error starting bot:", error.message);
  }
};
const getBot = () => {
  try {
    if (!botInstance) {
      throw new Error("Bot instance is not initialized. Call start() first.");
    }
    return botInstance;
  } catch (error) {
    console.error("❌ Error getting bot instance:", error.message);
    throw error;
  }
};

module.exports = {
  start,
  getBot,
};
