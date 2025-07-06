const express = require("express");
const { PORT, SERVER_URL, NODE_ENV } = require("./config/env");
const { start: startTelegram, getBot } = require("./config/telegram");
const webhookRouter = require("./routers/webhook.router");
const mongoose = require("mongoose");
const { MONGODB_URI } = require("./config/env");

// Connect to MongoDB
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables.");
}
if (!SERVER_URL) {
  console.error("❌ SERVER_URL is not defined in environment variables.");
}
if (!PORT) {
  console.error("❌ PORT is not defined in environment variables.");
}
if (!NODE_ENV) {
  console.error("❌ NODE_ENV is not defined in environment variables.");
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully!");
  })
  .catch((error) => {
    console.error("❌ Failed to connect to MongoDB:", error.message);
  });

// Initialize Telegram bot configuration
startTelegram();

const app = express();

app.use(express.json());
app.use("/webhook", webhookRouter);

app.get("/", (req, res) => {
  res.json({
    status: "active",
    message: "Saifurls Bot is running!",
    webhook: {
      method: "POST",
      telegram: {
        url: SERVER_URL ? `${SERVER_URL}/webhook/telegram` : null,
        description: "Webhook URL for Telegram updates",
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`Running in ${NODE_ENV} mode`);
  console.log(`🌐 Webhook URL: ${SERVER_URL}/webhook/telegram`);
});
