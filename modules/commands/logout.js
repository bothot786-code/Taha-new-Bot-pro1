/**
 * Command: logout
 * Description: Logs out the bot from Facebook using FCA api.logout
 * Usage: {prefix}logout
 * Permissions: ADMIN
 */

module.exports = {
  config: {
    name: 'logout',
    aliases: ['signout'],
    version: '1.0.1',
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: 'Logs out the bot from Facebook session',
    usage: '{prefix}logout',
    category: 'ADMIN',
    cooldown: 10,
    permission: 'ADMIN'
  },

  run: async function ({ api, message, args }) {
    const { threadID, messageID, senderID } = message;

    console.log(`[LOGOUT] Command called by user: ${senderID}`);

    // Check if user has permission
    const hasPermission = await global.permissions.checkPermission(senderID, this.config.permission);
    console.log(`[LOGOUT] Permission check result: ${hasPermission}`);

    if (!hasPermission) {
      console.log(`[LOGOUT] Permission denied for user ${senderID}`);
      return api.sendMessage(
        '❌ You do not have permission to use this command. Only administrators can log out the bot.',
        threadID,
        messageID
      );
    }

    try {
      // React with loading indicator
      api.setMessageReaction("⏳", messageID, () => { }, true);

      // Send status message
      await api.sendMessage('🔄 Logging out from current Facebook session...', threadID, messageID);

      // Perform Facebook logout
      api.logout((err) => {
        if (err) {
          console.error('[LOGOUT] Facebook API logout error:', err);
          api.setMessageReaction("❌", messageID, () => { }, true);
          return api.sendMessage(`❌ Logout failed: ${err.message || err}`, threadID, messageID);
        }

        console.log('[LOGOUT] Facebook logout successful.');
        api.setMessageReaction("✅", messageID, () => { }, true);
        return api.sendMessage('✅ Logged out successfully. Auto-login system will handle session regeneration.', threadID, messageID);
      });

    } catch (error) {
      console.error(`[LOGOUT] Exception during logout command:`, error);
      api.setMessageReaction("❌", messageID, () => { }, true);
      return api.sendMessage(`❌ An error occurred during logout: ${error.message}`, threadID, messageID);
    }
  }
};
