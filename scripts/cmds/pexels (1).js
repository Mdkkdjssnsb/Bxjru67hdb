const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

const LimitsFilePath = path.join(__dirname, 'userhshsgsgdata.json');

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
    name: "pexels",
    aliases: ["px"],
    version: "1.0",
    author: "ArYAN",
    role: 0,
    countDown: 0,
    longDescription: {
      en: "This command allows you to search for images on Pexels based on a given query and fetch a specified number of images."
    },
    category: "media",
    guide: {
      en: ".pexels <search query> <number of images>\nExample: .pexels sky -5"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      // Check user's daily limits
      const userId = event.senderID;
      let userLimit = UserLimits.get(userId) || 0;
      if (userLimit >= 10) {
        await api.sendMessage("You have reached your daily limits.", event.threadID);
        return;
      }

      const keySearch = args.join(" ");
      if (!keySearch.includes("-")) {
        return api.sendMessage(
          `🔎 Invalid Usage ( ${userLimit}/10 )\n\nPlease enter the search query and number of images.`,
          event.threadID,
          event.messageID
        );
      }
      const keySearchs = keySearch.substr(0, keySearch.indexOf('-'));
      let numberSearch = parseInt(keySearch.split("-").pop()) || 9;

      const apiUrl = `https://aryanapiz.onrender.com/api/pexels?query=${encodeURIComponent(keySearchs)}&keysearch=5`;

      const startTime = new Date().getTime(); // Define startTime

      api.setMessageReaction("⏰", event.messageID, () => {}, true);

      const res = await axios.get(apiUrl);
      const data = res.data.result;
      const imgData = [];

      for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
        const imgResponse = await axios.get(data[i], { responseType: "arraybuffer" });
        const imgPath = path.join(__dirname, "cache", `${i + 1}.jpg`);
        await fs.outputFile(imgPath, imgResponse.data);
        imgData.push(fs.createReadStream(imgPath));
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      const endTime = new Date().getTime(); // Move endTime inside the asynchronous block
      const timeTaken = (endTime - startTime) / 1000;

      await api.sendMessage({
        body: `🖼️ Pexels ( ${userLimit}/10 )\n\nHere are the top results of the query ${keySearchs} from Pexels\nTime taken: ${timeTaken} seconds`,
        attachment: imgData,
      }, event.threadID, event.messageID);

      // Increment user's daily limit
      userLimit++;
      UserLimits.set(userId, userLimit);

      // Save user limits to the JSON file
      fs.writeFileSync(LimitsFilePath, JSON.stringify([...UserLimits]), 'utf8');

      await fs.remove(path.join(__dirname, "cache"));
    } catch (error) {
      console.error(error);
      return api.sendMessage("An error occurred.", event.threadID, event.messageID);
    }
  }
};
