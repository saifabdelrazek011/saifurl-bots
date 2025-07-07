const express = require("express");
const { PORT, SERVER_URL, NODE_ENV } = require("./config/env");
const { start: startTelegram } = require("./config/telegram");
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

const app = express();

app.use(express.json());
app.use("/webhook", webhookRouter);

const initializeApp = async () => {
  try {
    await mongoose
      .connect(MONGODB_URI)
      .then(() => {
        console.log("Connected to MongoDB successfully!");
      })
      .catch((error) => {
        throw new Error("❌ Failed to connect to MongoDB:", error.message);
      });

    // Initialize Telegram bot configuration
    startTelegram();

    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`Running in ${NODE_ENV} mode`);
      console.log(`🌐 Webhook URL: ${SERVER_URL}/webhook/telegram`);
    });
  } catch (error) {
    console.error("❌ Error initializing the application:", error.message);
  }
};

// Start the application
initializeApp();
