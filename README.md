# SaifURL Bots

A collection of bots for the [SaifURL](https://github.com/saifabdelrazek011/saifurl) URL shortening service, providing seamless URL management across different platforms.
However, what available now is the telegram bot

## 🤖 Available Bots

### Telegram Bot

The primary bot for URL management through Telegram messaging platform.

**Features:**

- 🔗 Shorten long URLs
- 📊 View URL analytics and information
- 🔑 Manage API keys securely
- 🌐 Set preferred domains
- 📋 List and manage your URLs
- ✏️ Update existing short URLs
- 🗑️ Delete URLs
- 🧪 Test mode for developers

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Telegram Bot Token
- SaifURL API access

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/saifabdelrazek011/saifurl-bots.git
   cd saifurl-bots
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   BOT_TOKEN=your_telegram_bot_token_here
   MONGODB_URI=your_mongodb_connection_string
   WEBHOOK_URL=your_webhook_url (optional)
   PORT=3000
   ```

4. **Start the bot**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📚 Bot Commands

### Essential Commands

- `/start` - Register and start using the bot
- `/todo` - Complete setup guide for new users
- `/help` - Show all available commands
- `/menu` - Display the main menu

### URL Management

- `/shorturl` - Access URL management features
- `/apikey` - Manage your API keys
- `/setdomain` - Set your preferred domain

### Information & Support

- `/about` - About the bot
- `/contact` - Get support information
- `/ping` - Test bot responsiveness

### Developer/Testing

- `/justtest` - Get test API key (SoM/Converge participants only)

## 🔧 Configuration

The bot uses environment variables for configuration:

| Variable      | Description                        | Required |
| ------------- | ---------------------------------- | -------- |
| `BOT_TOKEN`   | Telegram Bot Token from @BotFather | Yes      |
| `MONGODB_URI` | MongoDB connection string          | Yes      |
| `WEBHOOK_URL` | Webhook URL for production         | No       |
| `PORT`        | Server port (default: 3000)        | No       |

## 📁 Project Structure

```
saifurl-bots/
├── bot.js                 # Main bot entry point
├── config/               # Configuration files
│   ├── env.js           # Environment configuration
│   ├── index.js         # Main config export
│   └── telegram.js      # Telegram-specific config
├── db/                  # Database connection
│   └── mongodb.js       # MongoDB setup
├── handlers/            # Message and command handlers
│   └── telegram/
│       ├── callbacks.js # Callback query handlers
│       ├── commands.js  # Command handlers
│       ├── index.js     # Handler exports
│       └── messages.js  # Message templates
├── services/            # Business logic services
│   └── telegram/
│       ├── apikey.services.js    # API key management
│       ├── mainmenu.services.js  # Main menu logic
│       └── shorturl.services.js  # URL management
├── utils/               # Utility functions
│   ├── crypto.utils.js  # Encryption utilities
│   └── api/             # API interaction utilities
├── validators/          # Input validation
└── routers/            # Express routes (webhook)
```

## 🔒 Security Features

- **Encrypted API Storage**: User API keys are encrypted before storage
- **User Validation**: All operations require user registration
- **Input Validation**: URLs and inputs are validated before processing
- **Rate Limiting**: API calls are managed to prevent abuse

## 🎯 Getting Started as a User

1. **First Time Setup**

   - Start a chat with the bot
   - Run `/start` to register
   - Run `/todo` for complete setup guide

2. **Get Your API Key**

   - Visit [urls.saifdev.xyz](https://urls.saifdev.xyz)
   - Sign up or sign in
   - Verify your account
   - Get your API key from the developer page
   - Use `/apikey` in the bot to set it up

3. **Start Using**
   - Use `/menu` to access all features
   - Create, manage, and track your short URLs

## 🧪 For Developers/Testers

If you're part of Summer of Making (SoM) or Converge:

- Use `/justtest` to get a temporary test API key
- This key has limited functionality and will be removed after testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Saif Abdelrazek**

- GitHub: [@saifabdelrazek011](https://github.com/saifabdelrazek011)
- Email: dev@saifdev.xyz

## 🔗 Related Projects

- [SaifURL](https://github.com/saifabdelrazek011/saifurl) - The main URL shortening service
- [SaifURL Frontend](https://urls.saifdev.xyz) - Web interface for SaifURL

## 📞 Support

Need help?

- 📧 Email: [dev@saifdev.xyz](mailto:dev@saifdev.xyz)
- 💬 Use `/contact` command in the bot
- 🐛 Report issues on GitHub

---

_Made with ❤️ for the community_
