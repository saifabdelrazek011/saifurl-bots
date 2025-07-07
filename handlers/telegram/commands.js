const SaifurlsBotUsers = require("../../db/mongodb.js");
const { Keyboard } = require("telegram-keyboard");
const { handleSetDomain } = require("../../services/telegram/shorturl.services");
const {
  welcomeMessage,
  welcomeBackMessage,
  helpMessage,
  contactMessage,
  aboutMessage,
  errorMessage,
} = require("./messages");

const deleteMessage = async (bot, msg) => {
  try {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};

const commandList = [
  { command: "start", description: "Start the bot and register" },
  { command: "apikey", description: "Manage your API keys" },
  { command: "shorturl", description: "Manage short URLs" },
  { command: "urls", description: "Alias for shorturl command" },
  { command: "setdomain", description: "Set your preferred domain" },
  { command: "help", description: "Show help information" },
  { command: "contact", description: "Contact information" },
  { command: "about", description: "About this bot" },
  { command: "ping", description: "Test bot responsiveness" },
];

const formattedCommandList = [
  { command: "/start", description: "Start the bot and register" },
  { command: "/apikey", description: "Manage your API keys" },
  { command: "/shorturl", description: "Manage short URLs" },
  { command: "/urls", description: "Alias for shorturl command" },
  { command: "/setdomain", description: "Set your preferred domain" },
  { command: "/help", description: "Show help information" },
  { command: "/contact", description: "Contact information" },
  { command: "/about", description: "About this bot" },
  { command: "/ping", description: "Test bot responsiveness" },
];

const handleCommands = async (bot, msg) => {
  if (!msg || !msg.text) {
    console.error("Invalid message received:", msg);
    return;
  }
  try {
    switch (msg.text) {
      case "/start":
        await startCommand(bot, msg);
        break;
      case "/apikey":
        await apikeyCommand(bot, msg);
        break;
      case "/shorturl":
      case "/urls":
        await shorturlCommand(bot, msg);
        break;
      case "/setdomain":
        await setdomainCommand(bot, msg);
        break;
      case "/help":
        await helpCommand(bot, msg);
        break;
      case "/contact":
        await contactCommand(bot, msg);
        break;
      case "/about":
        await aboutCommand(bot, msg);
        break;
      case "/ping":
        await bot.sendMessage(msg.chat.id, "Pong! 🏓", {
          parse_mode: "Markdown",
        });
        break;
      default:
        await bot.sendMessage(
          msg.chat.id,
          "Unknown command. Please use /help to see available commands.",
          {
            parse_mode: "Markdown",
          }
        );
        break;
    }
  } catch (error) {
    console.error("Error handling command:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

const helpCommand = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, "Loading Help menu...");

    const menuKeyboard = Keyboard.make([
      ["/start", "/help"],
      ["/apikey", "/shorturl"],
      ["/about", "/contact"],
    ]).reply();

    await bot.sendMessage(
      chatId,
      helpMessage.replace(
        "{commands}",
        formattedCommandList
          .map((cmd) => `${cmd.command} - ${cmd.description}`)
          .join("\n")
      ),
      {
        parse_mode: "Markdown",
        ...menuKeyboard,
      }
    );
  } catch (error) {
    console.error("Error in helpCommand:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

const contactCommand = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, contactMessage, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.error("Error in contactCommand:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

const aboutCommand = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, aboutMessage, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error in aboutCommand:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

const startCommand = async (bot, msg) => {
  try {
    const existingUser = await SaifurlsBotUsers.findOne({
      userId: msg.from.id.toString(),
    });
    const chatId = msg.chat.id;
    const userFirstName = msg.from.first_name || "User";

    if (existingUser) {
      await bot.sendMessage(
        chatId,
        welcomeBackMessage.replace("{user}", userFirstName),
        {
          parse_mode: "Markdown",
        }
      );
      return;
    }

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
    await bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

// API Key command handler
const apikeyCommand = async (bot, msg) => {
  try {
    const {
      showApiKeyMenu,
    } = require("../../services/telegram/apikey.services");
    await showApiKeyMenu(bot, msg);
  } catch (error) {
    console.error("Error in apikeyCommand:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

// ✅ Short URL command handler
const shorturlCommand = async (bot, msg) => {
  try {
    const {
      showShortUrlMenu,
    } = require("../../services/telegram/shorturl.services");
    await showShortUrlMenu(bot, msg);
  } catch (error) {
    console.error("Error in shorturlCommand:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

// ✅ Set Domain command handler
const setdomainCommand = async (bot, msg) => {
  try {
    const fakeQuery = {
      message: {
        chat: { id: msg.chat.id },
        message_id: msg.message_id,
      },
      from: { id: msg.from.id },
    };
    
    await handleSetDomain(bot, fakeQuery);
  } catch (error) {
    console.error("Error in setdomainCommand:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

module.exports = {
  handleCommands,
  commandList,
  startCommand,
  helpCommand,
  contactCommand,
  aboutCommand,
  apikeyCommand,
  shorturlCommand,
  setdomainCommand,
  deleteMessage,
};
