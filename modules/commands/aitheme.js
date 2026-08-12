const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
    config: {
        name: "aitheme",
        aliases: ["generatetheme", "ai_theme"],
        description: "Generates an AI theme for this chat based on a prompt.",
        usage: "{prefix}aitheme <prompt>",
        credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
        hasPrefix: true,
        permission: "PUBLIC",
        cooldown: 15,
        category: "GROUP"
    },

    run: async function ({ api, message, args }) {
        const { threadID, messageID, senderID } = message;

        // Check if group chat
        try {
            const threadInfo = await new Promise((resolve, reject) => {
                api.getThreadInfo(threadID, (err, info) => {
                    if (err) return reject(err);
                    resolve(info);
                });
            });
            if (!threadInfo.isGroup) {
                return api.sendMessage("❌ This command can only be used in group chats.", threadID, messageID);
            }
        } catch (err) {
            console.error(err);
        }

        // Check if the user specified a custom number of themes (max 8)
        let numThemes = 3;
        let promptStartIdx = 0;

        if (args.length > 1 && !isNaN(args[0])) {
            const parsedNum = parseInt(args[0]);
            if (parsedNum > 8) {
                return api.sendMessage("❌ Maximum limit exceeded. You can only generate up to 8 themes at once.", threadID, messageID);
            }
            if (parsedNum >= 1 && parsedNum <= 8) {
                numThemes = parsedNum;
                promptStartIdx = 1;
            }
        }

        const prompt = args.slice(promptStartIdx).join(" ");
        if (!prompt) {
            return api.sendMessage("❌ Please provide a prompt to generate a theme. Example: /aitheme 5 Cyberpunk city neon", threadID, messageID);
        }

        try {
            api.sendMessage(`⏳ Generating ${numThemes} AI themes, this might take a moment...`, threadID, messageID);
            // Using Promise-based call since generateAiTheme handles both
            const themes = await api.generateAiTheme(prompt, numThemes);

            if (!themes || themes.length === 0) {
                return api.sendMessage("❌ Failed to generate themes. No themes returned.", threadID, messageID);
            }

            const tempDir = path.join(__dirname, "temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            let msg = `🎨 Generated ${themes.length} AI Themes for: "${prompt}"\n\n`;
            const attachments = [];
            const imagePaths = [];

            for (let i = 0; i < themes.length; i++) {
                const theme = themes[i];
                const imgUrl = theme.preview_image_urls?.light_mode || theme.preview_image_urls?.dark_mode;

                if (imgUrl) {
                    const imgPath = path.join(tempDir, `aitheme_${Date.now()}_${i}.jpg`);
                    try {
                        const imgData = await axios.get(imgUrl, { responseType: "arraybuffer" });
                        fs.writeFileSync(imgPath, imgData.data);
                        attachments.push(fs.createReadStream(imgPath));
                        imagePaths.push(imgPath);
                        msg += `${i + 1}. Theme Option ${i + 1}\n`;
                    } catch (e) {
                        console.error("Failed to download theme image:", e);
                    }
                }
            }

            if (attachments.length === 0) {
                return api.sendMessage("❌ Could not load preview images for the generated themes.", threadID, messageID);
            }

            msg += `\n👉 Reply with the number (e.g., 1 to ${themes.length}) to set it as the chat theme!`;

            api.sendMessage({
                body: msg,
                attachment: attachments
            }, threadID, (err, info) => {
                if (err) {
                    console.error("Failed to send AI themes message:", err);
                    return;
                }

                // Save reply metadata
                global.client.replies.set(threadID, [
                    ...(global.client.replies.get(threadID) || []),
                    {
                        command: this.config.name,
                        messageID: info.messageID,
                        expectedSender: senderID,
                        data: {
                            themes,
                            prompt,
                            messageIDToDelete: info.messageID,
                            imagePaths
                        }
                    }
                ]);
            }, messageID);

        } catch (err) {
            console.error("AI Theme generation failed:", err);
            api.sendMessage("❌ Error while generating AI themes: " + (err.message || JSON.stringify(err)), threadID, messageID);
        }
    },

    handleReply: async function ({ api, message, replyData }) {
        const { threadID, messageID, body, senderID } = message;

        // Check if the reply is a valid number
        const index = parseInt(body.trim());

        if (isNaN(index) || index < 1 || index > replyData.themes.length) {
            return api.sendMessage(`❌ Please reply with a valid number between 1 and ${replyData.themes.length}.`, threadID, messageID);
        }

        const selectedTheme = replyData.themes[index - 1];
        const themeId = selectedTheme.id || selectedTheme.theme_id;

        if (!themeId) {
            return api.sendMessage("❌ Selected theme does not have a valid ID.", threadID, messageID);
        }

        try {
            api.sendMessage(`⏳ Applying Theme Option ${index}...`, threadID, async (err, info) => {
                if (err) return;

                try {
                    // Set the theme
                    await new Promise((resolve, reject) => {
                        api.changeThreadTheme(themeId, threadID, (setErr, data) => {
                            if (setErr) return reject(setErr);
                            resolve(data);
                        });
                    });

                    // Unsend generating message
                    api.unsendMessage(info.messageID);

                    // Cleanup message
                    api.sendMessage(`✅ AI Theme applied successfully!`, threadID);

                } catch (setThemeErr) {
                    console.error("Failed to set theme:", setThemeErr);
                    api.unsendMessage(info.messageID);
                    api.sendMessage("❌ Failed to apply the theme: " + (setThemeErr.error || setThemeErr.message || "Unknown error"), threadID);
                }
            });

        } catch (e) {
            console.error("Error in reply handler:", e);
        } finally {
            // Clean up images
            if (replyData.imagePaths && Array.isArray(replyData.imagePaths)) {
                for (const file of replyData.imagePaths) {
                    try {
                        if (fs.existsSync(file)) fs.unlinkSync(file);
                    } catch (e) {
                        console.warn("Failed to delete temp theme image:", file);
                    }
                }
            }

            // Optionally delete the original bot message
            if (replyData.messageIDToDelete) {
                api.unsendMessage(replyData.messageIDToDelete).catch(e => console.error(e));
            }
        }
    }
};
