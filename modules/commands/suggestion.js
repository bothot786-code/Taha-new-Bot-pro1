/**
 * Command Suggestion System
 * Detects mistyped commands and suggests the closest match.
 */

// Simple Levenshtein distance algorithm for string similarity
function getLevenshteinDistance(s1, s2) {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return matrix[len1][len2];
}

module.exports = {
    config: {
        name: 'suggestion',
        description: 'Provides suggestions for mistyped commands',
        usage: '',
        credit: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
        hasPrefix: true, // Only trigger if a prefix is used
        category: 'SYSTEM',
        permission: 'PUBLIC',
        cooldown: 0,
        category: 'SYSTEM'
    },

    run: async function ({ api, message }) {
        // This command doesn't need to be run manually
        return api.sendMessage("This system works automatically when you mistype a command!", message.threadID, message.messageID);
    },

    handleEvent: async function ({ api, message }) {
        const { body, threadID, messageID, senderID } = message;
        if (!body || senderID === api.getCurrentUserID()) return;

        const prefix = global.config.prefix;
        if (!body.startsWith(prefix)) return;

        // Extract the command name
        const args = body.slice(prefix.length).trim().split(/ +/);
        const inputCommand = args.shift().toLowerCase();
        if (!inputCommand) return;

        // Check if it's already a valid command or alias
        // All commands and aliases are stored in global.client.commands keys
        if (global.client.commands.has(inputCommand)) {
            return;
        }

        // Collect all possible commands and aliases from the keys
        const allCommands = Array.from(global.client.commands.keys());

        let bestMatch = null;
        let minDistance = 3; // Max distance allowed to consider it a "match"

        for (const cmd of allCommands) {
            const distance = getLevenshteinDistance(inputCommand, cmd);

            // Heuristic: for very short commands, distance must be 1. 
            // For longer ones, 2 or 3 is fine.
            const threshold = inputCommand.length <= 3 ? 1 : (inputCommand.length <= 6 ? 2 : 3);

            if (distance <= threshold && distance < minDistance) {
                minDistance = distance;
                bestMatch = cmd;
            }
        }

        if (bestMatch) {
            return api.sendMessage(`⚠️ Unknown command: "${prefix}${inputCommand}"\n💡 Did you mean: "${prefix}${bestMatch}"?`, threadID, messageID);
        }
    }
};
