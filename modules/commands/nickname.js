/**
 * Nickname Command
 * Allows users to set, view, or remove nicknames in group chats
 */

module.exports = {
  config: {
    name: 'nickname',
    aliases: ['nick'],
    description: 'Manage nicknames in group chats',
    usage: '{prefix}nickname [@mention] [nickname] | {prefix}nickname all [nickname]',
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    category: 'GROUP',
    hasPrefix: true,
    permission: 'PUBLIC',
    cooldown: 5
  },

  /**
   * Command execution
   * @param {Object} options - Options object
   * @param {Object} options.api - Facebook API instance
   * @param {Object} options.message - Message object
   * @param {Array<string>} options.args - Command arguments
   */
  run: async function ({ api, message, args }) {
    const { threadID, senderID, mentions } = message;

    // Check if this is a group chat
    const threadInfo = await global.Thread.findOne({ threadID });
    if (!threadInfo) {
      return global.api.sendMessage("⚠️ Error: Could not retrieve thread information.", threadID, message.messageID);
    }

    // If no arguments, show current nickname
    if (args.length === 0) {
      const userInfo = threadInfo.users.find(user => user.id === senderID);
      if (!userInfo) {
        return global.api.sendMessage("⚠️ Error: Could not find your user information.", threadID, message.messageID);
      }

      const currentNickname = userInfo.nickname;
      if (currentNickname) {
        return global.api.sendMessage(`Your current nickname is: ${currentNickname}`, threadID, message.messageID);
      } else {
        return global.api.sendMessage("You don't have a nickname set in this group.", threadID, message.messageID);
      }
    }

    // Check for "all" subcommand - set nickname for all group members
    if (args[0].toLowerCase() === 'all') {
      // Check if user has permission (only owner/admin can use this)
      const hasPermission = await global.permissions.checkPermission(senderID, 'ADMIN');
      if (!hasPermission) {
        return global.api.sendMessage("⚠️ Only bot owner and admins can use the 'all' subcommand.", threadID, message.messageID);
      }

      const nickname = args.slice(1).join(' ').trim();
      if (!nickname) {
        return global.api.sendMessage("⚠️ Please provide a nickname. Usage: /nickname all [nickname]", threadID, message.messageID);
      }

      // Get all participants from thread info
      const participants = threadInfo.users || [];
      if (participants.length === 0) {
        return global.api.sendMessage("⚠️ No users found in this group.", threadID, message.messageID);
      }

      // Send initial message
      await global.api.sendMessage(`🔄 Setting nickname "${nickname}" for ${participants.length} members...\nThis may take a moment.`, threadID, message.messageID);

      let successCount = 0;
      let failCount = 0;

      // Set nickname for each user with delay to avoid rate limiting
      for (const user of participants) {
        try {
          await new Promise((resolve, reject) => {
            api.changeNickname(nickname, threadID, user.id, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          successCount++;

          // Add delay between requests to avoid rate limiting (500ms)
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          global.logger.error(`Error setting nickname for user ${user.id}: ${error.message}`);
          failCount++;
        }
      }

      // Send completion message
      let resultMessage = `✅ Nickname setting complete!\n`;
      resultMessage += `• Success: ${successCount} users\n`;
      if (failCount > 0) {
        resultMessage += `• Failed: ${failCount} users`;
      }

      return global.api.sendMessage(resultMessage, threadID);
    }

    // If mentions, set nickname for mentioned user
    if (Object.keys(mentions).length > 0) {
      const mentionID = Object.keys(mentions)[0];
      const nickname = args.join(' ').replace(mentions[mentionID], '').trim();

      try {
        // Set nickname using Facebook API
        await global.api.changeNickname(
          nickname,
          threadID,
          mentionID,
          (err) => {
            if (err) {
              global.logger.error(`Error setting nickname: ${err.message}`);
              return global.api.sendMessage("⚠️ Error setting nickname. Please try again later.", threadID, message.messageID);
            }
          }
        );

        if (nickname) {
          return global.api.sendMessage(`✅ Nickname for ${mentions[mentionID].replace('@', '')} has been set to: ${nickname}`, threadID, message.messageID);
        } else {
          return global.api.sendMessage(`✅ Nickname for ${mentions[mentionID].replace('@', '')} has been removed.`, threadID, message.messageID);
        }
      } catch (error) {
        global.logger.error(`Error in nickname command: ${error.message}`);
        return global.api.sendMessage("⚠️ An error occurred while setting the nickname.", threadID, message.messageID);
      }
    } else {
      // If no mentions but has args, set nickname for self
      const nickname = args.join(' ').trim();

      try {
        // Set nickname using Facebook API
        await global.api.changeNickname(
          nickname,
          threadID,
          senderID,
          (err) => {
            if (err) {
              global.logger.error(`Error setting nickname: ${err.message}`);
              return global.api.sendMessage("⚠️ Error setting nickname. Please try again later.", threadID, message.messageID);
            }
          }
        );

        if (nickname) {
          return global.api.sendMessage(`✅ Your nickname has been set to: ${nickname}`, threadID, message.messageID);
        } else {
          return global.api.sendMessage(`✅ Your nickname has been removed.`, threadID, message.messageID);
        }
      } catch (error) {
        global.logger.error(`Error in nickname command: ${error.message}`);
        return global.api.sendMessage("⚠️ An error occurred while setting the nickname.", threadID, message.messageID);
      }
    }
  }
};
