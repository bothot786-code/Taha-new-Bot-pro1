const axios = require('axios');

module.exports = {
    config: {
        name: "npm",
        aliases: ["package", "npminfo", "pkg"],
        description: "Get information about an NPM package",
        usage: "{prefix}npm <package-name>\n\nExamples:\n{prefix}npm express\n{prefix}npm axios\n{prefix}npm react",
        credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
        hasPrefix: true,
        permission: 'PUBLIC',
        cooldown: 5,
        category: 'UTILITY'
    },

    run: async function ({ api, message, args }) {
        const { threadID, messageID } = message;

        // Check if package name is provided
        if (args.length === 0) {
            return api.sendMessage(
                "❌ Please provide a package name!\n\n📖 Usage:\n/npm <package-name>\n\nExamples:\n• /npm express\n• /npm axios\n• /npm react",
                threadID,
                messageID
            );
        }

        const packageName = args[0].toLowerCase();

        try {
            // Get API key from config
            const apiKey = global.config?.apiKeys?.priyanshuApi;

            // Fetch package info from API
            const response = await axios.post(
                'https://priyanshuapi.qzz.io/api/runner/npm-package-info/fetch',
                { package: packageName },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            // Check if API returned success
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Package not found');
            }

            const pkg = response.data.package;

            // Build response message
            let responseMessage = `📦 NPM Package Information\n\n`;
            responseMessage += `━━━━━━━━━━━━━━━━━━━━\n\n`;

            // Name and Version
            responseMessage += `📌 Name: ${pkg.name}\n`;
            responseMessage += `🏷️ Version: ${pkg.versions?.latest || pkg.version}\n\n`;

            // Description
            if (pkg.description) {
                responseMessage += `📝 Description:\n${pkg.description}\n\n`;
            }

            // Author
            if (pkg.author) {
                responseMessage += `👤 Author: ${pkg.author}\n`;
            }

            // License
            if (pkg.license) {
                responseMessage += `⚖️ License: ${pkg.license}\n\n`;
            }

            // Keywords (show first 5)
            if (pkg.keywords && pkg.keywords.length > 0) {
                const keywordList = pkg.keywords.slice(0, 5).join(', ');
                const moreKeywords = pkg.keywords.length > 5 ? ` +${pkg.keywords.length - 5} more` : '';
                responseMessage += `🏷️ Keywords:\n${keywordList}${moreKeywords}\n\n`;
            }

            // Repository
            if (pkg.repository && pkg.repository.url) {
                let repoUrl = pkg.repository.url;
                // Clean up git+ prefix and .git suffix
                repoUrl = repoUrl.replace('git+', '').replace('.git', '');
                responseMessage += `📂 Repository:\n${repoUrl}\n\n`;
            }

            // Created and Modified dates
            if (pkg.timeCreated) {
                const createdDate = new Date(pkg.timeCreated).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                responseMessage += `📅 Created: ${createdDate}\n`;
            }

            if (pkg.timeModified) {
                const modifiedDate = new Date(pkg.timeModified).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                responseMessage += `🔄 Last Updated: ${modifiedDate}\n\n`;
            }

            // Version count
            if (pkg.versions && pkg.versions.count) {
                responseMessage += `📊 Total Versions: ${pkg.versions.count}\n`;
            }

            // Weekly downloads
            if (pkg.stats && typeof pkg.stats.weeklyDownloads === 'number') {
                const weeklyDownloads = pkg.stats.weeklyDownloads.toLocaleString('en-US');
                responseMessage += `📈 Weekly Downloads: ${weeklyDownloads}\n`;
            }

            // Links
            responseMessage += `\n🔗 Links:\n`;
            if (pkg.packageLink) {
                responseMessage += `• NPM: ${pkg.packageLink}\n`;
            }
            if (pkg.homepage) {
                responseMessage += `• Homepage: ${pkg.homepage}\n`;
            }

            // Dependencies count
            if (pkg.dependencies) {
                const depCount = Object.keys(pkg.dependencies).length;
                if (depCount > 0) {
                    responseMessage += `\n📚 Dependencies: ${depCount}`;
                }
            }

            // Dev Dependencies count
            if (pkg.devDependencies) {
                const devDepCount = Object.keys(pkg.devDependencies).length;
                if (devDepCount > 0) {
                    responseMessage += `\n🛠️ Dev Dependencies: ${devDepCount}`;
                }
            }

            responseMessage += `\n\n━━━━━━━━━━━━━━━━━━━━\n`;
            responseMessage += `💡 Use: npm install ${pkg.name}`;

            // Send result message as reply
            return api.sendMessage(responseMessage, threadID, messageID);

        } catch (error) {
            console.error("NPM command error:", error);

            let errorMessage = "❌ Failed to fetch package information.\n\n";

            if (error.message.includes('Package not found') || error.response?.status === 404) {
                errorMessage += `📦 Package "${packageName}" not found on NPM.\n\n`;
                errorMessage += "💡 Tips:\n";
                errorMessage += "• Check the spelling\n";
                errorMessage += "• Make sure the package exists\n";
                errorMessage += "• Try searching on npmjs.com";
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorMessage += "⏰ Request timed out. Please try again.";
            } else if (error.response) {
                errorMessage += `🔴 API Error: ${error.response.status}\n`;
                errorMessage += `Message: ${error.response.data?.message || 'Unknown error'}`;
            } else if (error.request) {
                errorMessage += "🌐 Network error. Please check your internet connection.";
            } else {
                errorMessage += `💥 Error: ${error.message}`;
            }

            return api.sendMessage(errorMessage, threadID, messageID);
        }
    }
};
