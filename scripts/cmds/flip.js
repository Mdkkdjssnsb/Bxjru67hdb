const flipHistory = [];

module.exports = {
  config: {
    name: "flip",
    version: "1.2",
    author: "ArYAN",
    role: 0,
    shortDescription: {
      en: "Flip a coin and bet on heads or tails."
    },
    longDescription: {
      en: "Flip a coin and bet on heads or tails."
    },
    category: "economy",
    guide: {
      en: ".flip [ heads / tails / view ] [amount] "
    }
  },
  onStart: async function ({ api, event, args, usersData }) {
    if (!event.senderID) {
      console.error("Error: event.senderID is undefined.");
      return;
    }

    const userId = event.senderID;
    let userData = await usersData.get(userId);
    const userName = userData ? userData.name : "Unknown User";
    const userBalance = userData?.money || 0;

    const validActions = ["heads", "tails", "view", "history"];
    const selectedAction = args[0]?.toLowerCase();
    const betAmount = parseInt(args[1]);

    if (
      !validActions.includes(selectedAction) ||
      (selectedAction !== "view" && (isNaN(betAmount) || betAmount <= 0))
    ) {
      api.sendMessage(
        `❌ | 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗨𝘀𝗮𝗴𝗲\n━━━━━━━━━━━━━━\nCorrect format: .flip [ heads / tails / view ] [amount]`,
        event.threadID,
        event.messageID
      );
      return;
    }

    if (selectedAction === "view") {
      api.sendMessage(
        `💰 | 𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗕𝗮𝗹𝗮𝗻𝗰𝗲\n━━━━━━━━━━━━━━\nYour balance: $${userBalance}`,
        event.threadID,
        event.messageID
      );
      return;
    }

    if (!userData) {
      userData = { money: 0 };
    }

    if (userData.money < betAmount) {
      api.sendMessage(
        `❌ | 𝗜𝗻𝘀𝘂𝗳𝗳𝗶𝗰𝗶𝗲𝗻𝘁 𝗙𝘂𝗻𝗱𝘀\n━━━━━━━━━━━━━━\nPlease deposit more money to your bank account.`,
        event.threadID,
        event.messageID
      );
      return;
    }

    const result = Math.random() < 0.5 ? "heads" : "tails";
    const isWin = result === selectedAction;

    if (isWin) {
      userData.money += betAmount;
      api.sendMessage(
        `🎉 | 𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀!\n━━━━━━━━━━━━━━\nYou guessed correctly and won $${betAmount}. Your new balance: $${userData.money}`,
        event.threadID,
        event.messageID
      );
      flipHistory.push({ result: "win", amount: betAmount });
    } else {
      userData.money -= betAmount;
      api.sendMessage(
        `😢 𝗕𝗮𝗱 𝗟𝘂𝗰𝗸 |\n━━━━━━━━━━━━━━\nYou guessed wrong and lost $${betAmount}. Your new balance: $${userData.money}`,
        event.threadID,
        event.messageID
      );
      flipHistory.push({ result: "lost", amount: betAmount });
    }

    await usersData.set(userId, userData);
  },
};