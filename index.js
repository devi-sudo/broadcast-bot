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
const groups ={
  "-1002228107370": "Group 1",
  "-1002656803613": "Group 2",
  "-1002614899141": "Group 3",
  "-1002227110403": "Group 4",
  "-1002322670145": "Group 5",
  "-1002455363798": "Group 6",
  "-1002527342697": "Group 7",
  "-1002619445286": "Group 8",
  "-1002633901541": "Group 9",
  "-1002493078128": "Group 10",
  "-1002327454659": "Group 11",
  "-1002540771844": "Group 12",
  "-1002100609634": "Group 13",
  "-1002654030830": "Group 14",
  "-1002600864408": "Group 15",
  "-1002238206001": "Group 16",
  "-1002301926531": "Group 17",
  "-1002694498217": "Group 18",
  "-1002553409493": "Group 19",
  "-1002661350390": "Group 20"
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

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Basic uptime HTML route
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Adult Content</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
  .bkl{
   
  }
    .video-container {
      position: relative;
      cursor: pointer;
    }
    .video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(1px);
      z-index: 2;
      transition: all 0.3s ease;
    }
    .video-overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }
    .play-button {
      width: 60px;
      height: 60px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 15px;
    }
    .locked-content {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
      display: flex;
      align-items: center;
    }
    .ad-overlay {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      display: none;
      z-index:999;
    }
    .ad-overlay.show {
      display: block;
    }
    .nav-item.active {
      border-bottom: 2px solid #EC4899;
      color: #EC4899;
    }
    .ad-placeholder {
      background: linear-gradient(135deg, #1f2937, #111827);
      border: 1px dashed #4b5563;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #9CA3AF;
      font-size: 12px;
    }
  </style>
</head>
<body class="bg-gray-900 text-white">
  <!-- Navigation Bar -->
  <nav class="bg-gray-800 px-4 py-3 sticky top-0 z-10">
    <div class="container mx-auto flex justify-between items-center">
      <div class="flex items-center space-x-2">
        <i class="fas fa-fire text-pink-400"></i>
        <span class="font-bold">Archita Bot</span>
      </div>
      <div class="flex space-x-6">
        <a href="#" class="nav-item active">Home</a>
        <a href="" class="nav-item">Videos</a>
        <a href="" class="nav-item">Premium</a>
      </div>
      <div>
        <a href="#" class="text-pink-400 hover:text-pink-300">
          <i class="fas fa-user"></i>
        </a>
      </div>
    </div>
  </nav>

  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <!-- Top Ad Banner -->
    <div data-banner-id="6081766" class="ad-placeholder w-full h-20 mb-6 rounded-lg">
    </div>

    <!-- Header Section -->
    <div class="bg-gray-800 p-6 rounded-xl shadow-lg mb-6 text-center">
      <h1 class="text-3xl font-bold text-pink-400 mb-2">🔥 Archita Adult Bot 🔥</h1>
      <p class="text-gray-300 mb-4">👆 <span class="font-mono text-green-400">https://t.me/+skf10fQoBjxlNGVl</span></p>
      
      <div class="flex flex-col gap-3 mb-4">
        <a href="t.me/ig_downloaderobot?startgroup" class="bg-pink-500 hover:bg-pink-600 py-2 rounded-xl text-white font-semibold transition duration-300">
          <i class="fas fa-comment-dots mr-2"></i> Message Bot
        </a>
        <a href="https://t.me/ig_downloaderobot?startgroup=ture" class="bg-blue-500 hover:bg-blue-600 py-2 rounded-xl text-white font-semibold transition duration-300">
          <i class="fas fa-users mr-2"></i> Add to Group
        </a>
      </div>
    </div>

    <!-- Sidebar Ad (Left) and Content -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Left Sidebar Ad -->
      <div class="hidden md:block w-32 flex-shrink-0">
        <div class="ad-placeholder h-96 sticky top-24 rounded-lg">
          AD SPACE - 120x600
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1">
          
        <!-- Fake Video Player Section -->
        <div class="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
            <div class="bkl"> 
          <div class="video-container relative pt-[56.25%] bg-black">
            <!-- Thumbnail image (blurred) -->
            <img src="https://static.india.com/wp-content/uploads/2025/07/Featured-Story-2025-07-08T160302.230.png" 
                 class="absolute inset-0 w-full h-full object-cover" 
                 id="videoThumbnail">
            
            <!-- Actual video (hidden initially) -->
            <video id="previewVideo" class="absolute inset-0 w-full h-full object-cover hidden" controls>
              <source src="" type="video/mp4">
              <div data-banner-id="6081765"></div>
            </video>
            
            <!-- Blurred overlay with click to play -->
            <div id="videoOverlay" class="video-overlay">
              <div class="play-button">
                <i class="fas fa-play text-white text-2xl"></i>
              </div>
              <div class="text-center px-4">
                <p class="text-white font-bold mb-2">PREVIEW</p>
                <p class="text-gray-300 text-sm">Click to watch preview</p>
              </div>
              <div class="locked-content">
                <i class="fas fa-lock text-pink-400 mr-1"></i>
                <span class="text-white">Premium Content</span>
              </div>
            </div>
            
            <!-- Ad countdown overlay -->
            <div id="adOverlay" class="ad-overlay">
              <span class="text-white">Ad: </span>
              <span id="adCountdown" class="text-pink-400 font-bold">40</span>
              <span class="text-white">s</span>
              <button id="skipAdBtn" class="ml-4 bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded hidden">
                Skip Ad
              </button>
            </div>
          </div>
             </div>
          <!-- Video Info Section -->
          <div class="p-4">
            <div class="flex justify-between items-center mb-3">
              <h2 class="text-xl font-bold text-pink-400">Archita Leaked Contantt</h2>
              <div class="flex items-center text-gray-400">
                <i class="fas fa-eye mr-1"></i>
                <span class="text-sm">1.2k views</span>
              </div>
            </div>
            
            <div class="flex justify-between text-gray-300 text-sm mb-3">
              <span><i class="fas fa-calendar-alt mr-1"></i> Uploaded: Today</span>
              <span><i class="fas fa-clock mr-1"></i> Duration: 5:30</span>
            </div>
            
            <p class="text-gray-300 text-sm">
              🔥 This is premium content locked for members only. Join now for full access to all videos and features!
            </p>
          </div>
       
        </div>

        <!-- Mid-content Ad -->
        <div  data-banner-id="6081767"class="ad-placeholder w-full h-60 my-6 rounded-lg">
    
        </div>

        <!-- More Videos Section -->
        <h3 class="text-xl font-bold text-pink-400 mb-4">More Videos</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-800 rounded-lg overflow-hidden cursor-pointer">
            <div  class="relative pt-[56.25%] bg-black">
              <img src="https://images.news18.com/ibnlive/uploads/2025/07/Babydoll-Archi-Kendra-Lust-2025-07-61e9978fc757207ba27b3887bbf36ac4-16x9.jpg" 
                   class="absolute inset-0 w-full h-full object-cover">
              <div data-banner-id="1456442" class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div class="play-button">
                  <i class="fas fa-play text-white text-xl"></i>
                </div>
              </div>
              <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs">
                <i class="fas fa-lock text-pink-400 mr-1"></i>
                <span>Premium</span>
              </div>
            </div>
            <div class="p-3">
              <h4 class="font-medium text-white mb-1">Hot Girl Summer</h4>
              <div class="flex justify-between text-gray-400 text-xs">
                <span>12.4K views</span>
                <span>4:20</span>
              </div>
            </div>
          </div>
          <!-- Repeat similar blocks for more videos -->
        </div>
      </div>

      <!-- Right Sidebar Ad -->
      <div class="hidden md:block w-32 flex-shrink-0">
        <div data-banner-id="1456448"class="ad-placeholder h-96 sticky top-24 rounded-lg">
          AD SPACE - 120x600
        </div>
      </div>
    </div>

    <!-- Bottom Ad Banner -->
    <div data-banner-id="6081765" class="ad-placeholder w-full h-20 mt-6 rounded-lg">
      <div data-banner-id="1456442"></div>
    </div>

    <!-- Call to Action -->
    <div class="bg-gray-800 p-4 rounded-xl shadow-lg text-center mt-6">
      <p class="text-gray-300 mb-3">Unlock all exclusive content:</p>
      <a href="https://t.me/+skf10fQoBjxlNGVl" class="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 py-3 px-6 rounded-xl text-white font-bold inline-block transition duration-300">
        <i class="fas fa-unlock-alt mr-2"></i> Join Premium Channel
      </a>
      <p class="mt-4 text-sm text-gray-400">New videos added daily 🚀</p>
    </div>
  </div>

  <script>
    const videoOverlay = document.getElementById('videoOverlay');
    const previewVideo = document.getElementById('previewVideo');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const adOverlay = document.getElementById('adOverlay');
    const adCountdown = document.getElementById('adCountdown');
    const skipAdBtn = document.getElementById('skipAdBtn');
    
    let countdown = 40;
    let countdownInterval;
    
    videoOverlay.addEventListener('click', function() {
      // Show fake ad first
      adOverlay.classList.add('show');
      countdownInterval = setInterval(() => {
        countdown--;
        adCountdown.textContent = countdown;
        
        if (countdown <= 5) {
          skipAdBtn.classList.remove('hidden');
        }
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          playVideo();
        }
      }, 1000);
    });
    
    skipAdBtn.addEventListener('click', function() {
      clearInterval(countdownInterval);
      playVideo();
    });
    
    function playVideo() {
      videoOverlay.classList.add('hidden');
      adOverlay.classList.remove('show');
      videoThumbnail.classList.add('hidden');
      previewVideo.classList.remove('hidden');
      previewVideo.play();
      
      // After 10 seconds, reset to initial state
      setTimeout(() => {
        videoOverlay.classList.remove('hidden');
        videoThumbnail.classList.remove('hidden');
        previewVideo.classList.add('hidden');
        previewVideo.pause();
        previewVideo.currentTime = 0;
        countdown = 10;
        adCountdown.textContent = countdown;
        skipAdBtn.classList.add('hidden');
      }, 10000);
    }
  </script>
  <script async src="https://js.wpadmngr.com/static/adManager.js" data-admpid="348555"></script>
<script async src="https://js.wpadmngr.com/static/adManager.js" data-admpid="348551"></script>
<script async src="https://js.onclckmn.com/static/onclicka.js" data-admpid="348557"></script>

</body>
</html> `);
});

app.listen(PORT, () => {
  console.log(`🌐 Express server running at http://localhost:${PORT}`);
});

