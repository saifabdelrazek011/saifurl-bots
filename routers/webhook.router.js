const express = require("express");
const { getBot } = require("../config/telegram");

const webhookRouter = express.Router();

webhookRouter.post("/telegram", (req, res) => {
  const telegramBot = getBot();
  telegramBot.processUpdate(req.body);
  res.sendStatus(200);
});

module.exports = webhookRouter;
