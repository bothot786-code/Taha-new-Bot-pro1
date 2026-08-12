/**
 * WebUI Command
 * Shows information about the bot's web interface
 */

module.exports = {
  config: {
    name: "webui",
    aliases: ["web", "ui", "interface"],
    description: "Displays information about the bot's web interface and how to access it",
    usages: "{prefix}webui",
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
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
    
    // Check if server is enabled
    if (!global.config.server || global.config.server.enabled === false) {
      return api.sendMessage("❌ The web interface is currently disabled in the bot configuration.", threadID, messageID);
    }
    
    // Get server URL
    const serverUrl = global.config.serverUrl || `http://localhost:${global.config.server.port || 4000}`;
    const renderUrl = process.env.RENDER_EXTERNAL_URL;
    
    // Create message
    let webUIMessage = "🌐 **Bot Web Interface**\n\n";
    
    // Add URL information
    webUIMessage += "📊 **Access URLs**\n";
    webUIMessage += `🔗 Preview URL: ${serverUrl}\n`;
    
    if (renderUrl) {
      webUIMessage += `🚀 Render URL: ${renderUrl}\n\n`;
    } else {
      webUIMessage += `\n`;
    }
    
    // Add features information
    webUIMessage += "✨ **Features**\n";
    webUIMessage += "- Real-time bot statistics\n";
    webUIMessage += "- Uptime monitoring\n";
    webUIMessage += "- Command and event counts\n";
    webUIMessage += "- Status indicators\n\n";
    
    // Add technical information
    webUIMessage += "⚙️ **Technical Information**\n";
    webUIMessage += `- Server port: ${global.config.server?.port || 4000}\n`;
    webUIMessage += `- Auto uptime monitoring: ${(global.config.server?.autoUptimeMonitoring === false) ? 'Disabled' : 'Enabled'}\n`;
    
    // Add hosting information if on Render
    if (renderUrl) {
      webUIMessage += `\n🚀 **Render.com Hosting**\n`;
      webUIMessage += "- The web interface is automatically deployed on Render.com\n";
      webUIMessage += "- Uptime monitoring keeps the bot online 24/7\n";
      webUIMessage += "- The server automatically pings itself every 5 minutes\n";
      webUIMessage += "- This prevents Render.com from putting the service to sleep\n\n";
    } else {
      webUIMessage += `\n💻 **Local Hosting**\n`;
      webUIMessage += "- The web interface is currently running locally\n";
      webUIMessage += "- It can only be accessed from your local network\n";
      webUIMessage += "- To make it publicly accessible, deploy the bot to Render.com\n\n";
    }
    
    webUIMessage += "💡 For more information about hosting, use the /hosting command.";
    
    // Send message
    return api.sendMessage(webUIMessage, threadID, messageID);
  }
};