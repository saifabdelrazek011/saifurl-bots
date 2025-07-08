const SaifurlsBotUsers = require("../../db/mongodb.js");
const { Keyboard } = require("telegram-keyboard");
const {
  handleSetDomain,
} = require("../../services/telegram/shorturl.services");
const { showMainMenu } = require("../../services/telegram/mainmenu.services");
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
  } catch {
    // Silent fail for delete message
  }
};

const commandList = [
  { command: "start", description: "Start the bot and register" },
  { command: "menu", description: "Show main menu" },
  { command: "apikey", description: "Manage your API keys" },
  { command: "shorturl", description: "Manage short URLs" },
  { command: "urls", description: "Alias for shorturl command" },
  { command: "setdomain", description: "Set your preferred domain" },
  { command: "help", description: "Show help information" },
  { command: "contact", description: "Contact information" },
  { command: "about", description: "About this bot" },
  { command: "todo", description: "Setup guide for new users" },
  { command: "justtest", description: "Get test API key (SoM/Converge only)" },
  { command: "ping", description: "Test bot responsiveness" },
];

const formattedCommandList = [
  { command: "/start", description: "Start the bot and register" },
  { command: "/menu", description: "Show main menu" },
  { command: "/apikey", description: "Manage your API keys" },
  { command: "/shorturl", description: "Manage short URLs" },
  { command: "/urls", description: "Alias for shorturl command" },
  { command: "/setdomain", description: "Set your preferred domain" },
  { command: "/help", description: "Show help information" },
  { command: "/contact", description: "Contact information" },
  { command: "/about", description: "About this bot" },
  { command: "/todo", description: "Setup guide for new users" },
  { command: "/justtest", description: "Get test API key (SoM/Converge only)" },
  { command: "/ping", description: "Test bot responsiveness" },
];

const handleCommands = async (bot, msg) => {
  if (!msg || !msg.text) {
    return;
  }
  try {
    switch (msg.text) {
      case "/start":
        await startCommand(bot, msg);
        break;
      case "/menu":
        await showMainMenu(bot, msg);
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
      case "/todo":
        await todoCommand(bot, msg);
        break;
      case "/justtest":
        await justtestCommand(bot, msg);
        break;
      case "/ping":
        await bot.sendMessage(msg.chat.id, "Pong! 🏓", {
          disable_web_page_preview: true,
          parse_mode: "Markdown",
        });
        break;
      default:
        await bot.sendMessage(
          msg.chat.id,
          "Unknown command. Please use /help to see available commands.",
          {
            disable_web_page_preview: true,
            parse_mode: "Markdown",
          }
        );
        break;
    }
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  }
};

const helpCommand = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, "Loading Help menu...", {
      disable_web_page_preview: true,
    });

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
      menuKeyboard,
      {
        disable_web_page_preview: true,
        parse_mode: "Markdown",
      }
    );
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
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
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  }
};

const aboutCommand = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, aboutMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
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
          disable_web_page_preview: true,
          parse_mode: "Markdown",
        }
      );

      setTimeout(async () => {
        await showMainMenu(bot, msg);
      }, 1500);
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
        disable_web_page_preview: true,
        parse_mode: "Markdown",
      }
    );

    setTimeout(async () => {
      await showMainMenu(bot, msg);
    }, 2000);
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  }
};

const apikeyCommand = async (bot, msg) => {
  try {
    const {
      showApiKeyMenu,
    } = require("../../services/telegram/apikey.services");
    await showApiKeyMenu(bot, msg);
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  }
};

const shorturlCommand = async (bot, msg) => {
  try {
    const {
      showShortUrlMenu,
    } = require("../../services/telegram/shorturl.services");
    await showShortUrlMenu(bot, msg);
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
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
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  }
};

const todoCommand = async (bot, msg) => {
  try {
    const existingUser = await SaifurlsBotUsers.findOne({
      userId: msg.from.id.toString(),
    });
    const chatId = msg.chat.id;

    // Check if user exists
    if (!existingUser) {
      await bot.sendMessage(
        chatId,
        "❌ **User not found!**\n\n" +
          "You need to run `/start` command first to register.\n\n" +
          "Please run: `/start`",
        {
          disable_web_page_preview: true,
          parse_mode: "Markdown",
        }
      );
      return;
    }

    // Check if user has API key
    const hasApiKey = existingUser.encryptedApiKey ? true : false;

    if (!hasApiKey) {
      const todoMessage =
        "🔑 **API Key Setup Required**\n\n" +
        "To use this bot, you need to set up your API key. Follow these steps:\n\n" +
        "**Step 1:** Go to [urls.saifdev.xyz](https://urls.saifdev.xyz)\n" +
        "• If you have an account: [Sign In](https://urls.saifdev.xyz/#/signin)\n" +
        "• If you don't have an account: [Sign Up](https://urls.saifdev.xyz/#/signup)\n\n" +
        "**Step 2:** After signing in, go to your [Profile Page](https://urls.saifdev.xyz/#/profile)\n" +
        "• Scroll down and verify your account if not already verified\n\n" +
        "**Step 3:** Go to the [Developer Page](https://urls.saifdev.xyz/#/developer)\n" +
        "• Copy your API key\n\n" +
        "**Step 4:** Return to this bot and run `/apikey`\n" +
        "• Set your API key using the menu\n\n" +
        "Once completed, you'll be able to use all bot features! 🚀\n\n" +
        "---\n" +
        "🧪 **Alternative for SoM/Converge participants:**\n" +
        "If you're part of Summer of Making or Converge, you can run `/justtest` to get a temporary shared API key for testing purposes only.";

      await bot.sendMessage(chatId, todoMessage, {
        disable_web_page_preview: true,
        parse_mode: "Markdown",
      });
      return;
    }

    // User has everything set up
    await bot.sendMessage(
      chatId,
      "✅ **Setup Complete!**\n\n" +
        "Your account is properly configured:\n" +
        "• ✅ User registered\n" +
        "• ✅ API key configured\n\n" +
        "You can now use all bot features! Use `/help` to see available commands.",
      {
        disable_web_page_preview: true,
        parse_mode: "Markdown",
      }
    );
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  }
};

const justtestCommand = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;

    const testMessage =
      "🧪 **Test API Key for SoM/Converge**\n\n" +
      "⚠️ **Important Warning:**\n" +
      "This is a shared public API key for testing purposes only.\n\n" +
      "**Test API Key:** `427bccadd994830104878d2852897adb249aca9cfa0af691aade53bdac7059da`\n\n" +
      "📝 **Notes:**\n" +
      "• This key is for Summer of Making and Converge participants only\n" +
      "• Limited functionality and rate limits apply\n" +
      "• **This key will be deleted after the testing process**\n" +
      "• For production use, please get your own API key via `/todo`\n\n" +
      "To use this test key:\n" +
      "1. Run `/apikey`\n" +
      "2. Select 'Set API Key'\n" +
      "3. Enter the test key above\n\n" +
      "⚠️ Remember: This is temporary and for testing only!";

    await bot.sendMessage(chatId, testMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  } catch {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  }
};

const setupBotCommands = async (bot) => {
  try {
    // Delete all existing commands to clean up old/invalid ones
    await bot.deleteMyCommands();

    // Convert our commandList to the format expected by Telegram
    const telegramCommands = commandList.map((cmd) => ({
      command: cmd.command,
      description: cmd.description,
    }));

    // Set the new commands
    await bot.setMyCommands(telegramCommands);
  } catch {
    // Silent fail for command setup
  }
};

module.exports = {
  handleCommands,
  commandList,
  startCommand,
  helpCommand,
  contactCommand,
  aboutCommand,
  todoCommand,
  justtestCommand,
  apikeyCommand,
  shorturlCommand,
  setdomainCommand,
  deleteMessage,
  setupBotCommands,
};
