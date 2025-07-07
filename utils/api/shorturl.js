const api = require("./api.utils.js");
const SaifurlsBotUsers = require("../../db/mongodb.js");
const { decrypt } = require("../crypto.utils.js");
const { errorMessage } = require("../../handlers/telegram/messages.js");

const getUserApiKey = async (userId) => {
  try {
    const user = await SaifurlsBotUsers.findOne({
      userId: userId.toString(),
    });

    if (!user || !user.encryptedApiKey) {
      throw new Error(
        "API key not found. Please set your API key first using /apikey command."
      );
    }

    return decrypt(user.encryptedApiKey);
  } catch (error) {
    throw new Error(`Failed to get API key: ${error.message}`);
  }
};

const getUserPreferredDomain = async (userId) => {
  try {
    const user = await SaifurlsBotUsers.findOne({
      userId: userId.toString(),
    });

    if (!user) {
      throw new Error("User not found. Please run /start command first.");
    }

    return user.preferredDomain || "sa.died.pw";
  } catch (error) {
    console.error("Error getting user domain preference:", error);
    return "sa.died.pw";
  }
};

const setUserPreferredDomain = async (userId, domain) => {
  try {
    const validDomains = ["sa.died.pw", "sa.ix.tc"];
    if (!validDomains.includes(domain)) {
      throw new Error("Invalid domain. Allowed domains: sa.died.pw, sa.ix.tc");
    }

    await SaifurlsBotUsers.updateOne(
      { userId: userId.toString() },
      { preferredDomain: domain, updatedAt: new Date() }
    );

    return true;
  } catch (error) {
    throw new Error(`Failed to set domain preference: ${error.message}`);
  }
};

const validateUrlExists = async (shorturlId, apiKey) => {
  try {
    const response = await api.get(`/shorturls/check/${shorturlId}`, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
    return response.status === 200 && response.data.success;
  } catch (error) {
    return false;
  }
};

const checkShortUrlExists = async (bot, message, shorturlId) => {
  try {
    if (!shorturlId) {
      await bot.sendMessage(
        message.chat.id,
        "❌ Please provide a short URL ID to check.\n\n" +
          "Use the /shorturl menu to check your URLs.",
        {
          parse_mode: "Markdown",
        }
      );
      return;
    }

    const apiKey = await getUserApiKey(message.from.id);

    if (!apiKey) {
      await bot.sendMessage(message.chat.id, "🔑 API key not found.");
      return;
    }

    if (typeof shorturlId !== "string" || shorturlId.trim() === "") {
      await bot.sendMessage(message.chat.id, "❌ Invalid short URL ID.");
      return;
    }

    const response = await api.get(`/shorturls/check/${shorturlId}`, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200 && response.data.success) {
      await bot.sendMessage(
        message.chat.id,
        `✅ Short URL exists and is accessible.`
      );
    } else {
      const isValid = await validateUrlExists(shorturlId, apiKey);
      if (!isValid) {
        await bot.sendMessage(
          message.chat.id,
          `❌ ${
            response.data?.message || "Short URL not found or not accessible."
          }`
        );
      }
    }
  } catch (error) {
    console.error("error", error.response?.data?.message);
    if (error?.response?.status === 404) {
      await bot.sendMessage(message.chat.id, "❌ Short URL not found.");
    } else if (error?.response?.status === 400) {
      await bot.sendMessage(
        message.chat.id,
        error?.response?.data?.message || errorMessage
      );
    } else {
      await bot.sendMessage(message.chat.id, "❌ Invalid API key");
    }
  }
};

const getMyShortUrls = async (bot, message) => {
  try {
    const apiKey = await getUserApiKey(message.from.id);

    const response = await api.get(`/shorturls`, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200 && response.data.success) {
      const shortUrls = response.data.shortUrls;

      if (!shortUrls || shortUrls.length === 0) {
        await bot.sendMessage(
          message.chat.id,
          "📋 You don't have any short URLs yet."
        );
        return;
      }

      const userDomain = await getUserPreferredDomain(message.from.id);
      let messageText = `📋 **Your Short URLs** (${shortUrls.length} total):\n\n`;

      shortUrls.forEach((url, index) => {
        messageText += `🔗 **${index + 1}.** [${
          url.short
        }](https://${userDomain}/${url.short})\n`;
        messageText += `📝 **ID:** \`${url._id}\`\n`;
        messageText += `🎯 **Original:** ${
          url.full.length > 50 ? url.full.substring(0, 50) + "..." : url.full
        }\n`;
        messageText += `📊 **Clicks:** ${url.clicks || 0}\n`;
        messageText += `📅 **Created:** ${new Date(
          url.createdAt
        ).toLocaleDateString()}\n\n`;
      });

      // Check if message is too long (Telegram limit is ~4096 characters)
      if (messageText.length > 4000) {
        // Send in batches if too long
        await bot.sendMessage(
          message.chat.id,
          `📋 **Your Short URLs** (${shortUrls.length} total):\n`,
          { parse_mode: "Markdown" }
        );

        for (let i = 0; i < shortUrls.length; i++) {
          const url = shortUrls[i];
          const singleUrlText =
            `🔗 **Short URL ${i + 1}**\n` +
            `📝 **ID:** \`${url._id}\`\n` +
            `🌐 **Short:** [${url.short}](https://${userDomain}/${url.short})\n` +
            `🎯 **Original:** ${url.full}\n` +
            `📊 **Clicks:** ${url.clicks || 0}\n` +
            `📅 **Created:** ${new Date(url.createdAt).toLocaleDateString()}\n`;

          await bot.sendMessage(message.chat.id, singleUrlText, {
            parse_mode: "Markdown",
            disable_web_page_preview: true,
          });
        }
      } else {
        // Send all in one message
        await bot.sendMessage(message.chat.id, messageText, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        });
      }
    } else {
      await bot.sendMessage(
        message.chat.id,
        response.data?.message || "❌ Failed to retrieve short URLs."
      );
    }
  } catch (error) {
    console.error("Error fetching short URLs:", error.status);

    if (error.message.includes("API key not found")) {
      await bot.sendMessage(message.chat.id, "🔑 " + error.message);
    } else if (error?.status === 404) {
      await bot.sendMessage(
        message.chat.id,
        "📋 You don't have any short URLs yet."
      );
    } else if (error?.status === 403) {
      await bot.sendMessage(
        message.chat.id,
        "🚫 Access denied. Please check your API key."
      );
    } else if (error?.status === 400) {
      await bot.sendMessage(
        message.chat.id,
        error.data?.message || errorMessage
      );
    } else {
      await bot.sendMessage(message.chat.id, errorMessage);
    }
  }
};

const createShortUrl = async (bot, message, fullUrl, customShort = null) => {
  try {
    if (!fullUrl) {
      await bot.sendMessage(
        message.chat.id,
        "❌ Please provide a URL to shorten.\n\nUse the /shorturl menu to create short URLs.",
        {
          parse_mode: "Markdown",
        }
      );
      return;
    }

    const apiKey = await getUserApiKey(message.from.id);

    const requestData = {
      fullUrl: fullUrl,
    };

    if (customShort) {
      requestData.shortUrl = customShort;
    }

    const response = await api.post(`/shorturls`, requestData, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201 && response.data.success) {
      const shortUrl = response.data.shortUrl;
      const shortCode = shortUrl.includes("/")
        ? shortUrl.split("/").pop()
        : shortUrl;

      const userDomain = await getUserPreferredDomain(message.from.id);

      const messageText =
        `✅ **Short URL Created Successfully!**\n\n` +
        `🌐 **Short URL:** [https://${userDomain}/${shortCode}](https://${userDomain}/${shortCode})\n` +
        `🎯 **Original URL:** ${fullUrl}\n\n` +
        `📋 Use /shorturl to manage your URLs`;

      await bot.sendMessage(message.chat.id, messageText, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    } else {
      await bot.sendMessage(
        message.chat.id,
        `❌ ${response.data?.message || "Failed to create short URL."}`
      );
    }
  } catch (error) {
    console.error("Error creating short URL:", error);

    if (error.message.includes("API key not found")) {
      await bot.sendMessage(message.chat.id, "🔑 " + error.message);
    } else if (error.response?.status === 400) {
      const errorMsg =
        error.response.data?.message ||
        "Invalid URL or custom short URL already exists.";
      await bot.sendMessage(message.chat.id, `❌ ${errorMsg}`);
    } else if (error.response?.status === 403) {
      await bot.sendMessage(
        message.chat.id,
        "🚫 You must be a verified user to create short URLs."
      );
    } else {
      await bot.sendMessage(message.chat.id, errorMessage);
    }
  }
};

const updateShortUrl = async (
  bot,
  message,
  shorturlId,
  newFullUrl,
  newShortUrl
) => {
  try {
    const apiKey = await getUserApiKey(message.from.id);
    if (!apiKey) {
      await bot.sendMessage(
        message.chat.id,
        "🔑 API key not found. Please set your API key first using /apikey command."
      );
      return;
    }
    const isValid = await validateUrlExists(shorturlId);
    if (!isValid) {
      await bot.sendMessage(
        message.chat.id,
        "❌ The provided short URL ID does not exist, or is invalid or doesn't return to the user.\n\n" +
          "Please check the ID and try again."
      );
      return;
    }

    if (!shorturlId || !newFullUrl || !newShortUrl) {
      await bot.sendMessage(
        message.chat.id,
        "❌ Missing required parameters for updating the short URL.\n\n" +
          "Please use the /shorturl menu to update URLs step by step.",
        {
          parse_mode: "Markdown",
        }
      );
      return;
    }

    if (!isValid) {
      await bot.sendMessage(
        message.chat.id,
        "❌ The provided short URL ID does not exist or is invalid.\n\n" +
          "Please check the ID and try again."
      );
      return;
    }

    const response = await api.patch(
      `/shorturls/${shorturlId}`,
      {
        fullUrl: newFullUrl,
        shortUrl: newShortUrl,
      },
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const updatedUrl = response.data.shortUrl;
      const userDomain = await getUserPreferredDomain(message.from.id);

      const messageText =
        `✅ **Short URL Updated Successfully!**\n\n` +
        `🌐 **New Short URL:** [https://${userDomain}/${updatedUrl.short}](https://${userDomain}/${updatedUrl.short})\n` +
        `🎯 **New Original URL:** ${updatedUrl.full}\n` +
        `📊 **Clicks:** ${updatedUrl.clicks || 0}`;

      await bot.sendMessage(message.chat.id, messageText, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    } else {
      await bot.sendMessage(
        message.chat.id,
        `❌ ${response.data?.message || "Failed to update short URL."}`
      );
    }
  } catch (error) {
    console.error("Error updating short URL:", error);

    if (error.message.includes("API key not found")) {
      await bot.sendMessage(message.chat.id, "🔑 " + error.message);
    } else if (error.response?.status === 404) {
      await bot.sendMessage(message.chat.id, "❌ Short URL not found.");
    } else if (error.response?.status === 403) {
      await bot.sendMessage(
        message.chat.id,
        "🚫 You don't have permission to update this short URL."
      );
    } else if (error.response?.status === 400) {
      const errorMsg = error.response.data?.message || "Invalid data provided.";
      await bot.sendMessage(message.chat.id, `❌ ${errorMsg}`);
    } else {
      await bot.sendMessage(message.chat.id, errorMessage);
    }
  }
};

const deleteShortUrl = async (bot, message, shorturlId) => {
  try {
    if (!shorturlId) {
      await bot.sendMessage(
        message.chat.id,
        "❌ Please provide a short URL ID to delete.\n\n" +
          "Use the /shorturl menu to manage and delete your URLs.",
        {
          parse_mode: "Markdown",
        }
      );
      return;
    }

    const apiKey = await getUserApiKey(message.from.id);

    const response = await api.delete(`/shorturls/${shorturlId}`, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200 && response.data.success) {
      await bot.sendMessage(
        message.chat.id,
        `✅ Short URL deleted successfully!`
      );
    } else {
      await bot.sendMessage(
        message.chat.id,
        `❌ ${response.data?.message || "Failed to delete short URL."}`
      );
    }
  } catch (error) {
    console.error("Error deleting short URL:", error);

    if (error.message.includes("API key not found")) {
      await bot.sendMessage(message.chat.id, "🔑 " + error.message);
    } else if (error.response?.status === 404) {
      await bot.sendMessage(message.chat.id, "❌ Short URL not found.");
    } else if (error.response?.status === 403) {
      await bot.sendMessage(
        message.chat.id,
        "🚫 You don't have permission to delete this short URL."
      );
    } else {
      await bot.sendMessage(message.chat.id, errorMessage);
    }
  }
};

const getShortUrlInfo = async (bot, message, shortCode) => {
  try {
    if (!shortCode) {
      await bot.sendMessage(
        message.chat.id,
        "❌ Please provide a short URL code.\n\n" +
          "Use the /shorturl menu to get URL information.",
        {
          parse_mode: "Markdown",
        }
      );
      return;
    }

    const response = await api.get(`/shorturls/info/${shortCode}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200 && response.data.success) {
      const url = response.data.shortUrl;
      const userDomain = await getUserPreferredDomain(message.from.id);

      const messageText =
        `📊 **Short URL Information**\n\n` +
        `🌐 **Short URL:** [https://${userDomain}/${url.short}](https://${userDomain}/${url.short})\n` +
        `🎯 **Original URL:** ${url.full}\n` +
        `📊 **Total Clicks:** ${url.clicks || 0}\n` +
        `📅 **Created:** ${new Date(url.createdAt).toLocaleDateString()}\n` +
        `🆔 **ID:** \`${url._id}\``;

      await bot.sendMessage(message.chat.id, messageText, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    } else {
      await bot.sendMessage(
        message.chat.id,
        `❌ ${response.data?.message || "Short URL not found."}`
      );
    }
  } catch (error) {
    console.error("Error getting short URL info:", error);

    if (error.response?.status === 404) {
      await bot.sendMessage(message.chat.id, "❌ Short URL not found.");
    } else {
      await bot.sendMessage(message.chat.id, errorMessage);
    }
  }
};

module.exports = {
  getMyShortUrls,
  createShortUrl,
  updateShortUrl,
  deleteShortUrl,
  getShortUrlInfo,
  getUserApiKey,
  checkShortUrlExists,
  getUserPreferredDomain,
  setUserPreferredDomain,
  validateUrlExists,
};
