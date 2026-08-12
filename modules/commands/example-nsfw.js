/**
 * Example NSFW Command
 * This is a demonstration command showing how NSFW category works
 * This command will only work when NSFW is enabled in the thread
 */

module.exports = {
  config: {
    name: 'example-nsfw',
    aliases: ['nsfw-test', 'adult-test'],
    version: '1.0.0',
    description: 'Example NSFW command for demonstration (requires NSFW to be enabled)',
    usage: '{prefix}example-nsfw',
    credit: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
    hasPrefix: true,
    permission: 'PUBLIC',
    cooldown: 5,
    category: 'NSFW'
  },

  /**
   * Command execution
   * @param {Object} options - Command options
   * @param {Object} options.api - Facebook API instance
   * @param {Object} options.message - Message object
   * @param {Array<string>} options.args - Command arguments
   */
  run: async function({ api, message, args }) {
    const { threadID, messageID, senderID } = message;
    
    try {
      // This command will only execute if NSFW is enabled in the thread
      // The NSFW check is handled by the command handler before this runs
      
      return api.sendMessage(
        `🔞 **NSFW Command Test**\n\n` +
        `✅ NSFW is enabled in this thread!\n` +
        `This is an example command that demonstrates the NSFW category feature.\n\n` +
        `🔧 **How it works:**\n` +
        `- Commands with category: 'NSFW' require NSFW to be enabled\n` +
        `- Admins can enable NSFW with: /nsfw on\n` +
        `- Admins can disable NSFW with: /nsfw off\n` +
        `- When NSFW is disabled, these commands are blocked\n\n` +
        `🎯 **Usage Examples:**\n` +
        `- /nsfw on - Enable NSFW in current thread\n` +
        `- /nsfw 1234567890 on - Enable NSFW in specific thread\n` +
        `- /nsfw off - Disable NSFW in current thread\n\n` +
        `⚠️ **Note:** Only bot admins can control NSFW settings.`,
        threadID,
        messageID
      );
      
    } catch (error) {
      global.logger.error('Error in example-nsfw command:', error.message);
      return api.sendMessage('❌ An error occurred while processing the command.', threadID, messageID);
    }
  }
};
