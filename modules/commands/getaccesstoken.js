/**
 * GetAccessToken Command
 * Retrieve Facebook access token for the current session
 */

module.exports = {
  config: {
    name: 'getaccesstoken',
    aliases: ['accesstoken', 'token'],
    description: 'Get the current Facebook access token',
    usage: '{prefix}getaccesstoken',
    credit: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
    hasPrefix: true,
    permission: 'OWNER',
    cooldown: 10,
    category: 'OWNER'
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
      // Send loading message
      const loadingMsg = await api.sendMessage('🔄 Retrieving access token...', threadID);

      // Get access token using the API
      api.getAccessToken((err, accessToken) => {
        if (err) {
          console.error('Error getting access token:', err);
          return api.editMessage(
            '❌ Failed to retrieve access token.\n\n' +
            'Possible reasons:\n' +
            '• Session has expired\n' +
            '• Network connectivity issues\n' +
            '• Facebook API restrictions\n' +
            '• Authentication problems',
            loadingMsg.messageID
          );
        }

        // Check if access token was retrieved
        if (!accessToken) {
          return api.editMessage(
            '❌ Access token is not available.\n\n' +
            'This might happen if:\n' +
            '• The bot session is not properly initialized\n' +
            '• Facebook has revoked the token\n' +
            '• There are authentication issues',
            loadingMsg.messageID
          );
        }

        // Success - send the access token (partially hidden for security)
        const tokenLength = accessToken.length;
        const visiblePart = tokenLength > 20 
          ? accessToken.substring(0, 10) + '...' + accessToken.substring(tokenLength - 10)
          : accessToken;

        const successMessage = 
          '✅ Access Token Retrieved Successfully!\n\n' +
          `🔑 Token Preview: ${visiblePart}\n` +
          `📏 Length: ${tokenLength} characters\n` +
          `⏰ Retrieved at: ${new Date().toLocaleString()}\n\n` +
          '⚠️ **SECURITY WARNING**:\n' +
          '• Keep this token private\n' +
          '• Do not share with unauthorized users\n' +
          '• Token grants access to Facebook account\n\n' +
          '📋 Full token has been sent to console for security.';

        // Log full token to console for admin use
        console.log('='.repeat(50));
        console.log('🔑 FACEBOOK ACCESS TOKEN');
        console.log('='.repeat(50));
        console.log('Token:', accessToken);
        console.log('Length:', tokenLength);
        console.log('Retrieved by:', senderID);
        console.log('Time:', new Date().toISOString());
        console.log('='.repeat(50));

        api.editMessage(successMessage, loadingMsg.messageID);
      });

    } catch (error) {
      console.error('Error in getaccesstoken command:', error);
      return api.sendMessage(
        '❌ An unexpected error occurred while retrieving the access token.\n\n' +
        'Please check the console for more details.',
        threadID, messageID
      );
    }
  }
};
