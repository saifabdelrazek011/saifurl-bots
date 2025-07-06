const {
  setApiKey,
  viewApiKey,
  updateApiKey,
  deleteApiKey,
} = require("../../services/telegram/apikey.services");
const { errorMessage } = require("./messages");

const handleApiKeyCallback = async (bot, query) => {
  const { data, message } = query;
  try {
    bot.answerCallbackQuery(query.id);
    const chatId = message.chat.id;

    switch (data) {
      case "set_api_key":
        await setApiKey(bot, chatId);
        break;
      case "view_api_key":
        await viewApiKey(bot, chatId);
        break;
      case "update_api_key":
        await updateApiKey(bot, chatId);
        break;
      case "delete_api_key":
        await deleteApiKey(bot, chatId);
        break;
    }
  } catch (error) {
    console.error("Error handling apikey callback:", error);
    bot.sendMessage(chatId, errorMessage);
  }
};

module.exports = { handleApiKeyCallback };
