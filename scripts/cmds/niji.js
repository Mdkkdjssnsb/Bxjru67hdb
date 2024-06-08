const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "niji",
    aliases: [`nijix`],
    author: "ArYAN",
    version: "1.0",
    cooldowns: 0,
    role: 0,
    longDescription: {
      en: "Generates an anime image based on niji style.",
      category: "fun",
      guide: "{p}niji [ prompt ]",
    },
  },
  onStart: async function ({ message, args, api, event }) {
    api.setMessageReaction("🔎", event.messageID, (err) => {}, true);

    try {
      const prompt = args.join(" ");
      if (!prompt) {
        return api.sendMessage(
          "⛔ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗨𝘀𝗲\n━━━━━━━━━━━━━━━\n\nPlease provide some prompt",
          event.threadID,
          event.messageID
        );
      }
      await message.reply(`𝖢𝗋𝖾𝖺𝗍𝗂𝗇𝗀 𝗒𝗈𝗎𝗋 𝗂𝗆𝖺𝗀𝗂𝗇𝖺𝗍𝗂𝗈𝗇 𝖻𝖺𝗌𝖾𝖽 𝗈𝗇 𝗇𝗂𝗃𝗂 𝗌𝗍𝗒𝗅𝖾`);
      const baseUrl = `https://itsaryan.onrender.com/api/niji?prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(baseUrl, {
        responseType: "arraybuffer"
      });

      const cacheFolderPath = path.join(__dirname, "/cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }

      const imagePath = path.join(cacheFolderPath, `niji.png`);
      fs.writeFileSync(imagePath, response.data);

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      message.reply({
        body: "🖼️ [ 𝗡𝗜𝗝𝗜 ]\n━━━━━━━━━━━━━━━\n\n𝖧𝖾𝗋𝖾 𝗂𝗌 𝗒𝗈𝗎𝗋 𝖼𝗋𝖾𝖺𝗍𝖾𝖽 𝗂𝗆𝖺𝗀𝖾 𝖻𝖺𝗌𝖾𝖽 𝗈𝗇 𝗇𝗂𝗃𝗂 𝗌𝗍𝗒𝗅𝖾",
        attachment: fs.createReadStream(imagePath)
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }
};