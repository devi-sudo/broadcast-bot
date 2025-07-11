const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const OWNER_ID = parseInt(process.env.OWNER_ID);
 // Replace with your Telegram ID

let postContent = null; // { text, entities }
let spamInterval = null;

// Track loop time per user
const awaitingLoopTime = {};

// Track groups: { chatId: title }
const groups = {
  "-101814081": "Group A",
  "-1948012": "Group B",
  "-18401": "Group C",
};

// -------------------- Commands --------------------

bot.onText(/^\/start$/, (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  bot.sendMessage(msg.chat.id, `🤖 Spam Bot Active.\nUse /createpost to begin.`);
});

bot.onText(/^\/createpost$/, (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  postContent = null;
  bot.sendMessage(msg.chat.id, "✍️ Send the formatted post content (bold, links, etc).");
});

bot.onText(/^\/startspam$/, (msg) => {
  if (msg.from.id !== OWNER_ID || !postContent) return;
  if (spamInterval) return bot.sendMessage(msg.chat.id, "⚠️ Spam already running.");
  spamInterval = setInterval(() => deliverPost(msg.chat.id, postContent), 60000); // default 60s
  bot.sendMessage(msg.chat.id, "✅ Spam started (every 60s).");
});

bot.onText(/^\/stopspam$/, (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  if (spamInterval) {
    clearInterval(spamInterval);
    spamInterval = null;
    bot.sendMessage(msg.chat.id, "🛑 Spam stopped.");
  } else {
    bot.sendMessage(msg.chat.id, "⚠️ No spam loop running.");
  }
});

bot.onText(/^\/groups$/, (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  const list = Object.entries(groups)
    .map(([id, name]) => `📍 *${name}* — \`${id}\``)
    .join("\n");
  bot.sendMessage(msg.chat.id, `👥 *Supergroups List:*\n\n${list}`, {
    parse_mode: "Markdown",
  });
});

// -------------------- Group Auto Registration --------------------

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // Register groups
  if ((msg.chat.type === "group" || msg.chat.type === "supergroup") && !groups[chatId]) {
    groups[chatId] = msg.chat.title || "Unnamed Group";
  }

  // Only process owner text for post content
  if (msg.from.id !== OWNER_ID || !msg.text || msg.text.startsWith("/")) return;

  // If user is setting loop time
  if (awaitingLoopTime[chatId]) {
    const seconds = parseInt(msg.text);
    if (isNaN(seconds)) {
      return bot.sendMessage(chatId, "❌ Invalid time. Please send a number in seconds.");
    }

    spamInterval = setInterval(() => deliverPost(chatId, postContent), seconds * 1000);
    bot.sendMessage(chatId, `🔁 Loop started every ${seconds}s. Use /stopspam to stop.`);
    awaitingLoopTime[chatId] = false;
    return;
  }

  // Save post content with formatting
  postContent = {
    text: msg.text,
    entities: msg.entities || [],
  };

  bot.sendMessage(chatId, "📝 *Preview:*\n\n" + msg.text, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Broadcast Now", callback_data: "broadcast" }],
        [{ text: "🕒 Set Timer Loop", callback_data: "setloop" }],
        [{ text: "🗑 Cancel", callback_data: "cancel" }],
      ],
    },
  });
});

// -------------------- Inline Button Handling --------------------

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;
  const data = query.data;

  if (!postContent) return;

  if (data === "cancel") {
    postContent = null;
    return bot.editMessageText("❌ Post canceled.", {
      chat_id: chatId,
      message_id: msgId,
    });
  }

  if (data === "broadcast") {
    await bot.editMessageText("🚀 Broadcasting...", {
      chat_id: chatId,
      message_id: msgId,
    });
    await deliverPost(chatId, postContent);
  }

  if (data === "setloop") {
    if (spamInterval) {
      return bot.sendMessage(chatId, "⚠️ Loop already running. Use /stopspam to stop.");
    }
    bot.sendMessage(chatId, "⏱ Send time in seconds for repeating spam:");
    awaitingLoopTime[chatId] = true;
  }
});

// -------------------- Delivery Logic --------------------

async function deliverPost(ownerChatId, post) {
  let report = "";

  for (const [chatId, title] of Object.entries(groups)) {
    try {
      await bot.sendMessage(chatId, post.text, {
        entities: post.entities,
      });
      report += `✅ *${title}* \`(${chatId})\`\n`;
    } catch (e) {
      report += `❌ *${title}* \`(${chatId})\`\n`;
    }
  }

  bot.sendMessage(ownerChatId, `📦 *Delivery Report:*\n\n${report}`, {
    parse_mode: "Markdown",
  });
}
