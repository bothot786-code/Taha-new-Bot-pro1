/**
 * Manual Thread Sync Command
 * Forces a complete sync of all threads to database
 */

module.exports = {
  config: {
    name: "syncthreads",
    version: "2.2.0",
    permission: 'ADMIN',
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "Manually sync all Facebook threads to database",
    hasPrefix: true,
    category: "ADMIN",
    usages: "syncthreads",
    cooldowns: 30
  },
  run: async function ({ api, message, getText }) {
    const { threadID, messageID } = message;

    // Check if user is admin or owner
    if (!global.config.adminIDs.includes(message.senderID) && global.config.ownerID !== message.senderID) {
      return api.sendMessage("❌ You don't have permission to use this command.", threadID, messageID);
    }

    const startMessage = await api.sendMessage("🔄 Starting manual thread synchronization...\n📊 This may take a few minutes.", threadID, messageID);

    try {
      let syncedThreads = 0;
      let newThreads = 0;
      let errorThreads = 0;

      // Update status
      await api.editMessage("🔍 Discovering threads using pagination...", startMessage.messageID, threadID);

      // Use pagination to get ALL threads
      const allThreads = [];
      let timestamp = null;
      let pageCount = 0;
      const maxPages = 500; // Increased to support very large number of groups (500 pages × 50 threads = 25000 threads max)

      while (pageCount < maxPages) {
        try {
          // Use empty array [] to get ALL threads (not just INBOX)
          const pageThreads = await new Promise((resolve, reject) => {
            api.getThreadList(100, timestamp, [], (err, threads) => {
              if (err) return reject(err);
              resolve(threads || []);
            });
          });

          // Break if no threads returned
          if (!pageThreads || pageThreads.length === 0) {
            console.log(`No more threads found after ${pageCount} pages`);
            break;
          }

          allThreads.push(...pageThreads);
          timestamp = pageThreads[pageThreads.length - 1].timestamp;
          pageCount++;

          // Update progress
          await api.editMessage(`🔍 Discovering threads... Found ${allThreads.length} threads so far (Page ${pageCount})`, startMessage.messageID, threadID);

          // Break if we got less than 50 threads (indicates last page)
          if (pageThreads.length < 50) {
            console.log(`Last page detected (${pageThreads.length} threads)`);
            break;
          }

          // Delay between requests to avoid spam detection (increased to 1.5s for safety)
          await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (pageError) {
          console.error(`Error fetching page ${pageCount + 1}:`, pageError.message);
          // If we encounter an error, break the loop to prevent infinite retries
          break;
        }
      }

      // Remove duplicates
      const uniqueThreads = [];
      const seenThreads = new Set();

      for (const thread of allThreads) {
        if (thread.threadID && !seenThreads.has(thread.threadID)) {
          seenThreads.add(thread.threadID);
          uniqueThreads.push(thread);
        }
      }

      await api.editMessage(`📊 Found ${uniqueThreads.length} unique threads. Starting synchronization...`, startMessage.messageID, threadID);

      // Process each thread
      for (let i = 0; i < uniqueThreads.length; i++) {
        const threadInfo = uniqueThreads[i];
        const progress = Math.round((i / uniqueThreads.length) * 100);

        try {
          // Update progress every 10 threads
          if (i % 10 === 0) {
            await api.editMessage(`🔄 Syncing threads... ${progress}% complete (${i}/${uniqueThreads.length})`, startMessage.messageID, threadID);
          }

          // Check if bot is participant
          const threadDetails = await new Promise((resolve, reject) => {
            api.getThreadInfo(threadInfo.threadID, (err, info) => {
              if (err) resolve(null);
              else resolve(info);
            });
          });

          if (!threadDetails) {
            errorThreads++;
            continue;
          }

          // Check if bot is participant
          const botIsParticipant = threadDetails.participantIDs &&
            threadDetails.participantIDs.includes(global.client.botID);

          if (!botIsParticipant) {
            continue; // Skip threads where bot is not a participant
          }

          // Check if thread exists in database
          const threadExists = await global.Thread.exists({ threadID: threadInfo.threadID });

          if (!threadExists) {
            // Create new thread
            const participants = [];

            for (const participant of threadDetails.userInfo || []) {
              if (participant.id && participant.id !== global.client.botID) {
                // Ensure user exists
                const userExists = await global.User.exists({ userID: participant.id });
                if (!userExists) {
                  await global.User.create({
                    userID: participant.id,
                    name: participant.name || 'Facebook User'
                  });

                  // Create currency record
                  await global.Currency.create({ userID: participant.id });
                }

                participants.push({
                  id: participant.id,
                  name: participant.name || 'Facebook User',
                  nickname: threadDetails.nicknames?.[participant.id] || null,
                  gender: participant.gender || null,
                  vanity: participant.vanity && participant.vanity.trim() !== '' ? participant.vanity : null
                });
              }
            }

            // Create thread using controller
            await global.controllers.thread.createOrUpdateThread(threadInfo.threadID, {
              threadName: threadDetails.threadName || 'Unknown Group',
              users: participants
            });

            newThreads++;
          } else {
            // Update existing thread
            const thread = await global.Thread.findOne({ threadID: threadInfo.threadID });
            thread.lastActive = new Date();
            await thread.save();
          }

          syncedThreads++;

        } catch (threadError) {
          errorThreads++;
          global.logger.error(`Error syncing thread ${threadInfo.threadID}:`, threadError.message);
        }
      }

      // Final results
      const resultMessage = `✅ Thread synchronization complete!\n\n📊 Results:\n` +
        `• Total threads found: ${uniqueThreads.length}\n` +
        `• Successfully synced: ${syncedThreads}\n` +
        `• New threads created: ${newThreads}\n` +
        `• Errors: ${errorThreads}\n\n` +
        `🎯 Your database now contains all accessible groups!`;

      await api.sendMessage(resultMessage, threadID);

    } catch (error) {
      await api.sendMessage(`❌ Thread synchronization failed: ${error.message}`, threadID, messageID);
      global.logger.error('Manual thread sync error:', error);
    }
  }
};
