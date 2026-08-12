/**
 * CreatePoll Command
 * Create a poll in the current group/thread with title and optional options
 */

module.exports = {
  config: {
    name: 'createpoll',
    aliases: ['poll', 'newpoll'],
    description: 'Create a poll in the current group with title and optional options',
    usage: '{prefix}createpoll <title> [option1,option2,...]',
    credit: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
    hasPrefix: true,
    permission: 'PUBLIC',
    cooldown: 5,
    category: 'UTILITY'
  },

  /**
   * Command execution
   * @param {Object} options - Options object
   * @param {Object} options.api - Facebook API instance
   * @param {Object} options.message - Message object
   * @param {Array<string>} options.args - Command arguments
   */
  run: async function({ api, message, args }) {
    const { threadID, messageID } = message;

    // Validate arguments
    if (args.length < 1) {
      return api.sendMessage(
        '❌ Please provide a poll title.\nUsage: {prefix}createpoll <title> [option1,option2,...]',
        threadID, messageID
      );
    }

    // Check if this is a group chat
    try {
      const threadInfo = await new Promise((resolve, reject) => {
        api.getThreadInfo(threadID, (err, info) => {
          if (err) return reject(err);
          resolve(info);
        });
      });

      if (!threadInfo.isGroup) {
        return api.sendMessage('❌ Polls can only be created in group chats.', threadID, messageID);
      }
    } catch (error) {
      global.logger.error('Error getting thread info for poll:', error);
      return api.sendMessage('❌ Failed to check thread information.', threadID, messageID);
    }

    // Extract poll title and options
    let pollTitle = '';
    let pollOptions = {};
    
    // Check if there are options provided
    const lastArg = args[args.length - 1];
    if (lastArg.includes(',')) {
      // Options are provided in the last argument
      const options = lastArg.split(',').map(opt => opt.trim());
      
      // Title is everything except the last argument
      pollTitle = args.slice(0, -1).join(' ');
      
      // Create options object (all initially unselected)
      options.forEach(option => {
        if (option) {
          pollOptions[option] = false;
        }
      });
    } else {
      // No options provided, just title
      pollTitle = args.join(' ');
    }

    // Validate poll title
    if (!pollTitle.trim()) {
      return api.sendMessage('❌ Poll title cannot be empty.', threadID, messageID);
    }

    try {
      // Send loading message
      const loadingMsg = await api.sendMessage(`🔄 Creating poll "${pollTitle}"...`, threadID);

      // Create the poll
      api.createPoll(pollTitle, threadID, pollOptions, (err) => {
        if (err) {
          console.error('Error creating poll:', err);
          return api.editMessage(
            '❌ Failed to create the poll. This might be because:\n' +
            '• Polls are temporarily disabled by Facebook\n' +
            '• The group doesn\'t support polls\n' +
            '• There was a network error',
            loadingMsg.messageID
          );
        }
        
        // Success message
        let successMessage = `✅ Poll "${pollTitle}" created successfully! 📊`;
        
        if (Object.keys(pollOptions).length > 0) {
          successMessage += `\n\n📋 Options:\n${Object.keys(pollOptions).map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`;
        }
        
        api.editMessage(successMessage, loadingMsg.messageID);
      });

    } catch (error) {
      console.error('Error in createpoll command:', error);
      return api.sendMessage('❌ An error occurred while creating the poll.', threadID, messageID);
    }
  }
};
