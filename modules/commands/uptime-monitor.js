/**
 * Uptime Monitor Command
 * Shows information about the bot's uptime monitoring system
 */

module.exports = {
  config: {
    name: "uptime-monitor",
    aliases: ["monitor", "uptimemonitor"],
    description: "Displays information about the bot's uptime monitoring system",
    usages: "{prefix}uptime-monitor",
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
  run: async function ({ api, message, args }) {
    const threadID = message.threadID;
    const messageID = message.messageID;

    // Check if server is enabled
    if (!global.config.server || global.config.server.enabled === false) {
      return api.sendMessage("❌ The web server and uptime monitoring are currently disabled in the bot configuration.", threadID, messageID);
    }

    // Check if uptime monitoring is enabled
    const isMonitoringEnabled = global.config.server?.autoUptimeMonitoring !== false;

    // Check if running on Render
    const isOnRender = !!process.env.RENDER_EXTERNAL_URL;
    const renderUrl = process.env.RENDER_EXTERNAL_URL;

    // Create message
    let uptimeMessage = "⏱️ **Bot Uptime Monitoring**\n\n";

    // Current status
    uptimeMessage += "📊 **Current Status**\n";

    if (isOnRender) {
      uptimeMessage += `✅ Bot is running on Render.com\n`;
      uptimeMessage += `🔗 Render URL: ${renderUrl}\n`;
      uptimeMessage += `⏱️ Uptime monitoring: ${isMonitoringEnabled ? 'Active' : 'Disabled'}\n\n`;
    } else {
      uptimeMessage += `💻 Bot is running locally\n`;
      uptimeMessage += `⏱️ Uptime monitoring: ${isMonitoringEnabled ? 'Configured (will activate on Render)' : 'Disabled'}\n\n`;
    }

    // How it works
    uptimeMessage += "💡 **How Uptime Monitoring Works**\n";
    uptimeMessage += "1. The bot runs a web server that responds to HTTP requests\n";
    uptimeMessage += "2. When deployed on Render.com, the bot automatically sets up monitoring\n";
    uptimeMessage += "3. Every 5 minutes, the bot sends a ping request to itself\n";
    uptimeMessage += "4. This prevents Render.com from putting the service to sleep\n";
    uptimeMessage += "5. As a result, the bot stays online 24/7 even when inactive\n\n";

    // Configuration
    uptimeMessage += "⚙️ **Configuration**\n";
    uptimeMessage += `- Server enabled: ${global.config.server?.enabled !== false ? 'Yes' : 'No'}\n`;
    uptimeMessage += `- Server port: ${global.config.server?.port || 4000}\n`;
    uptimeMessage += `- Auto uptime monitoring: ${isMonitoringEnabled ? 'Enabled' : 'Disabled'}\n\n`;

    // Technical details
    uptimeMessage += "🔧 **Technical Details**\n";
    uptimeMessage += "- The monitoring system uses axios for HTTP requests\n";
    uptimeMessage += "- Ping interval: 5 minutes (300,000 ms)\n";
    uptimeMessage += "- The system logs each ping attempt for debugging\n";
    uptimeMessage += "- If a ping fails, an error is logged but the bot continues running\n\n";

    // Tips
    uptimeMessage += "💡 **Tips**\n";
    uptimeMessage += "- You can disable uptime monitoring in config.json if needed\n";
    uptimeMessage += "- The web server also provides a status page at the root URL\n";
    uptimeMessage += "- You can check the bot's current uptime with the /uptime command\n";
    uptimeMessage += "- For more server information, use the /server command\n";

    // Send message
    return api.sendMessage(uptimeMessage, threadID, messageID);
  }
};