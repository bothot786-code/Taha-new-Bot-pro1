/**
 * Server Utility
 * Handles HTTP server for bot preview and uptime monitoring
 */

const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const axios = require('axios');

// [FCA-PRIYANSH UPDATE #26] Log file access over HTTP (Render pe logs dekhne/download ke liye).
// EventLogger fca-updated ke andar hai; safe require (ag ar na mile to routes skip ho jaayein).
let EventLogger;
try { EventLogger = require('../fca-updated/Extra/Src/EventLogger'); }
catch (e) { try { EventLogger = require('fca-priyansh/Extra/Src/EventLogger'); } catch (e2) { EventLogger = null; } }

let startTime = Date.now();

/**
 * Format uptime in human-readable format
 */
function formatUptime() {
    const uptime = Date.now() - startTime;
    const seconds = Math.floor(uptime / 1000) % 60;
    const minutes = Math.floor(uptime / (1000 * 60)) % 60;
    const hours = Math.floor(uptime / (1000 * 60 * 60)) % 24;
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Create and start HTTP server
 */
function startServer(port = process.env.PORT || global.config.server?.port || 3400) {
    // Skip server if disabled in config
    if (global.config.server && global.config.server.enabled === false) {
        global.logger.system('HTTP server disabled in config');
        return null;
    }
    const server = http.createServer((req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // ==================== [FCA-PRIYANSH UPDATE #26] Log routes ====================
        // /fca-logs           -> aaj ki log file text me (browser me dikhao)
        // /fca-logs/download  -> aaj ki log file download
        // /fca-logs/list      -> saari log files (JSON)
        // ?date=YYYY-MM-DD  aur  ?lines=200  supported
        try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            // Double-slash / trailing-slash safe: '/fca-logs', '//fca-logs', '/fca-logs/' sab chalein
            const cleanPath = parsedUrl.pathname.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';

            if (cleanPath === '/fca-logs' || cleanPath === '/fca-logs/download' || cleanPath === '/fca-logs/list') {
                if (!EventLogger) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    return res.end('EventLogger not available (fca-updated/Extra/Src/EventLogger.js not found).');
                }
                const LOG_DIR = EventLogger.LOG_DIR;
                const date = parsedUrl.searchParams.get('date');
                const listFiles = () => {
                    try { return fs.existsSync(LOG_DIR) ? fs.readdirSync(LOG_DIR).filter(f => f.startsWith('events-') && f.endsWith('.log')).sort().reverse() : []; }
                    catch { return []; }
                };
                const fileForDate = () => {
                    let name;
                    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) name = `events-${date}.log`;
                    else {
                        const d = new Date();
                        name = `events-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.log`;
                    }
                    return path.join(LOG_DIR, name);
                };

                if (cleanPath === '/fca-logs/list') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ dir: LOG_DIR, files: listFiles() }, null, 2));
                }

                const fp = fileForDate();
                if (!fs.existsSync(fp)) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    return res.end('Log file not found: ' + path.basename(fp) + '\nAvailable: ' + listFiles().join(', '));
                }

                if (cleanPath === '/fca-logs/download') {
                    res.writeHead(200, {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Content-Disposition': 'attachment; filename="' + path.basename(fp) + '"'
                    });
                    return fs.createReadStream(fp).pipe(res);
                }

                // /fca-logs -> inline text (optional ?lines=N tail)
                let content = fs.readFileSync(fp, 'utf8');

                // ==================== [FCA-PRIYANSH UPDATE #33] ====================
                // ?filter=important -> sirf critical lines (message-spam hata ke). Isse logout ke
                //   aaspaas ka poora flow ek jagah saaf dikhta hai — debug bahut aasaan.
                // ?grep=word -> jis line me 'word' ho sirf wahi (case-insensitive).
                const filter = parsedUrl.searchParams.get('filter');
                const grep = parsedUrl.searchParams.get('grep');
                if (filter === 'important') {
                    // Ye keywords "kuch hua" wali lines pakadte hain; normal message-echo skip.
                    const KEEP = /logout|1357001|1357004|checkpoint|automation|raw-fb|raw-err|diagnostic|DIAG|RAW-ERR|error|ERROR|WARN|MQTT|SessionKeepalive|refreshSession|Cookie|appstate|reconnect|Session logout|stop|login|Login|dtsg|SYSTEM|captureAll|EventLogger|offline|connected|Presence/i;
                    // Message-echo block ko drop karo (jinme group/user/content emojis hote hain)
                    const DROP = /\[💓\]|\[🔎\]|\[🔱\]|\[📝\]|\[📩\]|◆━|Group name:|Group ID:|User name:|User ID:|Content:|DATABASE\]|Created new|leveled up|Cleanup|broadcast available|Requesting next broadcast|Have a Nice Day|Thank You For Using|Hello how are you/;
                    content = content.split('\n').filter(l => KEEP.test(l) && !DROP.test(l)).join('\n');
                } else if (grep && grep.trim()) {
                    const g = grep.trim().toLowerCase();
                    content = content.split('\n').filter(l => l.toLowerCase().includes(g)).join('\n');
                }

                const lines = parseInt(parsedUrl.searchParams.get('lines'), 10);
                if (Number.isFinite(lines) && lines > 0) content = content.split('\n').slice(-lines).join('\n');
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end(content);
                // ==================== [FCA-PRIYANSH UPDATE #33 END] ====================
            }
        } catch (logErr) {
            // agar kuch galat ho to normal flow chalne do
        }
        // ==================== [FCA-PRIYANSH UPDATE #26 END] ====================

        // Handle API endpoint for stats
        if (req.url === '/api/stats') {
            const stats = {
                uptime: formatUptime(),
                commands: global.client.commands.size,
                events: global.client.events.size
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(stats));
        }
        
        // Serve static files from public directory
        let filePath = path.join(__dirname, '../public', req.url === '/' ? 'index.html' : req.url);
        
        // Check if file exists
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // If file doesn't exist, serve index.html
                filePath = path.join(__dirname, '../public/index.html');
            }
            
            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error loading the file');
                    return;
                }
                
                // Determine content type based on file extension
                const ext = path.extname(filePath);
                let contentType = 'text/html';
                
                switch (ext) {
                    case '.js':
                        contentType = 'text/javascript';
                        break;
                    case '.css':
                        contentType = 'text/css';
                        break;
                    case '.json':
                        contentType = 'application/json';
                        break;
                    case '.png':
                        contentType = 'image/png';
                        break;
                    case '.jpg':
                    case '.jpeg':
                        contentType = 'image/jpeg';
                        break;
                }
                
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            });
        });
    });
    
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const newPort = port + 1;
            global.logger.warn(`Port ${port} is in use, trying port ${newPort}`);
            console.log(`[SERVER] Port ${port} is busy, trying ${newPort}...`);
            return startServer(newPort);
        } else {
            global.logger.error('Server error:', err.message);
            console.error('[SERVER] Server error:', err.message);
        }
    });
    
    server.listen(port, () => {
        const serverUrl = `http://localhost:${port}`;
        global.logger.system(`HTTP server running at ${serverUrl}`);
        console.log(`[SERVER] HTTP server running at ${serverUrl}`);
        
        // Store server URL in global config
        global.config.serverUrl = serverUrl;
        
        // Check if running on Render.com
        if (process.env.RENDER_EXTERNAL_URL) {
            global.config.renderUrl = process.env.RENDER_EXTERNAL_URL;
            setupUptimeMonitoring(process.env.RENDER_EXTERNAL_URL);
        }
    });
    
    return server;
}

/**
 * Setup uptime monitoring for Render.com deployment
 */
async function setupUptimeMonitoring(url) {
    // Skip if uptime monitoring is disabled in config
    if (global.config.server && global.config.server.autoUptimeMonitoring === false) {
        global.logger.system('Automatic uptime monitoring disabled in config');
        return;
    }
    
    try {
        global.logger.system(`Setting up uptime monitoring for ${url}`);
        console.log(`[UPTIME] Registered URL for monitoring: ${url}`);
        
        // [FCA-PRIYANSH #60] Keep the service alive by self-pinging every 4 min (well under the
        // ~15-min free-tier idle window), with a cache-busting query so no cached 200 is served.
        // NOTE: a self-ping cannot wake a service that has ALREADY gone to sleep — for true 24/7
        // uptime on a free plan, also set an EXTERNAL monitor (UptimeRobot / cron-job.org) on this URL.
        global.logger.system(`💡 For 24/7 uptime, also add an external monitor (UptimeRobot / cron-job.org) pinging: ${url}`);
        setInterval(async () => {
            try {
                await axios.get(url + (url.includes('?') ? '&' : '?') + 'uptime=' + Date.now(), { timeout: 20000 });
            } catch (error) {
                global.logger.error(`Failed to ping ${url}: ${error.message}`);
            }
        }, 4 * 60 * 1000); // 4 minutes
        
        // For UptimeRobot: You could add API integration here
        // This is a placeholder for future implementation
        // Example: registerWithUptimeRobot(url, 'Facebook Messenger Bot');
    } catch (error) {
        global.logger.error(`Failed to setup uptime monitoring: ${error.message}`);
    }
}

module.exports = {
    startServer,
    formatUptime
};