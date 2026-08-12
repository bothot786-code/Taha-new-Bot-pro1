/**
 * Command: reload
 * Description: Reloads a specific command without restarting the bot
 * Usage: {prefix}reload <command_name>
 * Permissions: ADMIN
 */

module.exports = {
  config: {
    name: 'reload',
    aliases: ['refresh'],
    version: '1.0.0',
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: 'Reloads a specific command without restarting the bot',
    usage: '{prefix}reload <command_name>',
    cooldown: 5,
    permissions: 'ADMIN'
  },
  
  run: async function({ api, message, args }) {
    const { threadID, messageID, senderID } = message;
    
    // Check if user has permission
    const hasPermission = await global.permissions.check(senderID, this.config.permissions);
    if (!hasPermission) {
      return api.sendMessage(
        '❌ You do not have permission to use this command.',
        threadID,
        messageID
      );
    }
    
    // Check if command name is provided
    if (!args[0]) {
      return api.sendMessage(
        `❌ Missing command name to reload\nUsage: ${global.config.prefix}${this.config.usage.replace('{prefix}', '')}\n\nTip: Use '${global.config.prefix}reload all' to reload all commands`,
        threadID,
        messageID
      );
    }
    
    const commandName = args[0].toLowerCase();
    
    try {
      // Set reaction to indicate processing
      api.setMessageReaction("⏳", messageID, () => {}, true);
      
      // Special case for reloading all commands
      if (commandName === 'all') {
        // Attempt to reload all commands
        const success = global.loader.reloadAllCommands();
        
        if (success) {
          api.setMessageReaction("✅", messageID, () => {}, true);
          return api.sendMessage(
            `✅ Successfully reloaded all commands`,
            threadID,
            messageID
          );
        } else {
          api.setMessageReaction("❌", messageID, () => {}, true);
          return api.sendMessage(
            `❌ Failed to reload all commands`,
            threadID,
            messageID
          );
        }
      } else {
        // Attempt to reload a specific command
        const success = global.loader.reloadCommand(commandName);
        
        if (success) {
          api.setMessageReaction("✅", messageID, () => {}, true);
          return api.sendMessage(
            `✅ Successfully reloaded command: ${commandName}`,
            threadID,
            messageID
          );
        } else {
          api.setMessageReaction("❌", messageID, () => {}, true);
          return api.sendMessage(
            `❌ Failed to reload command: ${commandName}\nCommand may not exist or there was an error loading it.`,
            threadID,
            messageID
          );
        }
      }
    } catch (error) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      global.logger.error(`Error in reload command: ${error.message}`);
      return api.sendMessage(
        `❌ Error reloading command: ${error.message}`,
        threadID,
        messageID
      );
    }
  }
};