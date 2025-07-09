const SaifurlsBotUsers = require("../../db/mongodb.js");
const { errorMessage } = require("../../handlers/telegram/messages.js");
const { Keyboard, Key } = require("telegram-keyboard");
const {
  getMyShortUrls,
  createShortUrl,
  updateShortUrl,
  deleteShortUrl,
  getShortUrlInfo,
  checkShortUrlExists,
  getUserPreferredDomain,
  setUserPreferredDomain,
  validateUrlExists,
  getUserApiKey,
} = require("../../utils/api/shorturl.js");

const showShortUrlMenu = async (bot, msg) => {
  try {
    const existingUser = await SaifurlsBotUsers.findOne({
      userId: msg.from.id.toString(),
    });

    if (!existingUser) {
      await bot.sendMessage(
        msg.chat.id,
        "You need to run /start command first to register.",
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
      await bot.sendMessage(
        msg.chat.id,
        "🔑 You need to set up your API key first. Use /apikey to manage your API key.",
        {
          disable_web_page_preview: true,
          parse_mode: "Markdown",
        }
      );
      return;
    }

    const keyboard = Keyboard.make([
      [
        Key.callback("📋 My URLs", "view_my_urls"),
        Key.callback("➕ Create URL", "create_url"),
      ],
      [
        Key.callback("📊 URL Info", "get_url_info"),
        Key.callback("🔍 Check URL", "check_url"),
      ],
      [
        Key.callback("✏️ Update URL", "update_url"),
        Key.callback("🗑️ Delete URL", "delete_url"),
      ],
      [Key.callback("🌐 Domain Preference", "set_domain")],
      [Key.callback("🔙 Back to Main Menu", "back_to_main")],
    ]).inline();

    await bot.sendMessage(
      msg.chat.id,
      "🔗 **Short URL Management**\n\nChoose an action:",
      keyboard,
      {
        disable_web_page_preview: true,
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error in showShortUrlMenu:", error);
    await bot.sendMessage(msg.chat.id, errorMessage, {
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    });
  }
};

const handleViewMyUrls = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    const fakeMessage = {
      from: { id: userId },
      chat: { id: chatId },
    };

    await getMyShortUrls(bot, fakeMessage);

    setTimeout(async () => {
      const fakeMsg = {
        from: { id: userId },
        chat: { id: chatId },
      };
      await showShortUrlMenu(bot, fakeMsg);
    }, 3000);
  } catch (error) {
    console.error("Error in handleViewMyUrls:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleCheckUrl = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    await bot.sendMessage(
      chatId,
      "🔍 **Check Short URL**\n\nPlease send the URL ID you want to check:\n\n" +
        "Example: `507f1f77bcf86cd799439011`\n\n" +
        "_Use /shorturl → My URLs to see your URLs and their IDs._",
      {
        disable_web_page_preview: true,
        parse_mode: "Markdown",
      }
    );

    bot.once("message", async (msg) => {
      try {
        if (!msg.text || msg.from.id !== query.from.id) {
          return;
        }

        const shorturlId = msg.text.trim();

        const fakeMessage = {
          from: { id: userId },
          chat: { id: msg.chat.id },
        };

        await checkShortUrlExists(bot, fakeMessage, shorturlId);

        setTimeout(async () => {
          const fakeMsg = {
            from: { id: userId },
            chat: { id: msg.chat.id },
          };
          await showShortUrlMenu(bot, fakeMsg);
        }, 2000);
      } catch (error) {
        console.error("Error processing check URL request:", error);
        await bot.sendMessage(msg.chat.id, errorMessage, {
          disable_web_page_preview: true,
        });
      }
    });
  } catch (error) {
    console.error("Error in handleCheckUrl:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleCreateUrl = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();

    // Check if user exists and has API key
    const user = await SaifurlsBotUsers.findOne({ userId });
    if (!user || !user.encryptedApiKey) {
      await bot.sendMessage(
        chatId,
        "🔑 Please set up your API key first using /apikey command.",
        {
          disable_web_page_preview: true,
        }
      );
      return;
    }

    await bot.sendMessage(
      chatId,
      "🌐 **Create Short URL**\n\nPlease send the URL you want to shorten:\n\n" +
        "Examples:\n" +
        "• `https://example.com`\n" +
        "• `https://very-long-url.com/path/to/page`",
      {
        disable_web_page_preview: true,
        parse_mode: "Markdown",
      }
    );

    // Wait for user to send the URL
    bot.once("message", async (msg) => {
      try {
        if (!msg.text || msg.from.id !== query.from.id) {
          return;
        }

        const fullUrl = msg.text.trim();

        // Basic URL validation
        if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
          await bot.sendMessage(
            msg.chat.id,
            "❌ Please provide a valid URL starting with http:// or https://",
            {
              disable_web_page_preview: true,
            }
          );
          return;
        }

        // Ask if they want a custom short URL
        const keyboard = Keyboard.make([
          [Key.callback("🎲 Random", "create_random")],
          [Key.callback("✏️ Custom", "create_custom")],
        ]).inline();

        // Store the URL temporarily (in a more production environment, you'd use Redis or similar)
        global.tempUrls = global.tempUrls || {};
        global.tempUrls[userId] = fullUrl;

        await bot.sendMessage(
          msg.chat.id,
          `🔗 **URL to shorten:** ${fullUrl}\n\nChoose short URL type:`,
          keyboard,
          {
            disable_web_page_preview: true,
            parse_mode: "Markdown",
          }
        );
      } catch (error) {
        console.error("Error processing URL:", error);
        await bot.sendMessage(msg.chat.id, errorMessage, {
          disable_web_page_preview: true,
        });
      }
    });
  } catch (error) {
    console.error("Error in handleCreateUrl:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleCreateRandom = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    global.tempUrls = global.tempUrls || {};
    const fullUrl = global.tempUrls[userId];

    if (!fullUrl) {
      await bot.sendMessage(
        chatId,
        "❌ Session expired. Please start over with the create URL option."
      );
      return;
    }

    const fakeMessage = {
      from: { id: userId },
      chat: { id: chatId },
    };

    await createShortUrl(bot, fakeMessage, fullUrl);

    delete global.tempUrls[userId];

    setTimeout(async () => {
      const fakeMsg = {
        from: { id: userId },
        chat: { id: chatId },
      };
      await showShortUrlMenu(bot, fakeMsg);
    }, 2500);
  } catch (error) {
    console.error("Error in handleCreateRandom:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleCreateCustom = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    global.tempUrls = global.tempUrls || {};
    const fullUrl = global.tempUrls[userId];

    if (!fullUrl) {
      await bot.sendMessage(
        chatId,
        "❌ Session expired. Please start over with the create URL option."
      );
      return;
    }

    await bot.sendMessage(
      chatId,
      "✏️ **Custom Short URL**\n\nPlease send your desired custom short code:\n\n" +
        "Examples:\n" +
        "• `mylink`\n" +
        "• `project2024`\n" +
        "• `coolstuff`\n\n" +
        "_Note: Only letters, numbers, and hyphens allowed._",
      { parse_mode: "Markdown" }
    );

    bot.once("message", async (msg) => {
      try {
        if (!msg.text || msg.from.id !== query.from.id) {
          return;
        }

        const customShort = msg.text.trim();

        // Basic validation for custom short URL
        if (!/^[a-zA-Z0-9-_]+$/.test(customShort)) {
          await bot.sendMessage(
            msg.chat.id,
            "❌ Custom short URL can only contain letters, numbers, hyphens, and underscores."
          );
          return;
        }

        const fakeMessage = {
          from: { id: userId },
          chat: { id: msg.chat.id },
        };

        await createShortUrl(bot, fakeMessage, fullUrl, customShort);

        delete global.tempUrls[userId];

        setTimeout(async () => {
          const fakeMsg = {
            from: { id: userId },
            chat: { id: msg.chat.id },
          };
          await showShortUrlMenu(bot, fakeMsg);
        }, 2500);
      } catch (error) {
        console.error("Error processing custom URL:", error);
        await bot.sendMessage(msg.chat.id, errorMessage, {
          disable_web_page_preview: true,
        });
      }
    });
  } catch (error) {
    console.error("Error in handleCreateCustom:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleGetUrlInfo = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    await bot.sendMessage(
      chatId,
      "📊 **Get URL Information**\n\nPlease send the short code (without the domain):\n\n" +
        "Examples:\n" +
        "• `abc123d`\n" +
        "• `mylink`\n" +
        "• From `https://sa.died.pw/abc123d` send just `abc123d`",
      { parse_mode: "Markdown" }
    );

    bot.once("message", async (msg) => {
      try {
        if (!msg.text || msg.from.id !== query.from.id) {
          return;
        }

        const shortCode = msg.text.trim();

        const fakeMessage = {
          from: { id: userId },
          chat: { id: msg.chat.id },
        };

        await getShortUrlInfo(bot, fakeMessage, shortCode);

        setTimeout(async () => {
          const fakeMsg = {
            from: { id: userId },
            chat: { id: msg.chat.id },
          };
          await showShortUrlMenu(bot, fakeMsg);
        }, 2500);
      } catch (error) {
        console.error("Error processing URL info request:", error);
        await bot.sendMessage(msg.chat.id, errorMessage, {
          disable_web_page_preview: true,
        });
      }
    });
  } catch (error) {
    console.error("Error in handleGetUrlInfo:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleUpdateUrl = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    await bot.sendMessage(
      chatId,
      "✏️ **Update Short URL**\n\nPlease send the URL ID you want to update:\n\n" +
        "Example: `507f1f77bcf86cd799439011`\n\n" +
        "_Use /shorturl → My URLs to see your URLs and their IDs._",
      { parse_mode: "Markdown" }
    );

    bot.once("message", async (msg) => {
      try {
        if (!msg.text || msg.from.id !== query.from.id) {
          return;
        }

        const shorturlId = msg.text.trim();
        global.tempUpdateIds = global.tempUpdateIds || {};
        global.tempUpdateIds[userId] = shorturlId;

        await bot.sendMessage(
          msg.chat.id,
          "🌐 **New Full URL**\n\nPlease send the new full URL:",
          { parse_mode: "Markdown" }
        );

        bot.once("message", async (msg2) => {
          try {
            if (!msg2.text || msg2.from.id !== query.from.id) {
              return;
            }

            const newFullUrl = msg2.text.trim();
            global.tempUpdateUrls = global.tempUpdateUrls || {};
            global.tempUpdateUrls[userId] = newFullUrl;

            await bot.sendMessage(
              msg2.chat.id,
              "✏️ **New Short Code**\n\nPlease send the new short code:",
              { parse_mode: "Markdown" }
            );

            bot.once("message", async (msg3) => {
              try {
                if (!msg3.text || msg3.from.id !== query.from.id) {
                  return;
                }

                const newShortUrl = msg3.text.trim();

                const fakeMessage = {
                  from: { id: userId },
                  chat: { id: msg3.chat.id },
                };

                await updateShortUrl(
                  bot,
                  fakeMessage,
                  global.tempUpdateIds[userId],
                  global.tempUpdateUrls[userId],
                  newShortUrl
                );

                delete global.tempUpdateIds[userId];
                delete global.tempUpdateUrls[userId];

                setTimeout(async () => {
                  const fakeMsg = {
                    from: { id: userId },
                    chat: { id: msg3.chat.id },
                  };
                  await showShortUrlMenu(bot, fakeMsg);
                }, 2500);
              } catch (error) {
                console.error("Error processing new short URL:", error);
                await bot.sendMessage(msg3.chat.id, errorMessage, {
                  disable_web_page_preview: true,
                });
              }
            });
          } catch (error) {
            console.error("Error processing new full URL:", error);
            await bot.sendMessage(msg2.chat.id, errorMessage, {
              disable_web_page_preview: true,
            });
          }
        });
      } catch (error) {
        console.error("Error processing URL ID:", error);
        await bot.sendMessage(msg.chat.id, errorMessage, {
          disable_web_page_preview: true,
        });
      }
    });
  } catch (error) {
    console.error("Error in handleUpdateUrl:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleDeleteUrl = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;

    await bot.sendMessage(
      chatId,
      "🗑️ **Delete Short URL**\n\nPlease send the URL ID you want to delete:\n\n" +
        "Example: `507f1f77bcf86cd799439011`\n\n" +
        "_Use /shorturl → My URLs to see your URLs and their IDs._",
      { parse_mode: "Markdown" }
    );

    bot.once("message", async (msg) => {
      try {
        if (!msg.text || msg.from.id !== query.from.id) {
          return;
        }
        const shorturlId = msg.text.trim();
        const apikey = await getUserApiKey(msg.from.id);
        if (!apikey) {
          await bot.sendMessage(
            msg.chat.id,
            "🔑 You need to set up your API key first. Use /apikey to manage your API key."
          );
          return;
        }

        const isValid = await validateUrlExists(shorturlId, apikey);
        if (!isValid) {
          await bot.sendMessage(
            msg.chat.id,
            "❌ The provided short URL ID does not exist, or is invalid or doesn't return to the user.\n\n" +
              "Please check the ID and try again.",
            {
              disable_web_page_preview: true,
            }
          );
          return;
        }

        // Confirmation keyboard
        const keyboard = Keyboard.make([
          [Key.callback("✅ Yes, Delete", `confirm_delete_${shorturlId}`)],
          [Key.callback("❌ Cancel", "cancel_delete")],
        ]).inline();

        await bot.sendMessage(
          msg.chat.id,
          `⚠️ **Confirm Deletion**\n\nAre you sure you want to delete this URL?\n\n**ID:** \`${shorturlId}\`\n\n_This action cannot be undone._`,
          keyboard,
          {
            disable_web_page_preview: true,
            parse_mode: "Markdown",
          }
        );
      } catch (error) {
        console.error("Error processing delete request:", error);
        await bot.sendMessage(msg.chat.id, errorMessage, {
          disable_web_page_preview: true,
        });
      }
    });
  } catch (error) {
    console.error("Error in handleDeleteUrl:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleDeleteConfirmation = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (query.data === "cancel_delete") {
      await bot.sendMessage(chatId, "❌ Deletion cancelled.", {
        disable_web_page_preview: true,
      });

      setTimeout(async () => {
        const fakeMsg = {
          from: { id: userId },
          chat: { id: chatId },
        };
        await showShortUrlMenu(bot, fakeMsg);
      }, 1500);
      return;
    }

    if (query.data.startsWith("confirm_delete_")) {
      const shorturlId = query.data.replace("confirm_delete_", "");

      const fakeMessage = {
        from: { id: userId },
        chat: { id: chatId },
      };

      await deleteShortUrl(bot, fakeMessage, shorturlId);

      setTimeout(async () => {
        const fakeMsg = {
          from: { id: userId },
          chat: { id: chatId },
        };
        await showShortUrlMenu(bot, fakeMsg);
      }, 2000);
    }
  } catch (error) {
    console.error("Error in handleDeleteConfirmation:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleBackToShortUrlMenu = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    // Delete the current message
    await bot.deleteMessage(chatId, messageId);

    // Create a fake message object for showShortUrlMenu
    const fakeMsg = {
      from: { id: query.from.id },
      chat: { id: chatId },
    };

    await showShortUrlMenu(bot, fakeMsg);
  } catch (error) {
    console.error("Error going back to short URL menu:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

const handleSetDomain = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    const currentDomain = await getUserPreferredDomain(userId);

    const keyboard = Keyboard.make([
      [Key.callback("🌐 sa.died.pw", "domain_sa.died.pw")],
      [Key.callback("🌐 sa.ix.tc", "domain_sa.ix.tc")],
      [Key.callback("🔙 Back to Menu", "back_to_shorturl_menu")],
    ]).inline();

    await bot.sendMessage(
      chatId,
      `🌐 **Domain Preference**\n\n` +
        `Current domain: **${currentDomain}**\n\n` +
        `Choose your preferred domain for short URLs:`,
      { ...keyboard, parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error in handleSetDomain:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage);
  }
};

const handleDomainSelection = async (bot, query) => {
  try {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    let domain;
    if (query.data === "domain_sa.died.pw") {
      domain = "sa.died.pw";
    } else if (query.data === "domain_sa.ix.tc") {
      domain = "sa.ix.tc";
    } else {
      return;
    }

    await setUserPreferredDomain(userId, domain);

    await bot.sendMessage(
      chatId,
      `✅ **Domain preference updated!**\n\n` +
        `Your new preferred domain: **${domain}**\n\n` +
        `All future short URLs will use: \`${domain}/...\``,
      {
        disable_web_page_preview: true,
        parse_mode: "Markdown",
      }
    );

    setTimeout(async () => {
      const fakeMsg = {
        from: { id: userId },
        chat: { id: chatId },
      };
      await showShortUrlMenu(bot, fakeMsg);
    }, 2000);
  } catch (error) {
    console.error("Error in handleDomainSelection:", error);
    await bot.sendMessage(query.message.chat.id, errorMessage, {
      disable_web_page_preview: true,
    });
  }
};

module.exports = {
  showShortUrlMenu,
  handleViewMyUrls,
  handleCreateUrl,
  handleCreateRandom,
  handleCreateCustom,
  handleGetUrlInfo,
  handleUpdateUrl,
  handleDeleteUrl,
  handleDeleteConfirmation,
  handleBackToShortUrlMenu,
  handleCheckUrl,
  handleSetDomain,
  handleDomainSelection,
};
