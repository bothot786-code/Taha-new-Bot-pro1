/**
 * Render Deploy Command
 * Shows instructions for deploying the bot to Render.com
 */

module.exports = {
  config: {
    name: "render-deploy",
    aliases: ["deploy", "renderdeploy", "deployrender"],
    description: "Displays detailed instructions for deploying the bot to Render.com",
    usages: "{prefix}render-deploy",
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
    let deployMessage = "🚀 **Deploying to Render.com**\n\n";
    
    // Current status
    if (isOnRender) {
      deployMessage += "✅ **Current Status: Deployed on Render.com**\n";
      deployMessage += `🔗 URL: ${process.env.RENDER_EXTERNAL_URL}\n\n`;
    } else {
      deployMessage += "💻 **Current Status: Running Locally**\n\n";
    }
    
    // Deployment steps
    deployMessage += "📝 **Deployment Steps**\n";
    deployMessage += "1. Create a GitHub repository for your bot\n";
    deployMessage += "2. Push your code to the repository (exclude appstate.json in .gitignore)\n";
    deployMessage += "3. Create a Render.com account at https://render.com\n";
    deployMessage += "4. In Render dashboard, click 'New +' and select 'Web Service'\n";
    deployMessage += "5. Connect your GitHub repository\n";
    deployMessage += "6. Configure the service:\n";
    deployMessage += "   - Name: Your bot name\n";
    deployMessage += "   - Environment: Node\n";
    deployMessage += "   - Build Command: npm install\n";
    deployMessage += "   - Start Command: npm run render-start\n";
    deployMessage += "7. Add environment variables (if needed)\n";
    deployMessage += "8. Click 'Create Web Service'\n\n";
    
    // Configuration files
    deployMessage += "⚙️ **Configuration Files**\n";
    deployMessage += "1. **render.yaml** - Defines the Render.com service\n";
    deployMessage += "   - Already included in your bot\n";
    deployMessage += "   - Configures the service type, build command, etc.\n\n";
    
    deployMessage += "2. **start-render.js** - Special startup script for Render\n";
    deployMessage += "   - Already included in your bot\n";
    deployMessage += "   - Handles proper startup on Render.com\n";
    deployMessage += "   - Creates necessary directories\n";
    deployMessage += "   - Manages process signals\n\n";
    
    deployMessage += "3. **package.json** - Contains the render-start script\n";
    deployMessage += "   - Already configured with: \"render-start\": \"node start-render.js\"\n\n";
    
    // Important notes
    deployMessage += "⚠️ **Important Notes**\n";
    deployMessage += "- You must manually upload your appstate.json file to Render\n";
    deployMessage += "- Go to Dashboard > Your Service > Shell\n";
    deployMessage += "- Use the command line to create and edit the appstate.json file\n";
    deployMessage += "- The bot will automatically set up uptime monitoring\n";
    deployMessage += "- The web interface will be available at your Render URL\n\n";
    
    deployMessage += "💡 For more information about hosting options, use the /hosting command.";
    
    // Send message
    return api.sendMessage(deployMessage, threadID, messageID);
  }
};