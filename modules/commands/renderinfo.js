/**
 * Renderinfo Command
 * Shows information about Render.com hosting
 */

module.exports = {
  config: {
    name: "renderinfo",
    aliases: ["render", "renderhosting"],
    description: "Displays information about the bot's Render.com hosting and uptime monitoring",
    usages: "{prefix}renderinfo",
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    category: 'GENERAL',
    hasPrefix: true,
    permission: "PUBLIC",
    cooldowns: 5
  },
  
  /**
   * Command execution
   * @param {Object} options - Options object
   * @param {Object} options.api - Facebook API instance
   * @param {Object} options.message - Message object
   * @param {Array<string>} options.args - Command arguments
   */
  run: async function({ api, message, args }) {
    const threadID = message.threadID;
    const messageID = message.messageID;
    
    // Check if running on Render
    const isOnRender = !!process.env.RENDER_EXTERNAL_URL;
    
    // Create message
    let renderInfoMessage = "🚀 **Render.com Hosting Information**\n\n";
    
    if (isOnRender) {
      // Get uptime monitoring status
      const uptimeStatus = (global.config.server && global.config.server.autoUptimeMonitoring === false) 
        ? "Disabled" 
        : "Active (auto-ping every 5 minutes)";
      
      renderInfoMessage += `✅ Bot is currently running on Render.com\n`;
      renderInfoMessage += `🌐 Render URL: ${process.env.RENDER_EXTERNAL_URL}\n`;
      renderInfoMessage += `⏱️ Uptime monitoring: ${uptimeStatus}\n\n`;
      renderInfoMessage += `💡 **How it works:**\n`;
      renderInfoMessage += `- The bot uses an automatic ping system to prevent Render.com from putting the service to sleep\n`;
      renderInfoMessage += `- This ensures the bot stays online 24/7 even when inactive\n`;
      renderInfoMessage += `- The web server provides a preview interface at ${process.env.RENDER_EXTERNAL_URL}\n\n`;
      renderInfoMessage += `📊 You can check the bot's status with the /server command`;
    } else {
      renderInfoMessage += `❌ Bot is not currently running on Render.com\n`;
      renderInfoMessage += `💻 Bot is running in local/development mode\n\n`;
      
      if (global.config.serverUrl) {
        renderInfoMessage += `🌐 Local preview URL: ${global.config.serverUrl}\n\n`;
      }
      
      renderInfoMessage += `📝 To deploy this bot to Render.com:\n`;
      renderInfoMessage += `1. Create a Render.com account\n`;
      renderInfoMessage += `2. Connect your GitHub repository\n`;
      renderInfoMessage += `3. Create a new Web Service\n`;
      renderInfoMessage += `4. Use the render.yaml configuration file\n\n`;
      renderInfoMessage += `📊 You can check the bot's status with the /server command`;
    }
    
    // Send message
    return api.sendMessage(renderInfoMessage, threadID, messageID);
  }
};