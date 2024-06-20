const axios = require('axios');
const fs = require('fs');
const path = require('path');

const prefix = '.'; // Define the command prefix

const LimitsFilePath = path.join(__dirname, 'userdagdsgta.json');

let UserLimits = new Map();

// Load user limits from the JSON file
try {
  const limitsData = fs.readFileSync(LimitsFilePath, 'utf8');
  UserLimits = new Map(JSON.parse(limitsData));
} catch (error) {
  console.error("Error loading user limits:", error.message);
}

module.exports = {
  config: {
    name: "orochi",
    aliases: [`chi`],
    version: 1.0,
    author: "ArYAN",
    longDescription: {
      en: "Ask an questions from Orochi Ai based on Advanced model ( GPT-3 )"
    },
    category: "ai",
    guide: {
      en: ".chi [ questions ]",
    },
  },
  onStart: async function ({ api, event, args, message }) {
    try {
      // Check user's daily limits
      const userId = event.senderID;
      const userLimit = UserLimits.get(userId) || 0;
      if (userLimit >= 50) {
        await message.reply("You have reached your daily limits.");
        return;
      }

      const prompt = event.body.substring(prefix.length).trim();
      if (!prompt) {
        await message.reply(`🤖 𝗢𝗿𝗼𝗰𝗵𝗶\n\nHello! How can I assist you today?`);
        return;
      }

      api.setMessageReaction("🔎", event.messageID, (err) => {}, true);

      const response = await axios.get(`https://itsaryan.onrender.com/api/orochiai?prompt=${encodeURIComponent(prompt)}`);
      const answer = response.data.fullResponse;

      api.setMessageReaction("🔎", event.messageID, (err) => {}, true);

      await message.reply(answer);

      api.setMessageReaction("🟢", event.messageID, (err) => {}, true);

      // Increment user's daily limit
      UserLimits.set(userId, userLimit + 1);

      // Save user limits to the JSON file
      fs.writeFileSync(LimitsFilePath, JSON.stringify([...UserLimits]), 'utf8');

    } catch (error) {
      console.error("Error:", error.message);
    }
  }
};
