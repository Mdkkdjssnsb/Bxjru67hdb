const axios = require('axios');
const tinyurl = require('tinyurl');
const fs = require('fs');
const path = require('path');

const LimitsFilePath = path.join(__dirname, 'userdata.json');

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
    name: "4k",
    aliases: ["upscale"],
    version: "1.0",
    author: "ArYAN",
    countDown: 10,
    role: 0,
    longDescription: {
      en: "Upscale your image.",
    },
    category: "media",
    guide: {
      en: "{pn} reply to an image"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    let imageUrl;
    let userLimit = 0; // Define userLimit here and initialize it with 0

    if (event.type === "message_reply") {
      const replyAttachment = event.messageReply.attachments[0];

      if (["photo", "sticker"].includes(replyAttachment?.type)) {
        imageUrl = replyAttachment.url;
      } else {
        return api.sendMessage(
          { body: `⛔ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗨𝘀𝗲 ( ${userLimit}/10 )\n\n➤ Please reply to an image.` },
          event.threadID
        );
      }
    } else if (args[0]?.match(/(https?:\/\/.*\.(?:png|jpg|jpeg))/g)) {
      imageUrl = args[0];
    } else {
      return api.sendMessage(
        { body: `⛔ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗨𝘀𝗲 ( ${userLimit}/10 )\n\n➤ Please reply to an image or provide a valid image URL.` },
        event.threadID
      );
    }

    try {
      // Check user's daily limits
      const userId = event.senderID;
      userLimit = UserLimits.get(userId) || 0;
      if (userLimit >= 10) {
        await message.reply("You have reached your daily limits.");
        return;
      }

      const url = await tinyurl.shorten(imageUrl);
      const response = await axios.get(`https://itsaryan.onrender.com/api/4k?url=${url}`);

      message.reply("🔎| 𝖯𝗋𝗈𝖼𝖾𝗌𝗌𝗂𝗇𝗀 𝗒𝗈𝗎𝗋 𝗋𝖾𝗊𝗎𝖾𝗌𝗍 𝗉𝗅𝖾𝖺𝗌𝖾 𝗐𝖺𝗂𝗍.......");

      const resultUrl = response.data.resultUrl;

      const imageData = await global.utils.getStreamFromURL(resultUrl);

      message.reply({ body: `🖼️|𝗨𝗣𝗦𝗖𝗔𝗟𝗘𝗗 ( ${userLimit}/10 )`, attachment: imageData });

      // Increment user's daily limit
      userLimit++;
      UserLimits.set(userId, userLimit);

      // Save user limits to the JSON file
      fs.writeFileSync(LimitsFilePath, JSON.stringify([...UserLimits]), 'utf8');
    } catch (error) {
      message.reply(`⛔ 𝗘𝗿𝗿𝗼𝗿 ( ${userLimit}/10 )\n\n➤ Invalid response from API. ${error.message} please contact 𝗍𝗈 𝖠𝗋𝗒𝖺𝗇 𝗍𝗈 𝗀𝖾𝗍 𝗇𝖾𝗐 𝖺𝗉𝗂𝗄𝖾𝗒`);
    }
  }
};
