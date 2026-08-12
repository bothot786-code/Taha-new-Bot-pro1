# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0] - 2026-08-10

### 🎥 Auto Downloader System Updates (`autodownload`)
- **Facebook Downloader API**: Updated Facebook video downloader engine with high-speed direct stream links and 360p (SD) quality priority (HD fallback).
- **Instagram Media Support**: Enhanced Instagram Reel, Post & Story downloader with automatic Video (`.mp4`) and Photo (`.jpg`) format detection.
- **Twitter / X Downloader**: Added direct Twitter/X video downloader support.
- **Facebook Upload 408 Timeout Fix**: Resolved Facebook Messenger status code 408 upload timeouts using smart payload fallback and fresh stream connections.
- **0-Byte Download Protection**: Added pre-upload file integrity and size verification (26MB limit) to prevent empty attachment uploads.
- **Silent Error Reactions**: On any media download failure, sets a clean `❌` reaction on the message without spamming error text to the chat thread.
- **Enhanced Debug Logging**: Real-time console logs and temp file staging under `modules/commands/temp/` for transparent monitoring.

### 🔒 Security & Performance Enhancements
- **Preemptive Core Protection**: Upgraded core system handles and main engine with layered protection and runtime verification.
- **Loader & Database Fixes**: Optimized AI Context Manager and dynamic database sync.

### 📁 Files Modified / Added

| File | Change Type | Description |
|------|-------------|-------------|
| `modules/commands/autodownload.js` | Updated | Facebook/Instagram/Twitter downloader engines, 408 fix, 0-byte check, reaction handling |
| `main.js` | Enhanced | Security & performance optimization |
| `handles/handleCommand.js` | Updated | System command handling fixes |
| `handles/handleEvent.js` | Updated | System event handling fixes |
| `handles/handleDatabase.js` | Updated | Database sync fixes |
| `package.json` | Updated | Version bumped to `2.1.0` |
| `update.json` | Updated | Added `v2.1.0` release info & file tracking for `/update` command |
| `CHANGELOG.md` | Updated | Documented v2.1.0 release notes |

---

## [2.0.0] - 2025-12-20

### 🎯 Major Features

#### Code Command Enhancements
- **Validation before save**: Now validates command files for syntax errors and duplicate names BEFORE writing
- **Proper reload by filename**: Loader now matches commands by filename in addition to config.name
- **Edit protection**: When editing, gets old file's actual config.name to avoid false duplicate errors
- **Rename fix**: Fixed rename to properly unload old command by its actual config.name before reload

#### Pastebin Apply Feature
- **New action**: Added `/pastebin apply <filepath>` to apply code from Pastebin URLs
- **Reply-based**: Reply to a message containing pastebin link and apply code directly
- **Full validation**: Uses same validation as code command (syntax + duplicate check)
- **Auto-reload**: Command automatically reloads after successful apply

#### YouTube URL Detection Fix
- **music command**: Fixed detection for YouTube Shorts, mobile links, embed URLs
- **video command**: Same fix applied - now handles all YouTube URL formats
- **URL normalization**: All URLs normalized to standard `youtube.com/watch?v=ID` format

### 🔧 Improvements

#### Loader Improvements (`utils/loader.js`)
- Added `validateCommand()` function for pre-save validation
- Cache clearing before require to ensure fresh file content
- Support for matching commands by filename (not just config.name)
- Better alias conflict detection

#### Logs Timezone
- **India Standard Time**: Logs now display time in IST (Asia/Kolkata) timezone
- Applied to both `main.js` and `handleCommand.js`

#### Dead Thread Cleanup
- Removed verbose debug logs from background cleanup
- Cleaner console output during cleanup operations

### 📁 Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `modules/commands/code.js` | Enhanced | Validation, reload fixes |
| `modules/commands/pastebin.js` | Enhanced | Added apply action |
| `modules/commands/music.js` | Fixed | YouTube URL detection |
| `modules/commands/video.js` | Fixed | YouTube URL detection |
| `modules/commands/cleanup.js` | New | Manual cleanup command |
| `utils/loader.js` | Enhanced | validateCommand, filename matching |
| `handles/handleCreateDatabase.js` | Cleaned | Removed debug logs |
| `handles/handleCommand.js` | Updated | IST timezone |
| `main.js` | Updated | IST timezone |

---

## [1.0.0] - Initial Release

- Runtime update helper
- Stability fixes
- Bot command updates

---

### Legend
- 🎯 Major Features
- 🔧 Improvements
- 🐛 Bug Fixes
- 📁 File Changes
