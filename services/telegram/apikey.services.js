const SaifurlsBotUsers = require("../../db/mongodb.js");
const { errorMessage } = require("../../handlers/telegram/messages.js");
const { Keyboard, Key } = require("telegram-keyboard");
const { checkApiKeyExists } = require("../../utils/api/apikey.js");
const { deleteMessage } = require("../../handlers/telegram/commands.js");

const {
  encrypt,
  decrypt,
  createLookupHash,
} = require("../../utils/crypto.utils");

const showApiKeyMenu = async (bot, msg) => {
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

    const existingApiKey = existingUser ? existingUser.encryptedApiKey : null;

    const keyboard = Keyboard.make([
      existingApiKey
        ? [Key.callback("🔄 Update API Key", "update_api_key")]
        : [Key.callback("🔑 Set API Key", "set_api_key")],

      ...(existingApiKey
        ? [
            [Key.callback("👁️ View API Key", "view_api_key")],
            [Key.callback("🗑️ Delete API Key", "delete_api_key")],
          ]
        : []),
      [Key.callback("🔙 Back to Main Menu", "back_to_main")],
    ]).inline();

    await bot.sendMessage(msg.chat.id, "Please choose an action:", {
      ...keyboard,
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.error("Error in showApiKeyMenu:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

const setApiKey = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();

    const existingUser = await SaifurlsBotUsers.findOne({ userId });

    if (!existingUser) {
      await bot.sendMessage(
        chatId,
        "You should run /start command first to register.",
        {
          disable_web_page_preview: true,
        }
      );
      return;
    }

    if (existingUser.encryptedApiKey) {
      await bot.sendMessage(
        chatId,
        "API key already exists. Use Update API Key to change it.",
        {
          disable_web_page_preview: true,
        }
      );
      return;
    }

    await bot.sendMessage(chatId, "Please send your API key:", {
      disable_web_page_preview: true,
    });

    bot.once("message", async (msg) => {
      try {
        await deleteMessage(bot, msg);

        const apiKey = msg.text;

        if (!apiKey || apiKey.trim() === "") {
          return await bot.sendMessage(
            msg.chat.id,
            "API key cannot be empty.",
            {
              disable_web_page_preview: true,
            }
          );
        }

        const apiKeyExists = await checkApiKeyExists(apiKey);
        if (!apiKeyExists) {
          return await bot.sendMessage(msg.chat.id, "Invalid API key.", {
            disable_web_page_preview: true,
          });
        }

        const encryptedData = encrypt(apiKey);
        const lookupHash = createLookupHash(apiKey);

        // Update the existing user
        existingUser.encryptedApiKey = encryptedData;
        existingUser.lookupHash = lookupHash;

        await existingUser.save();
        await bot.sendMessage(msg.chat.id, "✅ API key set successfully!", {
          disable_web_page_preview: true,
        });

        setTimeout(async () => {
          const fakeMsg = {
            from: { id: existingUser.userId },
            chat: { id: msg.chat.id },
          };
          await showApiKeyMenu(bot, fakeMsg);
        }, 2000);
      } catch (error) {
        console.error("Error setting API key:", error);
        await bot.sendMessage(msg.chat.id, errorMessage, {
          disable_web_page_preview: true,
        });
      }
    });
  } catch (error) {
    console.error("Error in setApiKey:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage);
  }
};

const updateApiKey = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();

    const existingUser = await SaifurlsBotUsers.findOne({ userId });

    if (!existingUser) {
      await bot.sendMessage(
        chatId,
        "You need to run /start command first to register.",
        {
          disable_web_page_preview: true,
        }
      );
      return;
    }

    if (!existingUser.encryptedApiKey) {
      await bot.sendMessage(
        chatId,
        "No existing API key found. Please set it first using /apikey command.",
        {
          disable_web_page_preview: true,
        }
      );
      return;
    }

    await bot.sendMessage(chatId, "Please send your new API key:", {
      disable_web_page_preview: true,
    });

    bot.once("message", async (msg) => {
      try {
        await deleteMessage(bot, msg); // ✅ Add await and delete for security

        const apiKey = msg.text;

        if (!apiKey || apiKey.trim() === "") {
          return await bot.sendMessage(
            msg.chat.id,
            "API key cannot be empty.",
            {
              disable_web_page_preview: true,
            }
          );
        }

        const apiKeyExists = await checkApiKeyExists(apiKey); // ✅ Add await
        if (!apiKeyExists) {
          return await bot.sendMessage(msg.chat.id, "Invalid API key.", {
            disable_web_page_preview: true,
          });
        }

        const encryptedData = encrypt(apiKey);
        const lookupHash = createLookupHash(apiKey);

        // ✅ Fix: Use userId (string) instead of msg.from.id (number)
        await SaifurlsBotUsers.updateOne(
          { userId }, // Use the string userId
          { encryptedApiKey: encryptedData, lookupHash }
        );

        await bot.sendMessage(msg.chat.id, "✅ API key updated successfully!", {
          disable_web_page_preview: true,
        });

        setTimeout(async () => {
          const fakeMsg = {
            from: { id: parseInt(userId) },
            chat: { id: msg.chat.id },
          };
          await showApiKeyMenu(bot, fakeMsg);
        }, 2000);
      } catch (error) {
        console.error("Error updating API key:", error);
        await bot.sendMessage(msg.chat.id, errorMessage, {
          disable_web_page_preview: true,
        });
      }
    });
  } catch (error) {
    console.error("Error in updateApiKey:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const viewApiKey = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();

    const user = await SaifurlsBotUsers.findOne({ userId });

    if (!user) {
      await bot.sendMessage(
        chatId,
        "You need to run /start command first to register.",
        {
          disable_web_page_preview: true,
        }
      );
      return;
    }

    if (!user.encryptedApiKey) {
      await bot.sendMessage(chatId, "No API key found. Please set it first", {
        disable_web_page_preview: true,
      });
      return;
    }

    const apikey = decrypt(user.encryptedApiKey);

    const keyboard = Keyboard.make([
      [Key.callback("🗑️ Delete Message", "delete_api_key_msg")],
      [Key.callback("⬅️ Back to Menu", "back_to_menu")],
    ]).inline();

    const shouldBeDeletedMsg = await bot.sendMessage(
      chatId,
      `Your API key is: \n${apikey}\n\nThis message will be deleted in 30 seconds.`,
      keyboard,
      {
        disable_web_page_preview: true,
        parse_mode: "Markdown",
      }
    );

    // Auto-delete after 30 seconds
    setTimeout(async () => {
      try {
        await deleteMessage(bot, shouldBeDeletedMsg);
      } catch (error) {
        console.error("Error auto-deleting message:", error);
      }
    }, 30000);
  } catch (error) {
    console.error("Error viewing API key:", error);
    await bot.sendMessage(
      query.message.chat.id,
      "Failed to retrieve API key. Please try again.",
      {
        disable_web_page_preview: true,
      }
    );
  }
};

const deleteApiKey = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();

    const user = await SaifurlsBotUsers.findOne({ userId });

    if (!user || !user.encryptedApiKey) {
      return await bot.sendMessage(chatId, "No API key found to delete.", {
        disable_web_page_preview: true,
      });
    }

    const keyboard = Keyboard.make([
      [Key.callback("✅ Yes", "confirm_delete_api_key")],
      [Key.callback("❌ No", "cancel_delete_api_key")],
    ]).inline();

    await bot.sendMessage(
      chatId,
      "⚠️ Are you sure you want to delete your API key?",
      keyboard,
      {
        disable_web_page_preview: true,
      }
    );
  } catch (error) {
    console.error("Error in deleteApiKey:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleDeleteConfirmation = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();

    if (query.data === "confirm_delete_api_key") {
      await SaifurlsBotUsers.updateOne(
        { userId },
        { $unset: { encryptedApiKey: "", lookupHash: "" } }
      );

      await bot.sendMessage(chatId, "✅ API key deleted successfully!", {
        disable_web_page_preview: true,
      });

      setTimeout(async () => {
        const fakeMsg = {
          from: { id: parseInt(userId) },
          chat: { id: chatId },
        };
        await showApiKeyMenu(bot, fakeMsg);
      }, 2000);
    } else if (query.data === "cancel_delete_api_key") {
      await bot.sendMessage(chatId, "❌ API key deletion cancelled.", {
        disable_web_page_preview: true,
      });

      setTimeout(async () => {
        const fakeMsg = {
          from: { id: parseInt(userId) },
          chat: { id: chatId },
        };
        await showApiKeyMenu(bot, fakeMsg);
      }, 1500);
    }

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Error handling delete confirmation:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

module.exports = {
  showApiKeyMenu,
  setApiKey,
  updateApiKey,
  viewApiKey,
  deleteApiKey,
  handleDeleteConfirmation,
};
