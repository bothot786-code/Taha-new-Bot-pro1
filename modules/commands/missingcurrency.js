/**
 * Missing Currency Command
 * Admin command to list users with missing currency records
 */

module.exports = {
  config: {
    name: 'missingcurrency',
    aliases: ['missingmoney', 'checkdb'],
    description: 'List users with missing currency records',
    usage: '{prefix}missingcurrency',
    credit: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
    category: 'ECONOMY',
    hasPrefix: true,
    permission: 'ADMIN', // Only admins can use this command
    cooldown: 30
  },
  
  /**
   * Command execution
   * @param {Object} options - Options object
   * @param {Object} options.api - Facebook API instance
   * @param {Object} options.message - Message object
   * @param {Array<string>} options.args - Command arguments
   */
  run: async function({ api, message, args }) {
    const { threadID, messageID, senderID } = message;
    
    try {
      // Check if user has permission
      if (!global.config.adminIDs.includes(senderID) && senderID !== global.config.ownerID) {
        return api.sendMessage('❌ You do not have permission to use this command.', threadID, messageID);
      }
      
      // Send initial message
      api.sendMessage('🔄 Checking for missing currency records...', threadID, messageID);
      
      // Get all users
      const users = await global.User.find({});
      
      if (!users || users.length === 0) {
        return api.sendMessage('❌ No users found in the database.', threadID);
      }
      
      // Get all currency records
      const currencies = await global.Currency.find({});
      
      // Create a set of user IDs with currency records
      const currencyUserIds = new Set(currencies.map(c => c.userID));
      
      // Find users without currency records
      const missingUsers = users.filter(user => !currencyUserIds.has(user.userID));
      
      if (missingUsers.length === 0) {
        return api.sendMessage(
          '✅ All users have currency records! Database is in good condition.\n\n' +
          `👥 Total users: ${users.length}\n` +
          `💰 Currency records: ${currencies.length}`,
          threadID
        );
      }
      
      // Format list of users with missing records
      let response = `⚠️ 𝗠𝗜𝗦𝗦𝗜𝗡𝗚 𝗖𝗨𝗥𝗥𝗘𝗡𝗖𝗬 𝗥𝗘𝗖𝗢𝗥𝗗𝗦 ⚠️\n\n`;
      response += `Found ${missingUsers.length} users without currency records:\n\n`;
      
      // List first 10 users with missing records
      const maxUsers = Math.min(missingUsers.length, 10);
      for (let i = 0; i < maxUsers; i++) {
        const user = missingUsers[i];
        response += `${i+1}. ${user.name} (${user.userID})\n`;
      }
      
      // Add note if there are more users
      if (missingUsers.length > maxUsers) {
        response += `\n...and ${missingUsers.length - maxUsers} more users\n`;
      }
      
      // Add instructions to fix
      response += `\n📊 Database Stats:\n`;
      response += `- Total users: ${users.length}\n`;
      response += `- Currency records: ${currencies.length}\n`;
      response += `- Missing records: ${missingUsers.length}\n\n`;
      response += `Use ${global.config.prefix}fixcurrency to fix all missing records.`;
      
      // Send response
      return api.sendMessage(response, threadID);
      
    } catch (error) {
      global.logger.error('Error in missingcurrency command:', error.message);
      return api.sendMessage('❌ An error occurred while checking for missing currency records.', threadID, messageID);
    }
  }
};