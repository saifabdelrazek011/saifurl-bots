const SaifurlsBotUsers = require("../../db/mongodb.js");
const { Keyboard, Key } = require("telegram-keyboard");
const { errorMessage } = require("../../handlers/telegram/messages.js");

const showMainMenu = async (bot, msg, customMessage = null) => {
  try {
    const existingUser = await SaifurlsBotUsers.findOne({
      userId: msg.from.id.toString(),
    });

    if (!existingUser) {
      await bot.sendMessage(
        msg.chat.id,
        "You need to run /start command first to register.",
        {
          parse_mode: "Markdown",
        }
      );
      return;
    }

    const hasApiKey = existingUser.encryptedApiKey ? true : false;
    const preferredDomain = existingUser.preferredDomain || "sa.died.pw";

    const keyboard = Keyboard.make([
      [
        Key.callback("🔑 API Key Management", "main_apikey"),
        Key.callback("🔗 Short URLs", "main_shorturl"),
      ],
      [
        Key.callback("🌐 Domain Settings", "main_domain"),
        Key.callback("📊 Account Info", "main_account"),
      ],
      [
        Key.callback("ℹ️ Help", "main_help"),
        Key.callback("📞 Contact", "main_contact"),
      ],
    ]).inline();

    const statusText = hasApiKey
      ? "✅ API Key: Configured"
      : "❌ API Key: Not Set - Run /todo for setup guide";

    const menuText =
      customMessage ||
      `🤖 **Main Menu**\n\n` +
        `${statusText}\n` +
        `🌐 **Preferred Domain:** ${preferredDomain}\n\n` +
        `Choose an option below:` +
        (!hasApiKey
          ? "\n\n💡 **New user?** Run `/todo` for setup instructions!"
          : "");

    await bot.sendMessage(msg.chat.id, menuText, keyboard, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  } catch (error) {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  }
};

const handleMainMenuCallback = async (bot, query) => {
  try {
    await bot.answerCallbackQuery(query.id);

    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    await bot.deleteMessage(chatId, messageId);

    const fakeMsg = {
      from: { id: query.from.id },
      chat: { id: chatId },
    };

    switch (query.data) {
      case "main_apikey": {
        const { showApiKeyMenu } = require("./apikey.services");
        await showApiKeyMenu(bot, fakeMsg);
        break;
      }
      case "main_shorturl": {
        const { showShortUrlMenu } = require("./shorturl.services");
        await showShortUrlMenu(bot, fakeMsg);
        break;
      }
      case "main_domain": {
        const { handleSetDomain } = require("./shorturl.services");
        await handleSetDomain(bot, query);
        break;
      }
      case "main_account":
        await handleAccountInfo(bot, fakeMsg);
        break;
      case "main_help":
        await handleMainHelp(bot, fakeMsg);
        break;
      case "main_contact":
        await handleMainContact(bot, fakeMsg);
        break;
      default:
        await bot.sendMessage(chatId, "Unknown action.");
        break;
    }
  } catch (error) {
    await bot.sendMessage(query.message.chat.id, errorMessage);
  }
};

const handleAccountInfo = async (bot, msg) => {
  try {
    const user = await SaifurlsBotUsers.findOne({
      userId: msg.from.id.toString(),
    });

    if (!user) {
      await bot.sendMessage(
        msg.chat.id,
        "❌ User not found. Please run /start command first."
      );
      return;
    }

    const hasApiKey = user.encryptedApiKey ? "✅ Configured" : "❌ Not Set";
    const preferredDomain = user.preferredDomain || "sa.died.pw";
    const joinDate = new Date(user.createdAt).toLocaleDateString();

    const keyboard = Keyboard.make([
      [Key.callback("🔙 Back to Main Menu", "back_to_main")],
    ]).inline();

    const accountText =
      `👤 **Account Information**\n\n` +
      `🆔 **User ID:** \`${user.userId}\`\n` +
      `🔑 **API Key Status:** ${hasApiKey}\n` +
      `🌐 **Preferred Domain:** ${preferredDomain}\n` +
      `📅 **Member Since:** ${joinDate}\n` +
      `🔄 **Last Updated:** ${new Date(user.updatedAt).toLocaleDateString()}`;

    await bot.sendMessage(msg.chat.id, accountText, {
      ...keyboard,
      parse_mode: "Markdown",
    });
  } catch (error) {
    await bot.sendMessage(msg.chat.id, errorMessage);
  }
};

const handleMainHelp = async (bot, msg) => {
  try {
    const keyboard = Keyboard.make([
      [Key.callback("🔙 Back to Main Menu", "back_to_main")],
    ]).inline();

    const helpText =
      `ℹ️ **Help & Commands**\n\n` +
      `**Main Commands:**\n` +
      `• \`/start\` - Initialize your account\n` +
      `• \`/apikey\` - Manage API keys\n` +
      `• \`/shorturl\` - Manage short URLs\n` +
      `• \`/setdomain\` - Set preferred domain\n\n` +
      `**Quick Access:**\n` +
      `• Use the main menu for easy navigation\n` +
      `• All actions return to relevant menus\n` +
      `• Domain preference affects all URLs\n\n` +
      `**Need Help?**\n` +
      `Use /contact for support information.`;

    await bot.sendMessage(msg.chat.id, helpText, {
      ...keyboard,
      parse_mode: "Markdown",
    });
  } catch (error) {
    await bot.sendMessage(msg.chat.id, errorMessage);
  }
};

const handleMainContact = async (bot, msg) => {
  try {
    const keyboard = Keyboard.make([
      [Key.callback("🔙 Back to Main Menu", "back_to_main")],
    ]).inline();

    const contactText =
      `📞 **Contact Information**\n\n` +
      `**Support:**\n` +
      `• Email: dev@saifdev.xyz\n\n` +
      `• Bot Guide: urls.saifdev.xyz/#/bots\n\n` +
      `**Report Issues:**\n` +
      `• GitHub: github.com/saifabdelrazk011/saifurl-bots\n`;

    await bot.sendMessage(msg.chat.id, contactText, keyboard, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  } catch (error) {
    await bot.sendMessage(msg.chat.id, errorMessage);
  }
};

const handleBackToMain = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    await bot.deleteMessage(chatId, messageId);

    const fakeMsg = {
      from: { id: query.from.id },
      chat: { id: chatId },
    };

    await showMainMenu(bot, fakeMsg);
  } catch (error) {
    await bot.sendMessage(query.message.chat.id, errorMessage);
  }
};

const handleContactCallback = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    await bot.deleteMessage(chatId, messageId);

    const fakeMsg = {
      from: { id: query.from.id },
      chat: { id: chatId },
    };

    await handleMainContact(bot, fakeMsg);
  } catch (error) {
    await bot.sendMessage(query.message.chat.id, errorMessage);
  }
};

module.exports = {
  showMainMenu,
  handleMainMenuCallback,
  handleAccountInfo,
  handleMainHelp,
  handleMainContact,
  handleBackToMain,
  handleContactCallback,
};
