const {
  createCipheriv,
  randomBytes,
  createHash,
  scryptSync,
  createDecipheriv,
} = require("crypto");
const { ENCRYPTION_KEY, HASH_SALT } = require("../config/env"); // Importing from env.js for consistency

if (!ENCRYPTION_KEY || !HASH_SALT) {
  throw new Error(
    "Encryption key or hash salt is not set. Please check your environment variables."
  );
}

const algorithm = "aes-256-cbc";
const salt = HASH_SALT;

const getValidatedKey = () => {
  try {
    if (!ENCRYPTION_KEY) {
      throw new Error(
        "Encryption key is not set. Please set the ENCRYPTION_KEY environment variable."
      );
    }

    if (typeof ENCRYPTION_KEY === "string") {
      if (
        ENCRYPTION_KEY.length === 64 &&
        /^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)
      ) {
        const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");
        if (keyBuffer.length !== 32) {
          throw new Error(
            "Encryption key must be exactly 32 bytes long for AES-256-CBC."
          );
        }
        return keyBuffer;
      }

      const derivedKey = scryptSync(ENCRYPTION_KEY, salt, 32);
      if (derivedKey.length !== 32) {
        throw new Error(
          "Derived key must be exactly 32 bytes long for AES-256-CBC."
        );
      }
      return derivedKey;
    }

    if (Buffer.isBuffer(ENCRYPTION_KEY)) {
      if (ENCRYPTION_KEY.length !== 32) {
        throw new Error(
          "Encryption key must be exactly 32 bytes long for AES-256-CBC."
        );
      }
      return ENCRYPTION_KEY;
    }

    throw new Error(
      "Encryption key must be a Buffer. Please check your configuration."
    );
  } catch (error) {
    throw new Error("Failed to validate encryption key");
  }
};

const encrypt = (text) => {
  try {
    if (typeof text !== "string") {
      throw new Error("Text to encrypt must be a string.");
    }

    const key = getValidatedKey();
    if (key.length !== 32) {
      throw new Error(
        "Encryption key must be exactly 32 bytes long for AES-256-CBC."
      );
    }
    const iv = randomBytes(16);
    if (iv.length !== 16) {
      throw new Error("IV must be exactly 16 bytes long for AES-256-CBC.");
    }

    const cipher = createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Combine IV and encrypted data to not store iv separately
    const combined = iv.toString("hex") + ":" + encrypted;

    return combined;
  } catch (error) {
    throw new Error("Failed to encrypt data");
  }
};

const decrypt = (combinedData) => {
  try {
    if (!combinedData || typeof combinedData !== "string") {
      throw new Error("Combined data must be a non-empty string.");
    }
    if (combinedData.length < 32) {
      throw new Error(
        "Combined data is too short to contain valid IV and encrypted data."
      );
    }

    const key = getValidatedKey();
    const [iv, encryptedData] = combinedData
      .split(":")
      .map((part) => Buffer.from(part, "hex"));

    if (encryptedData.length === 0) {
      throw new Error("Encrypted data is empty.");
    }

    if (iv.length !== 16) {
      throw new Error("IV must be exactly 16 bytes long for AES-256-CBC.");
    }

    const decipher = createDecipheriv(algorithm, key, iv);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, "hex", "utf8");

    // remove the not processed part to complete the decryption
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Failed to decrypt data");
  }
};

const createLookupHash = (apiKey) => {
  return createHash("sha256")
    .update(apiKey + salt)
    .digest("hex");
};

module.exports = {
  encrypt,
  decrypt,
  createLookupHash,
};
