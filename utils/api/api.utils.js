const axios = require("axios");
const { SAIFAPI_URL } = require("../../config/env");

const api = axios.create({
  baseURL: SAIFAPI_URL,
  timeout: 5000, // Set a timeout of 5 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

module.exports = api;
