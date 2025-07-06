const { Keyboard } = require("telegram-keyboard");
const {
  welcomeMessage,
  welcomeBackMessage,
  errorMessage,
  helpMessage,
} = require("./messages");
const SaifurlsBotUsers = require("../../db/mongodb");
const { showApiKeyMenu } = require("../../services/telegram/apikey.services");

// Export command list for help - Fixed for Telegram API
const commandList = [
  { command: "start", description: "Start the bot" },
  { command: "help", description: "Show help" },
  { command: "about", description: "About this bot" },
  { command: "ping", description: "Test bot response" },
  { command: "shorten", description: "Shorten URL" },
  { command: "expand", description: "Expand URL" },
  { command: "groupinfo", description: "Group info" },
  { command: "apikey", description: "Manage API keys" },
];

// Helper function to format commands for help display
const formattedCommandList = [
  { command: "/start", description: "Start the bot" },
  { command: "/help", description: "Show help" },
  { command: "/about", description: "About this bot" },
  { command: "/ping", description: "Test bot response" },
  { command: "/shorten <url>", description: "Shorten URL" },
  { command: "/expand <url>", description: "Expand URL" },
  { command: "/groupinfo", description: "Group info" },
  { command: "/apikey", description: "Manage API keys" },
];

const startCommand = async (bot, msg) => {
  try {
    // Check if user already exists in the database
    const existingUser = await SaifurlsBotUsers.findOne({
      userId: msg.from.id.toString(),
    });
    const chatId = msg.chat.id;
    const userFirstName = msg.from.first_name || "User";

    if (existingUser) {
      // If user exists, send welcome message
      await bot.sendMessage(
        chatId,
        welcomeBackMessage.replace("{user}", userFirstName),
        {
          parse_mode: "Markdown",
        }
      );
      return;
    }

    // If user does not exist, create a new record
    const newUser = new SaifurlsBotUsers({
      userId: msg.from.id.toString(),
      username: msg.from.username || "",
      firstName: msg.from.first_name || "",
      lastName: msg.from.last_name || "",
      languageCode: msg.from.language_code || "",
      isBot: msg.from.is_bot || false,
    });
    await newUser.save();
    await bot.sendMessage(
      chatId,
      welcomeMessage.replace("{user}", userFirstName),
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error in startCommand:", error);
    bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

const apikeyCommand = async (bot, msg) => {
  await showApiKeyMenu(bot, msg);
};

const helpCommand = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "Loading Help menu...");

    const menuKeyboard = Keyboard.make([
      ["/start", "/help"],
      ["/apikey", "/about"],
    ]).reply();

    bot.sendMessage(
      chatId,
      helpMessage.replace(
        "{commands}",
        formattedCommandList
          .map((cmd) => `${cmd.command} - ${cmd.description}`)
          .join("\n")
      ),
      {
        parse_mode: "Markdown",
      },
      menuKeyboard
    );
  } catch (error) {
    console.error("Error in helpCommand:", error);
    bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

const contactCommand = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      "For support, please contact us at [dev@saifdev.xyz](mailto:dev@saifdev.xyz) or fill the contact form [Here](https://urls.saifdev.xyz/contact).",
      {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }
    );
  } catch (error) {
    console.error("Error in contactCommand:", error);
    bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

const handleCommands = (bot, msg) => {
  if (!msg || !msg.text) {
    console.error("Invalid message received:", msg);
    return;
  }
  try {
    switch (msg.text) {
      case "/start":
        startCommand(bot, msg);
        break;
      case "/apikey":
        apikeyCommand(bot, msg);
        break;
      case "/help":
        helpCommand(bot, msg);
        break;
      case "/contact":
        contactCommand(bot, msg);
        break;
    }
  } catch (error) {
    console.error("Error handling command:", error);
    bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

module.exports = {
  commandList,
  formattedCommandList,
  startCommand,
  apikeyCommand,
  handleCommands,
};
