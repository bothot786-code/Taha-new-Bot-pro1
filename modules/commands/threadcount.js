/**
 * Thread Count Checker
 * Shows database stats and attempts to get Facebook thread count
 * Gracefully handles rate limits by showing database-only stats
 */

module.exports = {
  config: {
    name: "threadcount",
    version: "2.3.0",
    permission: 'ADMIN',
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "Check thread count (database + Facebook if available)",
    hasPrefix: true,
    category: "ADMIN",
    usages: "threadcount",
    cooldowns: 10
  },

  run: async function ({ api, message }) {
    const { threadID, messageID } = message;

    // Check if user is admin or owner
    if (!global.config.adminIDs.includes(message.senderID) && global.config.ownerID !== message.senderID) {
      return api.sendMessage("❌ You don't have permission to use this command.", threadID, messageID);
    }

    const startMessage = await api.sendMessage("🔍 Fetching thread statistics...", threadID, messageID);

    try {
      // Step 1: Get database stats (always works)
      const dbThreadCount = await global.Thread.countDocuments();
      const dbUserCount = await global.User.countDocuments();
      const dbCurrencyCount = await global.Currency.countDocuments();

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeThreads = await global.Thread.countDocuments({
        lastActive: { $gte: sevenDaysAgo }
      });

      const largestThreads = await global.Thread.find()
        .sort({ 'users.length': -1 })
        .limit(5)
        .select('threadID threadName users');

      try {
        await api.editMessage(`📊 Database: ${dbThreadCount} threads\n🔍 Attempting Facebook fetch (wait 5s)...`, startMessage.messageID, threadID);
      } catch (e) { }

      // Step 2: Wait 5 seconds before Facebook API to avoid rate limit
      await new Promise(r => setTimeout(r, 5000));

      // Step 3: Try to get Facebook threads
      let facebookThreads = [];
      let pageCount = 0;
      let fbSuccess = false;
      let fbError = null;

      try {
        // First page only to test if API works
        const testThreads = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
          api.getThreadList(50, null, ['INBOX'], (err, threads) => {
            clearTimeout(timeout);
            if (err) return reject(err);
            resolve(threads || []);
          });
        });

        if (testThreads && testThreads.length > 0) {
          fbSuccess = true;
          facebookThreads.push(...testThreads);
          pageCount = 1;

          // If first page worked, try more pages
          let timestamp = testThreads[testThreads.length - 1]?.timestamp;
          if (typeof timestamp === 'string') timestamp = parseInt(timestamp, 10);

          // Fetch more pages if available
          while (pageCount < 50 && testThreads.length === 50) {
            await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));

            try {
              const moreThreads = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
                api.getThreadList(50, timestamp, ['INBOX'], (err, threads) => {
                  clearTimeout(timeout);
                  if (err) return reject(err);
                  resolve(threads || []);
                });
              });

              if (!moreThreads || moreThreads.length === 0) break;
              facebookThreads.push(...moreThreads);
              pageCount++;

              const lastThread = moreThreads[moreThreads.length - 1];
              if (lastThread?.timestamp) {
                timestamp = typeof lastThread.timestamp === 'string'
                  ? parseInt(lastThread.timestamp, 10)
                  : lastThread.timestamp;
              } else {
                break;
              }

              if (moreThreads.length < 50) break;
            } catch (e) {
              break; // Stop on any error
            }
          }
        }
      } catch (error) {
        fbError = error?.message || String(error);
        console.log(`[threadcount] Facebook API error: ${fbError}`);
      }

      // Remove duplicates
      const uniqueFBThreads = [...new Map(facebookThreads.map(t => [t.threadID, t])).values()];
      const groupThreads = uniqueFBThreads.filter(t => t.isGroup !== false && t.threadType !== 1);
      const dmThreads = uniqueFBThreads.filter(t => t.threadType === 1);

      // Build report
      const topGroups = largestThreads.map((t, i) =>
        `  ${i + 1}. ${t.threadName?.substring(0, 25) || 'Unknown'}... (${t.users?.length || 0} users)`
      ).join('\n');

      const fbSection = fbSuccess
        ? `📱 FACEBOOK (Live API)
├─ Pages Fetched: ${pageCount}
├─ Total Threads: ${uniqueFBThreads.length}
├─ Groups: ${groupThreads.length}
└─ DMs: ${dmThreads.length}`
        : `📱 FACEBOOK (API Unavailable)
└─ ⚠️ Rate limited - try later`;

      const resultMessage =
        `╔═══════════════════════════════════╗
║  📊 THREAD COUNT REPORT           ║
╠═══════════════════════════════════╣

🗃️ DATABASE (Reliable)
├─ Threads: ${dbThreadCount}
├─ Users: ${dbUserCount}
├─ Currency Records: ${dbCurrencyCount}
└─ Active (7 days): ${activeThreads}

${fbSection}

🏆 TOP 5 LARGEST GROUPS (DB)
${topGroups || '  No groups in database'}

${fbSuccess && groupThreads.length > dbThreadCount
          ? `⚠️ Missing ~${groupThreads.length - dbThreadCount} threads! Use /syncthreads`
          : '✅ Database is your source of truth'}

╚═══════════════════════════════════╝`;

      await api.sendMessage(resultMessage, threadID);

    } catch (error) {
      await api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
      global.logger.error('Thread count error:', error);
    }
  }
};
