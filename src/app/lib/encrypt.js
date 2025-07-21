const crypto = require("crypto");

export const encrypt = (text, env_key) => {
  const key = Buffer.from(env_key, "hex");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  return `${encrypted}:${iv.toString("base64")}`;
};

export const decrypt = (encryptedString, env_key) => {
  const key = Buffer.from(env_key, "hex");
  const [encryptedData, ivBase64] = encryptedString.split(":");
  const iv = Buffer.from(ivBase64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};


