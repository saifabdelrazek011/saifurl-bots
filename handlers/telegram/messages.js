const welcomeMessage = `
🤖 **Welcome {user}!**

I'm your URL management bot! Here's what I can do:

📋 **Available Commands:**
• /todo - **Start here!** Complete setup guide
• /help - Show all commands
• /apikey - Manage your API keys
• /about - About this bot  
• /ping - Test bot response
• /shorten <url> - Shorten a URL
• /expand <url> - Expand a URL

💡 **New user?** Run \`/todo\` first to get started!
    `;

const welcomeBackMessage = `🤖 **Welcome back {user}!**

I'm glad to see you again. How can I assist you today?
`;

const helpMessage = `
🤖 **Help Menu**
Here's a list of all available commands:

{commands}
`;

const errorMessage = `❌ **Error!**
An error occurred while processing your request. Please try again later.
If the issue persists, please /contact the bot administrator.
`;

const contactMessage = `
📞 **Need Help?**

For support and assistance:
• 📧 Email: [dev@saifdev.xyz](mailto:dev@saifdev.xyz)
• 📝 Contact Form: [Click here](https://urls.saifdev.xyz/#/contact)
• 💬 Response time: Usually within 24 hours

We're here to help! 🚀
`;

const aboutMessage = `🤖 **About Me**

I'm a URL management bot built by Saif Abdelrazek and I'm here to help!

I'm designed to help you manage your URLs efficiently. You can shorten, expand, and get information about your URLs with ease.

**What I Can Do:**
- Shorten URLs
- Expand URLs
- Manage API keys
- Get help and support

If you have any questions or feedback, feel free to reach Saif! Run /contact to get in touch.
`;

module.exports = {
  welcomeMessage,
  welcomeBackMessage,
  helpMessage,
  errorMessage,
  contactMessage,
  aboutMessage,
};
