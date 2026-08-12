/**
 * Profile Command
 * Fetches and sends a user's profile picture using priyanshuapi
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const fsp = fs.promises;

module.exports = {
    config: {
        name: 'profile',
        aliases: ['pfp', 'avt', 'pp', 'avatar'],
        description: "Get a user's high-quality profile picture",
        usage: '{prefix}profile [@mention] or {prefix}profile (reply to a message) or {prefix}profile [profile_url]',
        credit: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
        hasPrefix: true,
        permission: 'PUBLIC',
        cooldown: 5,
        category: 'UTILITY'
    },

    run: async function ({ api, message, args }) {
        const { threadID, messageID, senderID, mentions, messageReply } = message;

        try {
            let target = null;

            // 1. Mentions
            if (Object.keys(mentions).length > 0) {
                target = Object.keys(mentions)[0];
            }
            // 2. Reply
            else if (messageReply) {
                target = messageReply.senderID;
            }
            // 3. Arguments (UID or URL)
            else if (args.length > 0) {
                target = args[0];
            }
            // 4. Default to Self
            else {
                target = senderID;
            }

            const apiKey = global.config?.apiKeys?.priyanshuApi;
            const API_ENDPOINT = "https://priyanshuapi.qzz.io/api/runner/fb-stalk/stalk";

            // Prepare payload for priyanshuapi - Handles UID (as userId) or URL (as link)
            const isUrl = String(target).match(/facebook\.com|fb\.com/);
            const payload = isUrl ? { link: String(target) } : { userId: String(target) };

            const response = await axios.post(API_ENDPOINT, payload, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            if (!response.data?.success || !response.data?.data) {
                throw new Error(response.data?.message || 'Failed to fetch user information');
            }

            const userData = response.data.data;
            const profilePicUrl = userData.profilePictureUrl || `https://graph.facebook.com/${userData.userId || target}/picture?height=1500&width=1500`;

            // Download the image
            const imageResponse = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
            const downloadDir = path.join(__dirname, "temp");
            if (!fs.existsSync(downloadDir)) await fsp.mkdir(downloadDir, { recursive: true });

            const fileName = `profile_${userData.userId || target}_${Date.now()}.png`;
            const filePath = path.join(downloadDir, fileName);

            await fsp.writeFile(filePath, Buffer.from(imageResponse.data));

            await api.sendMessage(
                {
                    body: `📸 Profile picture of ${userData.name || 'this user'}:`,
                    attachment: fs.createReadStream(filePath)
                },
                threadID,
                () => {
                    fsp.unlink(filePath).catch(err => console.error('Error deleting profile pic temp file:', err));
                },
                messageID
            );

        } catch (error) {
            global.logger.error('Error in profile command:', error?.message || error);
            return api.sendMessage('❌ An error occurred while fetching the profile picture. Ensure the user exists and your API key is valid.', threadID, messageID);
        }
    }
};
