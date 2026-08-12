/**
 * Gender Override Command
 * Allows admins to manually set gender for users when Facebook's API returns stale data
 */

module.exports = {
    config: {
        name: 'setgender',
        aliases: ['genderfix', 'fixgender', 'genderoverride'],
        description: 'Set gender override for a user (admin only). Use when Facebook API returns wrong gender.',
        usage: '{prefix}setgender @user male/female | {prefix}setgender remove @user',
        credit: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
        hasPrefix: true,
        permission: 'ADMIN',
        cooldown: 3,
        category: 'ADMIN'
    },

    run: async function ({ api, message, args }) {
        const { threadID, messageID, senderID, mentions } = message;

        // Check if user is admin/owner
        const isOwner = senderID === global.config?.ownerID;
        const isAdmin = global.config?.adminIDs?.includes(senderID) || global.config?.supportIDs?.includes(senderID);

        if (!isOwner && !isAdmin) {
            return api.sendMessage("❌ This command is only for bot admins.", threadID, messageID);
        }

        const { setGenderOverride, removeGenderOverride, getGenderOverride, getAllGenderOverrides } = require('../../utils/gender');

        // Show help if no args
        if (args.length === 0) {
            const overrides = getAllGenderOverrides();
            const overrideCount = Object.keys(overrides).length;

            let msg = `📊 **Gender Override System**\n\n`;
            msg += `**Usage:**\n`;
            msg += `• /setgender @user male - Set user as male\n`;
            msg += `• /setgender @user female - Set user as female\n`;
            msg += `• /setgender remove @user - Remove override\n`;
            msg += `• /setgender list - Show all overrides\n\n`;
            msg += `**Current overrides:** ${overrideCount}`;

            return api.sendMessage(msg, threadID, messageID);
        }

        // List all overrides
        if (args[0].toLowerCase() === 'list') {
            const overrides = getAllGenderOverrides();
            const entries = Object.entries(overrides);

            if (entries.length === 0) {
                return api.sendMessage("📋 No gender overrides set.", threadID, messageID);
            }

            let msg = `📋 **Gender Overrides (${entries.length})**\n\n`;
            for (const [uid, gender] of entries) {
                msg += `• ${uid}: ${gender}\n`;
            }

            return api.sendMessage(msg, threadID, messageID);
        }

        // Remove override
        if (args[0].toLowerCase() === 'remove') {
            if (Object.keys(mentions).length === 0) {
                return api.sendMessage("❌ Please mention a user to remove their gender override.", threadID, messageID);
            }

            const targetID = Object.keys(mentions)[0];
            const targetName = mentions[targetID].replace('@', '');

            const removed = removeGenderOverride(targetID);

            if (removed) {
                return api.sendMessage(`✅ Removed gender override for ${targetName} (${targetID})`, threadID, messageID);
            } else {
                return api.sendMessage(`⚠️ No override was set for ${targetName}`, threadID, messageID);
            }
        }

        // Set gender override
        if (Object.keys(mentions).length === 0) {
            return api.sendMessage("❌ Please mention a user to set their gender.\n\nUsage: /setgender @user male/female", threadID, messageID);
        }

        const targetID = Object.keys(mentions)[0];
        const targetName = mentions[targetID].replace('@', '');

        // Find the gender argument (male or female)
        const genderArg = args.find(a =>
            a.toLowerCase() === 'male' ||
            a.toLowerCase() === 'female' ||
            a.toLowerCase() === 'm' ||
            a.toLowerCase() === 'f'
        );

        if (!genderArg) {
            return api.sendMessage(`❌ Please specify gender: male or female\n\nUsage: /setgender @${targetName} male/female`, threadID, messageID);
        }

        // Normalize gender
        let gender = genderArg.toLowerCase();
        if (gender === 'm') gender = 'male';
        if (gender === 'f') gender = 'female';

        const success = setGenderOverride(targetID, gender);

        if (success) {
            const genderEmoji = gender === 'male' ? '👨' : '👩';
            return api.sendMessage(
                `✅ Gender override set!\n\n` +
                `${genderEmoji} User: ${targetName}\n` +
                `🆔 UID: ${targetID}\n` +
                `⚧️ Gender: ${gender.toUpperCase()}\n\n` +
                `ℹ️ This override will be used instead of Facebook's API data.`,
                threadID, messageID
            );
        } else {
            return api.sendMessage("❌ Failed to set gender override.", threadID, messageID);
        }
    }
};
