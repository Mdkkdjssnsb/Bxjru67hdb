const axios = require("axios");
const path = require("path");
const fs = require("fs");

const LimitsFilePath = path.join(__dirname, 'userdvhfatgda.json');

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
    name: "pinterest",
    aliases: ["pin"],
    version: "1.0",
    author: "ArYAN",
    role: 0,
    countDown: 20,
    longDescription: {
      en: "This command allows you to search for images on pinterest based on a given query and fetch a specified number of images (1-12)."
    },
    category: "Search",
    guide: {
      en: "{pn} <search query> <number of images>\nExample: {pn} tomozaki -5"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      // Check user's daily limits
      const userId = event.senderID;
      console.log("User ID:", userId);

      let userLimit = UserLimits.get(userId) || 0 ;
      console.log("User limit before checking:", userLimit);

      if (userLimit >= 5) {
        await api.sendMessage("You have reached your daily limits.", event.threadID, event.messageID);
        console.log("User reached daily limit. Exiting function.");
        return;
      }

      console.log("User limit after checking:", userLimit);

      const keySearch = args.join(" ");
      if (!keySearch.includes("-")) {
        return api.sendMessage(
          `⛔ Invalid Usage ( ${userLimit}/5 )\n━━━━━━━━━━━━━━━\n\nPlease enter the search query and number of images.`,
          event.threadID,
          event.messageID
        );
      }

      const keySearchs = keySearch.substr(0, keySearch.indexOf('-'));
      let numberSearch = keySearch.split("-").pop() || 6;
      if (numberSearch > 6) {
        numberSearch = 6;
      }

      const apiUrl = `https://aryanapiz.onrender.com/api/pinterest2?search=${encodeURIComponent(keySearchs)}&keysearch=${numberSearch}`;

      const res = await axios.get(apiUrl);
      const data = res.data.result;
      const imgData = [];

      for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
        const imgResponse = await axios.get(data[i], {
          responseType: "arraybuffer"
        });
        const imgPath = path.join(__dirname, "cache", `${i + 1}.jpg`);
        await fs.promises.writeFile(imgPath, imgResponse.data, 'binary');
        imgData.push(fs.createReadStream(imgPath));
      }

      await api.sendMessage({
        body: `📸 Pinterest ( ${userLimit}/5 )\n━━━━━━━━━━━━━━━\n\nHere are the top ${numberSearch} results for your query ${keySearchs}`,
        attachment: imgData,
      }, event.threadID, event.messageID);

      await fs.promises.rm(path.join(__dirname, "cache"), { recursive: true });

      // Increment user's daily limit
      userLimit++;
      console.log("User limit after incrementing:", userLimit);

      // Update user limits map
      UserLimits.set(userId, userLimit);

      // Save user limits to the JSON file
      fs.writeFileSync(LimitsFilePath, JSON.stringify([...UserLimits]), 'utf8');

    } catch (error) {
      console.error(error);
      return api.sendMessage(
        `An error occurred.`,
        event.threadID,
        event.messageID
      );
    }
  }
};
