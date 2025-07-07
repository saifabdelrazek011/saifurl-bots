const SaifurlsBotUsers = require("../../db/mongodb.js");
const { errorMessage } = require("../../handlers/telegram/messages.js");
const { Keyboard, Key } = require("telegram-keyboard");
const { checkApiKeyExists } = require("../../utils/api/api.utils.js");
const { deleteMessage } = require("../../handlers/telegram/commands.js");

const {
  encrypt,
  decrypt,
  createLookupHash,
} = require("../../utils/crypto.utils");

const showApiKeyMenu = async (bot, msg) => {
  // ✅ This should be for commands, not callbacks
  try {
    const existingUser = await SaifurlsBotUsers.findOne({
      userId: msg.from.id.toString(),
    });

    if (!existingUser) {
      await bot.sendMessage(
        // ✅ Add await
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
    ]).inline();

    await bot.sendMessage(msg.chat.id, "Please choose an action:", keyboard); // ✅ Add await
  } catch (error) {
    console.error("Error in showApiKeyMenu:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      // ✅ Add await
      parse_mode: "Markdown",
    });
  }
};

const setApiKey = async (bot, query) => {
  try {
    const chatId = query.message.chat.id; // ✅ Fix: Use query.message.chat.id
    const userId = query.from.id.toString(); // ✅ Fix: Use query.from.id

    const existingUser = await SaifurlsBotUsers.findOne({ userId });

    if (!existingUser) {
      await bot.sendMessage(
        // ✅ Add await
        chatId,
        "You should run /start command first to register."
      );
      return;
    }

    // ✅ Check if API key already exists BEFORE asking for input
    if (existingUser.encryptedApiKey) {
      await bot.sendMessage(
        // ✅ Add await
        chatId,
        "API key already exists. Use Update API Key to change it."
      );
      return;
    }

    await bot.sendMessage(chatId, "Please send your API key:"); // ✅ Add await

    bot.once("message", async (msg) => {
      try {
        // ✅ Delete the user's API key message for security
        await deleteMessage(bot, msg);

        const apiKey = msg.text;

        if (!apiKey || apiKey.trim() === "") {
          return await bot.sendMessage(msg.chat.id, "API key cannot be empty."); // ✅ Add await
        }

        const apiKeyExists = await checkApiKeyExists(apiKey); // ✅ Add await
        if (!apiKeyExists) {
          return await bot.sendMessage(msg.chat.id, "Invalid API key."); // ✅ Add await
        }

        const encryptedData = encrypt(apiKey);
        const lookupHash = createLookupHash(apiKey);

        // Update the existing user
        existingUser.encryptedApiKey = encryptedData;
        existingUser.lookupHash = lookupHash;

        await existingUser.save(); // ✅ Add await
        await bot.sendMessage(msg.chat.id, "✅ API key set successfully!"); // ✅ Add await
      } catch (error) {
        console.error("Error setting API key:", error);
        await bot.sendMessage(msg.chat.id, errorMessage); // ✅ Add await
      }
    });
  } catch (error) {
    console.error("Error in setApiKey:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage); // ✅ Add await and fix chatId
  }
};

const updateApiKey = async (bot, query) => {
  try {
    const chatId = query.message.chat.id; // ✅ Fix: Use query.message.chat.id
    const userId = query.from.id.toString(); // ✅ Fix: Use query.from.id

    const existingUser = await SaifurlsBotUsers.findOne({ userId });

    if (!existingUser) {
      await bot.sendMessage(
        // ✅ Add await
        chatId,
        "You need to run /start command first to register."
      );
      return;
    }

    if (!existingUser.encryptedApiKey) {
      await bot.sendMessage(
        // ✅ Add await
        chatId,
        "No existing API key found. Please set it first using /apikey command."
      );
      return;
    }

    await bot.sendMessage(chatId, "Please send your new API key:"); // ✅ Add await

    bot.once("message", async (msg) => {
      try {
        await deleteMessage(bot, msg); // ✅ Add await and delete for security

        const apiKey = msg.text;

        if (!apiKey || apiKey.trim() === "") {
          return await bot.sendMessage(msg.chat.id, "API key cannot be empty."); // ✅ Add await
        }

        const apiKeyExists = await checkApiKeyExists(apiKey); // ✅ Add await
        if (!apiKeyExists) {
          return await bot.sendMessage(msg.chat.id, "Invalid API key."); // ✅ Add await
        }

        const encryptedData = encrypt(apiKey);
        const lookupHash = createLookupHash(apiKey);

        // ✅ Fix: Use userId (string) instead of msg.from.id (number)
        await SaifurlsBotUsers.updateOne(
          { userId }, // Use the string userId
          { encryptedApiKey: encryptedData, lookupHash }
        );

        await bot.sendMessage(msg.chat.id, "✅ API key updated successfully!"); // ✅ Add await
      } catch (error) {
        console.error("Error updating API key:", error);
        await bot.sendMessage(msg.chat.id, errorMessage); // ✅ Add await
      }
    });
  } catch (error) {
    console.error("Error in updateApiKey:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage); // ✅ Add await and fix chatId
  }
};

const viewApiKey = async (bot, query) => {
  try {
    const chatId = query.message.chat.id; // ✅ Fix: Use query.message.chat.id
    const userId = query.from.id.toString(); // ✅ Fix: Use query.from.id

    const user = await SaifurlsBotUsers.findOne({ userId });

    if (!user) {
      await bot.sendMessage(
        // ✅ Add await
        chatId,
        "You need to run /start command first to register."
      );
      return;
    }

    if (!user.encryptedApiKey) {
      await bot.sendMessage(chatId, "No API key found. Please set it first"); // ✅ Add await
      return;
    }

    const apikey = decrypt(user.encryptedApiKey);

    const keyboard = Keyboard.make([
      [Key.callback("🗑️ Delete Message", "delete_api_key_msg")],
      [Key.callback("⬅️ Back to Menu", "back_to_menu")],
    ]).inline();

    // ✅ Add await and simplify
    const shouldBeDeletedMsg = await bot.sendMessage(
      chatId,
      `Your API key is: \`${apikey}\`\n\nThis message will be deleted in 30 seconds.`,
      { ...keyboard, parse_mode: "Markdown" }
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
      "Failed to retrieve API key. Please try again."
    ); // ✅ Add await and fix chatId
  }
};

const deleteApiKey = async (bot, query) => {
  try {
    const chatId = query.message.chat.id; // ✅ Fix: Use query.message.chat.id
    const userId = query.from.id.toString(); // ✅ Fix: Use query.from.id

    const user = await SaifurlsBotUsers.findOne({ userId });

    if (!user || !user.encryptedApiKey) {
      return await bot.sendMessage(chatId, "No API key found to delete."); // ✅ Add await
    }

    const keyboard = Keyboard.make([
      [Key.callback("✅ Yes", "confirm_delete_api_key")],
      [Key.callback("❌ No", "cancel_delete_api_key")],
    ]).inline();

    await bot.sendMessage(
      // ✅ Add await
      chatId,
      "⚠️ Are you sure you want to delete your API key?",
      keyboard
    );
  } catch (error) {
    console.error("Error in deleteApiKey:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage);
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
      await bot.sendMessage(chatId, "✅ API key deleted successfully!");
    } else if (query.data === "cancel_delete_api_key") {
      await bot.sendMessage(chatId, "❌ API key deletion cancelled.");
    }

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Error handling delete confirmation:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage);
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
