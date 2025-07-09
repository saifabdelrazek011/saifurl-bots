const api = require("./api.utils.js");

const checkApiKeyExists = async (apikey) => {
  try {
    const response = await api.get(`/users/apikey/check`, {
      headers: {
        "x-api-key": apikey,
      },
    });
    if (response.status === 200 || response.data.status === "success") {
      return true; // API key exists
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

module.exports = {
  checkApiKeyExists,
};
