const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const OWNER_ID = parseInt(process.env.OWNER_ID);
 // Replace with your Telegram ID

let postContent = null; // { text, entities }
let spamInterval = 60;

// Track loop time per user
const awaitingLoopTime = {};

// Track groups: { chatId: title }
const groups = {
-10280148012: "group a",
-1002228107370: "group b",
-1002656803613: "group c",
-1002614899141: "group d",
-1002227110403: "group e",
-1002322670145: "group f",
-1002455363798: "group g",
-1002527342697: "group h",
-1002619445286: "group i",
-1002633901541: "group j",
-1002493078128: "group k",
-1002327454659: "group l",
-1002540771844: "group m",
-1002100609634: "group n",
-1002654030830: "group o",
-1002600864408: "group p",
-1002238206001: "group q",
-1002301926531: "group r",
-1002694498217: "group s",
-1002553409493: "group t",
-1002661350390: "group u",
-1002059928976: "group v",
-1002246655225: "group w",
-1002520102110: "group x",
-1002498454561: "group y",
-1002637822466: "group z",
-1002663947477: "group aa",
-1002599502331: "group ab",
-1002273217707: "group ac",
-1002108989538: "group ad",
-1001898875738: "group ae",
-1002846103860: "group af",
-1002600857675: "group ag",
-1002206191431: "group ah",
-1002357081822: "group ai",
-1002015189565: "group aj",
-1002678236965: "group ak",
-1002666184806: "group al",
-1002566181965: "group am",
-1002360271412: "group an",
-1002387381972: "group ao",
-1002168300498: "group ap",
-1002337216252: "group aq",
-1002716009105: "group ar",
-1002696659266: "group as",
-1001905543579: "group at",
-1001476181739: "group au",
-1002815246356: "group av",
-1002586286131: "group aw",
-1002258185280: "group ax",
-1002587793008: "group ay",
-1002346843471: "group az",
-1002854589649: "group ba",
-1002369171294: "group bb",
-1002301348419: "group bc",
-1002462780539: "group bd",
-1002387527386: "group be",
-1002409585305: "group bf",
-1002526840132: "group bg",
-1002519536560: "group bh",
-1002312090644: "group bi",
-1002646566065: "group bj",
-1002466648820: "group bk",
-1002570522406: "group bl",
-1002418277328: "group bm",
-1002588837333: "group bn",
-1002445100745: "group bo",
-1002409325969: "group bp",
-1002512448835: "group bq",
-1002452478083: "group br",
-1002625353703: "group bs",
-1002403190122: "group bt",
-1002451163678: "group bu",
-1002368102037: "group bv",
-1002608197408: "group bw",
-1002681971626: "group bx",
-1001863926651: "group by",
-1002410886735: "group bz",
-1001641822812: "group ca",
-1002263903639: "group cb",
-1002473847067: "group cc",
-1002454389695: "group cd",
-1002483157692: "group ce",
-1002575498874: "group cf",
-1002518376642: "group cg",
-1001463403728: "group ch",
-1002693685848: "group ci",
-1002351825932: "group cj",
-1002648620439: "group ck",
-1002649743011: "group cl",
-1002102659712: "group cm",
-1002442288374: "group cn",
-1002463109759: "group co",
-1001730582920: "group cp",
-1002667988255: "group cq",
-1002697339313: "group cr",
-1002330779005: "group cs",
-1002431518186: "group ct",
-1001359910058: "group cu",
-1002589517706: "group cv",
-1002140379859: "group cw",
-1002571606550: "group cx",
-1002357687516: "group cy",
-1002527712881: "group cz",
-1002630723865: "group da",
-1002320834510: "group db",
-1002656735984: "group dc",
-1002652887850: "group dd",
-1002518223674: "group de",
-1002700871501: "group df",
-1002291957085: "group dg",
-1002642837931: "group dh",
-1002291549956: "group di",
-1001837030838: "group dj",
-1002545895625: "group dk",
-1002690713963: "group dl",
-1002896485001: "group dm",
-1002516233353: "group dn",
-1002538618143: "group do",
-1002675083098: "group dp",
-1002691593163: "group dq",
-1002321278762: "group dr",
-1002524050571: "group ds",
-1002045524835: "group dt",
-1002292245376: "group du",
-1002689117112: "group dv",
-1001806265377: "group dw",
-1002409488388: "group dx",
-1002665048941: "group dy",
-1002719841044: "group dz",
-1002646269788: "group ea",
-1002260453637: "group eb",
-1001891395710: "group ec",
-1002627997432: "group ed",
-1002587391401: "group ee",
-1002525813316: "group ef",
-1002891763213: "group eg",
-1002605621899: "group eh",
-1002600597993: "group ei",
-1002581503290: "group ej",
-1002507166349: "group ek",
-1002463705322: "group el",
-1002684454917: "group em",
-1002003139846: "group en",
-1002687424152: "group eo",
-1002141823601: "group ep",
-1002860157133: "group eq",
-1002587505279: "group er",
-1002865189530: "group es",
-1002393489118: "group et",
-1002631131137: "group eu",
-1002852032309: "group ev",
-1002062280049: "group ew",
-1002689591310: "group ex",
-1002675382983: "group ey",
-1002586977700: "group ez",
-1002283194496: "group fa",
-1002210699344: "group fb",
-1002603524817: "group fc",
-1002701919943: "group fd",
-1002543828305: "group fe",
-1002552480289: "group ff",
-1002723014005: "group fg",
-1002648266745: "group fh",
-1002629233150: "group fi",
-1002232457371: "group fj",
-1002222352694: "group fk",
-1002392499233: "group fl",
-1002691209901: "group fm",
-1002002316119: "group fn",
-1002580266543: "group fo",
-1002598750864: "group fp",
-1002262012605: "group fq",
-1002384051303: "group fr",
-1002861717078: "group fs",
-1002332854462: "group ft",
-1002850297845: "group fu",
-1002552751259: "group fv",
-1002698742585: "group fw",
-1002826675584: "group fx",
-1002454924416: "group fy",
-1002451648791: "group fz",
-1002268299853: "group ga",
-1002578791659: "group gb",
-1002382849977: "group gc",
-1002661538844: "group gd",
-1002397218773: "group ge",
-1002712504536: "group gf"
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

bot.onText(/^\/spam$/, (msg) => {
  if (msg.from.id !== OWNER_ID || !postContent) return;
  if (spamInterval) return bot.sendMessage(msg.chat.id, "⚠️ Spam already running.");
  spamInterval = setInterval(() => deliverPost(msg.chat.id, postContent), 60000); // default 60s
  bot.sendMessage(msg.chat.id, "✅ Spam started (every 60s).");
});

bot.onText(/^\/stop$/, (msg) => {
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
    bot.sendMessage(chatId, `🔁 Loop started every ${seconds}s. Use /stop to stop.`);
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
      return bot.sendMessage(chatId, "⚠️ Loop already running. Use /stop to stop.");
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
