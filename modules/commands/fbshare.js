/**
 * FB Share Command - Get post preview info
 * @author Priyansh Rajput
 */

module.exports = {
  config: {
    name: 'fbshare',
    aliases: ['postpreview', 'sharepreview'],
    description: 'Get Facebook post preview information',
    usage: '{prefix}fbshare <postID>',
    credit: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
    hasPrefix: true,
    permission: 'ADMIN',
    cooldown: 5,
    category: 'SOCIAL'
  },
  
  run: async function({ api, message, args }) {
    const { threadID, messageID } = message;
    
    if (!api.share) {
      return api.sendMessage('❌ Share API not available.', threadID, messageID);
    }
    
    if (args.length === 0) {
      return api.sendMessage(
        '📋 Usage: /fbshare <postID>\n\n' +
        'Get preview info for any Facebook post.',
        threadID, messageID
      );
    }
    
    const postID = args[0];
    
    api.sendTypingIndicator(threadID);
    
    api.sendMessage('⏳ Generating preview...', threadID, (err, info) => {
      if (err) return;
      
      api.sendTypingIndicator(threadID);
      
      api.share(postID, (err, preview) => {
        if (err) {
          return api.editMessage('❌ Failed to get preview. Check post ID.', info.messageID);
        }
        
        api.editMessage(
          `✅ Post Preview\n\n` +
          `📝 Title: ${preview.title || 'N/A'}\n` +
          `📌 Header: ${preview.header || 'N/A'}\n` +
          `💬 Subtitle: ${preview.subtitle || 'N/A'}\n` +
          `🖼️ Image: ${preview.previewImage ? 'Yes' : 'No'}\n` +
          `🆔 Post ID: ${preview.postID}`,
          info.messageID
        );
      });
    });
  }
};
