const welcomeMessage = `
🤖 **Welcome {user}!**

I'm your URL management bot! Here's what I can do:

📋 **Available Commands:**
• /help - Show all commands
• /apikey - Manage your API keys
• /about - About this bot  
• /ping - Test bot response
• /shorten <url> - Shorten a URL
• /expand <url> - Expand a URL

Just send me any URL and I'll process it for you!
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

module.exports = {
  welcomeMessage,
  welcomeBackMessage,
  helpMessage,
  errorMessage,
};
