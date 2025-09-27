require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const OWNER_ID = parseInt(process.env.OWNER_ID);
const PORT = process.env.PORT || 3000;

if (!OWNER_ID) {
  console.error("❌ Missing OWNER_ID in .env");
  process.exit(1);
}

const botConfigs = [
  { token: process.env.BOT_TOKEN_1, username: process.env.BOT_USERNAME_1, name: "archita" },
  { token: process.env.BOT_TOKEN_2, username: process.env.BOT_USERNAME_2, name: "Aditi" },
];

// ================== STATE ==================
const bots = [];
const botData = {}; // token → {postContent, spamInterval, awaitingLoopTime, autoGroups, manualGroups}

// ================== INIT BOTS ==================
botConfigs.forEach((config) => {
  if (!config.token) return console.error(`❌ Missing token for ${config.name}`);
  try {
    const bot = new TelegramBot(config.token, { polling: true });
    bots.push(bot);
    botData[config.token] = {
      name: config.name,
      username: config.username,
      postContent: null,
      spamInterval: null,
      awaitingLoopTime: false,
      autoGroups: new Map(),
      manualGroups: new Map(),
    };
    console.log(`✅ ${config.name} started`);
    setupBot(bot, config.token);
  } catch (err) {
    console.error(`❌ Failed to start ${config.name}:`, err.message);
  }
});

// ================== CORE DELIVERY ==================
async function deliverPost(bot, botToken, ownerChatId) {
  const { postContent, autoGroups, manualGroups, name } = botData[botToken];
  if (!postContent) return bot.sendMessage(ownerChatId, "❌ No post saved!");

  const allGroups = new Map([...autoGroups, ...manualGroups]);
  let success = 0,
    failed = 0;
  let report = "";

  for (const [chatId, title] of allGroups) {
    try {
      await bot.sendMessage(chatId, postContent.text, { entities: postContent.entities || [] });
      report += `✅ *${title}* \`(${chatId})\`\n`;
      success++;
    } catch (e) {
      report += `❌ *${title}* \`(${chatId})\`\n`;
      failed++;
    }
  }

  // Send report in chunks
  const maxLength = 4000;
  if (report.length > maxLength) {
    const lines = report.split("\n");
    let chunk = "",
      part = 1;
    for (const line of lines) {
      if ((chunk + line + "\n").length > maxLength) {
        await bot.sendMessage(ownerChatId, `📦 *Report Part ${part}:*\n\n${chunk}`, { parse_mode: "Markdown" });
        chunk = "";
        part++;
      }
      chunk += line + "\n";
    }
    if (chunk) await bot.sendMessage(ownerChatId, `📦 *Report Part ${part}:*\n\n${chunk}`, { parse_mode: "Markdown" });
  } else {
    await bot.sendMessage(ownerChatId, `📦 *Delivery Report:*\n\n${report}`, { parse_mode: "Markdown" });
  }

  await bot.sendMessage(ownerChatId, `📊 *Summary:* ✅ ${success} | ❌ ${failed} | 👥 Total: ${allGroups.size}`);
}

// ================== BOT SETUP ==================
function setupBot(bot, botToken) {
  const data = botData[botToken];

  // Start command
  // bot.onText(/^\/start$/, (msg) => {
  //   if (msg.from.id === OWNER_ID) {
  //     bot.sendMessage(msg.chat.id, `🤖 ${data.name} Commands:
  //     /createpost → Create a post
  //     /groups → List groups
  //     /stop → Stop loop`);
  //   }
  // });
  bot.onText(/^\/start$/, (msg) => {
    if (msg.from.id === OWNER_ID) {
      bot.sendMessage(msg.chat.id, `🤖 ${data.name} Owner Commands:
      /createpost → Create a post
      /stop → Stop loop
      /groups → List groups`);
    } else if (msg.chat.type === "private") {
      bot.sendMessage(msg.chat.id, `✨ Hello, ${msg.from.first_name}!  \nI'm 🤖 ${data.name}  \n\n🔥 What can I do?  \n• Make things fun 🎉  \n• Help you grow 🚀  \n• Flirt a little 😉  \n• Lock exclusive content 🔒  \n\n➕ Add me to your groups and let’s get started!`, {
        reply_markup: {
          inline_keyboard: [[{ text: `➕ Add Me In group 💗`, url: `https://t.me/${data.username}?startgroup=true` }]],
        },
      });
    }
  });
  // Auto group detection
  bot.on("message", (msg) => {
    if ((msg.chat.type === "group" || msg.chat.type === "supergroup") && !data.autoGroups.has(msg.chat.id)) {
      data.autoGroups.set(msg.chat.id, msg.chat.title || "Unnamed Group");
      bot.sendMessage(OWNER_ID, `🤖 ${data.name} new group: ${msg.chat.title} (${msg.chat.id})`);
    }
  });

  // List groups
  bot.onText(/^\/groups$/, (msg) => {
    if (msg.from.id !== OWNER_ID) return;
    const allGroups = new Map([...data.autoGroups, ...data.manualGroups]);
    if (!allGroups.size) return bot.sendMessage(msg.chat.id, "❌ No groups found");
    let list = "👥 *Groups:*\n";
    allGroups.forEach((title, id) => (list += `- *${title}* \`${id}\`\n`));
    bot.sendMessage(msg.chat.id, list, { parse_mode: "Markdown" });
  });

  // Create post
  bot.onText(/^\/createpost$/, (msg) => {
    if (msg.from.id !== OWNER_ID) return;
    data.postContent = null;
    data.awaitingLoopTime = false;
    bot.sendMessage(msg.chat.id, "✍️ Send the formatted post content (Markdown, bold, links).");
  });

  // Stop loop
  bot.onText(/^\/stop$/, (msg) => {
    if (msg.from.id !== OWNER_ID) return;
    if (data.spamInterval) {
      clearInterval(data.spamInterval);
      data.spamInterval = null;
      bot.sendMessage(msg.chat.id, "🛑 Loop stopped.");
    } else bot.sendMessage(msg.chat.id, "⚠️ No loop running.");
  });

  // Message handler for post + loop
  bot.on("message", (msg) => {
    if (msg.from.id !== OWNER_ID || msg.chat.type !== "private" || msg.text.startsWith("/")) return;

    // Handle loop time
    if (data.awaitingLoopTime) {
      const sec = parseInt(msg.text);
      if (isNaN(sec) || sec < 5) return bot.sendMessage(msg.chat.id, "❌ Invalid time (min 5s).");
      data.spamInterval = setInterval(() => deliverPost(bot, botToken, OWNER_ID), sec * 1000);
      data.awaitingLoopTime = false;
      return bot.sendMessage(msg.chat.id, `🔁 Loop started every ${sec}s. Use /stop to stop.`);
    }

    // Save post + show preview
    data.postContent = { text: msg.text, entities: msg.entities || [] };
    bot.sendMessage(msg.chat.id, "📝 *Preview:*\n\n" + msg.text, {
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

  // Inline buttons
  bot.on("callback_query", async (q) => {
    const chatId = q.message.chat.id;
    const msgId = q.message.message_id;
    const dataCb = q.data;

    if (!data.postContent) return;

    if (dataCb === "cancel") {
      data.postContent = null;
      return bot.editMessageText("❌ Post canceled.", { chat_id: chatId, message_id: msgId });
    }

    if (dataCb === "broadcast") {
      await bot.editMessageText("🚀 Broadcasting...", { chat_id: chatId, message_id: msgId });
      await deliverPost(bot, botToken, OWNER_ID);
    }

    if (dataCb === "setloop") {
      if (data.spamInterval) return bot.sendMessage(chatId, "⚠️ Loop already running. Use /stop to stop.");
      bot.sendMessage(chatId, "⏱ Send time in seconds for repeating spam:");
      data.awaitingLoopTime = true;
    }
  });
}

// ================== EXPRESS SERVER ==================
const app = express();
app.get("/", (req, res) => res.send("<h1><b>Hello Duniya<<b>/h1>"));
app.listen(PORT, () => console.log(`🌐 Server running on ${PORT}`));
