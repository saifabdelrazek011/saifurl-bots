const SaifurlsBotUsers = require("../../db/mongodb.js");
const { errorMessage } = require("../../handlers/telegram/messages.js");
const { Keyboard, Key } = require("telegram-keyboard");
const {
  encrypt,
  decrypt,
  createLookupHash,
} = require("../../utils/crypto.utils");

const deleteMessage = async (bot, msg) => {
  try {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};

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

      // Only show View and Delete if API key exists
      ...(existingApiKey
        ? [
            [Key.callback("👁️ View API Key", "view_api_key")],
            [Key.callback("🗑️ Delete API Key", "delete_api_key")],
          ]
        : []),
    ]).inline();

    bot.sendMessage(msg.chat.id, "Please choose an action:", keyboard);
  } catch (error) {
    console.error("Error in apikeyCommand:", error);
    bot.sendMessage(msg.chat.id, errorMessage, {
      parse_mode: "Markdown",
    });
  }
};

const setApiKey = async (bot, chatId) => {
  bot.sendMessage(chatId, "Please send your API key:");
  bot.once("message", async (msg) => {
    const apiKey = msg.text;

    if (!apiKey) {
      return bot.sendMessage(msg.chat.id, "API key cannot be empty.");
    }
    const encryptedData = encrypt(apiKey);
    const lookupHash = createLookupHash(apiKey);

    try {
      const existingUser = await SaifurlsBotUsers.findOne({
        userId: msg.from.id,
      });

      // If user does not exist, prompt them to register
      if (!existingUser) {
        bot.sendMessage(
          msg.chat.id,
          "You should run /start command first to register."
        );
      }

      // Check if the user already has an API key
      if (existingUser && existingUser.encryptedApiKey) {
        bot.sendMessage(
          msg.chat.id,
          "API key already exists. Use Update API Key to change it."
        );
      }

      // If user does not exist, create a new record
      existingUser.encryptedApiKey = encryptedData;
      existingUser.lookupHash = lookupHash;

      await existingUser.save();
      bot.sendMessage(msg.chat.id, "API key set successfully!");
    } catch (error) {
      console.error("Error setting API key:", error);
      bot.sendMessage(msg.chat.id, errorMessage);
    }
  });
};

const updateApiKey = async (bot, chatId) => {
  bot.sendMessage(chatId, "Please send your new API key:");
  bot.once("message", async (msg) => {
    const apiKey = msg.text;

    if (!apiKey) {
      return bot.sendMessage(msg.chat.id, "API key cannot be empty.");
    }
    const encryptedData = encrypt(apiKey);
    const lookupHash = createLookupHash(apiKey);

    try {
      const existingUser = await SaifurlsBotUsers.findOne({
        userId: msg.from.id,
      });

      if (!existingUser.encryptedApiKey) {
        bot.sendMessage(
          msg.chat.id,
          "No existing API key found. Please set it first. Use /apikey command."
        );
        return;
      }

      if (existingUser) {
        // If user exists, update the API key
        await SaifurlsBotUsers.updateOne(
          { userId: msg.from.id },
          { encryptedApiKey: encryptedData, lookupHash },
          { new: true }
        );
        bot.sendMessage(msg.chat.id, "API key updated successfully!");
      } else {
        bot.sendMessage(
          msg.chat.id,
          "No existing API key found. Please set it first."
        );
      }
    } catch (error) {
      console.error("Error updating API key:", error);
      bot.sendMessage(msg.chat.id, errorMessage);
    }
  });
};

// const deleteApiKeyMessage = (bot, chatId) => {
//   bot.sendMessage(chatId, "Are you sure you want to delete your API key?", {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           { text: "Yes", callback_data: "confirm_delete_api_key_msg" },
//           { text: "No", callback_data: "cancel_delete_api_key_msg" },
//         ],
//       ],
//     },
//   });
// };

const viewApiKey = async (bot, chatId) => {
  try {
    const user = await SaifurlsBotUsers.findOne({ userId: chatId });
    const apikey = user ? decrypt(user.encryptedApiKey) : null;

    const keyboard = Keyboard.make([
      [Key.callback("🗑️ Delete API Key Message", "delete_api_key_msg")],
      [Key.callback("⬅️ Back to API Menu", "main_menu")],
    ]).inline();

    if (!apikey) {
      bot.sendMessage(chatId, "No API key found.");
      return;
    }

    const shouldBeDeletedMsg = await bot.sendMessage(
      chatId,
      `Your API key is: \n${apikey} \nThis message will be deleted in 30 seconds.`,
      keyboard
    );

    bot.on("callback_query", async (query) => {
      const { data } = query;
      if (data === "delete_api_key_msg") {
        await deleteMessage(bot, shouldBeDeletedMsg);
        bot.sendMessage(chatId, "API key message deleted.");
      }
      if (data === "main_menu") {
        await showApiKeyMenu(bot, msg);
      }
    });

    if (!shouldBeDeletedMsg) {
      return bot.sendMessage(chatId, "Failed to retrieve API key.");
    }
    setTimeout(async () => {
      await deleteMessage(bot, shouldBeDeletedMsg);
    }, 30000);
  } catch (error) {
    console.error("Error viewing API key:", error);
    bot.sendMessage(chatId, "Failed to retrieve API key. Please try again.");
  }
};

const deleteApiKey = async (bot, chatId) => {
  try {
    const user = await SaifurlsBotUsers.findOne({ userId: chatId });

    if (!user || !user.encryptedApiKey) {
      return bot.sendMessage(chatId, "No API key found to delete.");
    }
    const keyboard = Keyboard.make([
      [Key.callback("Yes", "confirm_delete_api_key")],
      [Key.callback("No", "cancel_delete_api_key")],
    ]).inline();

    bot.sendMessage(
      chatId,
      "Are you sure you want to delete your API key?",
      keyboard
    );

    bot.once("callback_query", async (query) => {
      const { data } = query;

      if (data === "confirm_delete_api_key") {
        await SaifurlsBotUsers.updateOne(
          { userId: chatId },
          { $unset: { encryptedApiKey: "", lookupHash: "" } }
        );
        bot.sendMessage(chatId, "API key deleted successfully!");
      } else if (data === "cancel_delete_api_key") {
        bot.sendMessage(chatId, "API key deletion cancelled.");
      }
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    bot.sendMessage(chatId, errorMessage);
  }
};

module.exports = {
  showApiKeyMenu,
  setApiKey,
  updateApiKey,
  viewApiKey,
  deleteApiKey,
};
