const {
  setApiKey,
  viewApiKey,
  updateApiKey,
  deleteApiKey,
  handleDeleteConfirmation,
  showApiKeyMenu,
} = require("../../services/telegram/apikey.services");

const {
  showShortUrlMenu,
  handleViewMyUrls,
  handleCreateUrl,
  handleCreateRandom,
  handleCreateCustom,
  handleGetUrlInfo,
  handleUpdateUrl,
  handleDeleteUrl,
  handleDeleteConfirmation: handleShortUrlDeleteConfirmation,
  handleBackToShortUrlMenu,
  handleCheckUrl,
  handleSetDomain,
  handleDomainSelection,
} = require("../../services/telegram/shorturl.services");

const {
  handleMainMenuCallback,
  handleBackToMain,
  handleContactCallback,
} = require("../../services/telegram/mainmenu.services");

const { errorMessage } = require("./messages");

const handleApiKeyCallback = async (bot, query) => {
  try {
    await bot.answerCallbackQuery(query.id);

    if (
      !query ||
      !query.message ||
      !query.message.chat ||
      !query.message.chat.id
    ) {
      throw new Error("Invalid message or chat ID in callback query.");
    }

    switch (query.data) {
      // API Key callbacks
      case "set_api_key":
        await setApiKey(bot, query);
        break;
      case "view_api_key":
        await viewApiKey(bot, query);
        break;
      case "update_api_key":
        await updateApiKey(bot, query);
        break;
      case "delete_api_key":
        await deleteApiKey(bot, query);
        break;
      case "confirm_delete_api_key":
      case "cancel_delete_api_key":
        await handleDeleteConfirmation(bot, query);
        break;
      case "delete_api_key_msg":
        await handleDeleteApiKeyMessage(bot, query);
        break;
      case "back_to_menu":
        await handleBackToMenu(bot, query);
        break;

      // Short URL callbacks
      case "view_my_urls":
        await handleViewMyUrls(bot, query);
        break;
      case "create_url":
        await handleCreateUrl(bot, query);
        break;
      case "create_random":
        await handleCreateRandom(bot, query);
        break;
      case "create_custom":
        await handleCreateCustom(bot, query);
        break;
      case "get_url_info":
        await handleGetUrlInfo(bot, query);
        break;
      case "update_url":
        await handleUpdateUrl(bot, query);
        break;
      case "delete_url":
        await handleDeleteUrl(bot, query);
        break;
      case "check_url":
        await handleCheckUrl(bot, query);
        break;
      case "set_domain":
        await handleSetDomain(bot, query);
        break;
      case "contact":
        await handleContactCallback(bot, query);
        break;
      case "cancel_delete":
        await handleShortUrlDeleteConfirmation(bot, query);
        break;
      case "back_to_shorturl_menu":
        await handleBackToShortUrlMenu(bot, query);
        break;
      case "back_to_main":
        await handleBackToMain(bot, query);
        break;

      default:
        // Handle main menu callbacks
        if (query.data.startsWith("main_")) {
          await handleMainMenuCallback(bot, query);
        }
        // Handle dynamic delete confirmations for short URLs
        else if (query.data.startsWith("confirm_delete_")) {
          await handleShortUrlDeleteConfirmation(bot, query);
        } else if (query.data.startsWith("domain_")) {
          await handleDomainSelection(bot, query);
        } else {
          await bot.sendMessage(query.message.chat.id, "Unknown action.");
        }
        break;
    }
  } catch (error) {
    console.error("Error handling callback:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage);
  }
};

// Helper function to delete the API key message
const handleDeleteApiKeyMessage = async (bot, query) => {
  try {
    const messageId = query.message.message_id;
    const chatId = query.message.chat.id;

    // Delete the message containing the API key
    await bot.deleteMessage(chatId, messageId);

    // Send confirmation that auto-deletes
    const confirmMsg = await bot.sendMessage(chatId, "🗑️ Message deleted.");

    // Auto-delete confirmation after 3 seconds
    setTimeout(async () => {
      try {
        await bot.deleteMessage(chatId, confirmMsg.message_id);
      } catch (error) {
        console.error("Error deleting confirmation message:", error);
      }
    }, 3000);
  } catch (error) {
    console.error("Error deleting API key message:", error);
    await bot.sendMessage(
      query.message.chat.id,
      "❌ Failed to delete message."
    );
  }
};

// Helper function to go back to main API key menu
const handleBackToMenu = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    // Delete the current message
    await bot.deleteMessage(chatId, messageId);

    // Create a fake message object for showApiKeyMenu
    const fakeMsg = {
      from: { id: query.from.id },
      chat: { id: chatId },
    };

    await showApiKeyMenu(bot, fakeMsg);
  } catch (error) {
    console.error("Error going back to menu:", error);
    await bot.sendMessage(
      query.message.chat.id,
      "❌ Failed to go back to menu."
    );
  }
};

module.exports = {
  handleApiKeyCallback,
  handleDeleteApiKeyMessage,
  handleBackToMenu,
};
