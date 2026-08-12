
# Facebook Messenger Bot - Full Documentation

This document provides a comprehensive overview of the Facebook Messenger Bot, its architecture, features, and how to extend its functionality. This guide is designed to be used by developers and AI assistants to understand the bot's codebase and create new commands and features.

## 1. Introduction

This bot is a powerful and extensible Facebook Messenger chatbot built with Node.js. It uses `fca-priyansh` to connect to the Facebook Messenger platform and MongoDB for data persistence. The bot is designed to be highly modular, with a clear separation of concerns between commands, events, handlers, and data models.

### Key Features:

- **Modular Command System:** Easily create new commands by adding files to the `modules/commands` directory.
- **Event Handling:** Respond to Messenger events such as users joining/leaving groups, nickname changes, and more.
- **Database Integration:** Utilizes MongoDB to store user, thread, and currency data.
- **Permissions System:** Control command access with a granular permission system (OWNER, ADMIN, SUPPORTER, PUBLIC).
- **Cooldowns:** Prevent command spam with a configurable cooldown system.
- **Web UI:** A simple web interface to view bot stats and uptime.
- **Extensible Architecture:** The bot is designed to be easily extended with new features and functionality.

## 2. Project Structure

The project is organized into the following directories:

- **`/` (root):** Contains the main entry point (`index.js`), configuration files (`config.json`, `appstate.json`), and startup scripts (`start.js`, `start-render.js`).
- **`/controller`:** Contains business logic for interacting with the database.
- **`/database`:** Contains database-related files, such as anti-change settings.
- **`/handles`:** Core handlers for processing commands, events, replies, and reactions.
- **`/models`:** Mongoose schema definitions for database models (users, threads, currencies).
- **`/modules`:** Contains the bot's primary functionality:
  - **`/modules/commands`:** All bot commands are defined here, with each file representing a single command.
  - **`/modules/events`:** Event handlers for various Messenger events.
- **`/public`:** Static files for the web UI.
- **`/utils`:** Utility modules for logging, loading modules, managing permissions, and more.

## 3. Core Concepts

### 3.1. Global Objects

The bot utilizes several global objects to provide easy access to core functionality:

- **`global.client`:** The main client object, containing maps for commands, events, cooldowns, replies, and reactions.
- **`global.config`:** The bot's configuration, loaded from `config.json`.
- **`global.logger`:** A custom logging utility for formatted console output.
- **`global.api`:** The Facebook API instance provided by `fca-priyansh`.
- **`global.User`, `global.Thread`, `global.Currency`, `global.AntiThread`:** Mongoose models for interacting with the database.

### 3.2. Detailed Handler Explanations

Handlers are the core of the bot's logic, processing incoming messages and events. They are the bridge between the Messenger platform and your bot's commands and features.

#### `handleCommand.js`

- **Purpose:** Processes incoming messages to determine if they are valid commands.
- **Logic:**
  1. **Prefix Check:** Checks if the message starts with the configured prefix (`global.config.prefix`).
  2. **Command Parsing:** Parses the command name and arguments from the message body.
  3. **Command Retrieval:** Retrieves the command from `global.client.commands` using its name or an alias.
  4. **Permission Check:** Verifies if the sender has the required permission level to use the command.
  5. **Cooldown Check:** Ensures the sender has not used the command too recently.
  6. **Execution:** Executes the command's `run` function, passing `api`, `message`, and `args`.

#### `handleEvent.js`

- **Purpose:** Handles various Messenger events (e.g., `log:subscribe` for user joins, `log:unsubscribe` for user leaves).
- **Logic:**
  1. **Event Mapping:** Maps the event type (`logMessageType`) to a corresponding event handler file in `modules/events`.
  2. **Execution:** Executes the event handler's `run` function, passing `api`, `message`, and `logMessageData`.

#### `handleReply.js`

- **Purpose:** Enables multi-step, interactive commands by handling replies to specific messages.
- **Logic:**
  1. **Reply Detection:** Checks if the incoming message is a reply to another message (`message.messageReply`).
  2. **Handler Retrieval:** Looks for a pending reply handler in `global.client.replies` that matches the replied-to message's ID.
  3. **Execution:** If a handler is found, it executes the `handleReply` function of the command that initiated the reply, passing `api`, `message`, `args`, and any `replyData`.
  4. **Cleanup:** Removes the reply handler after execution to prevent it from being triggered again (unless it's marked as `persistent`).

- **Creating a Reply Handler:**
  To make a command interactive, you first send a message and then create a reply handler for it. This is done within a command's `run` function:

  ```javascript
  // In a command's run function
  const sentMessage = await api.sendMessage('Please reply to this message.', threadID);

  // Create a reply handler
  global.handleReply.createReply({
    threadID: threadID,
    messageID: sentMessage.messageID,
    command: 'mycommand', // The name of the command that will handle the reply
    expectedSender: senderID, // Optional: only accept replies from this user
    data: { customData: 'some_value' } // Optional: pass data to the handleReply function
  });
  ```

- **Handling the Reply:**
  Your command file must also include a `handleReply` function to process the user's reply:

  ```javascript
  // In the same command file
  module.exports.handleReply = async function({ api, message, replyData }) {
    const { threadID, messageID, body } = message;
    const { customData } = replyData; // Access any data passed from createReply

    api.sendMessage(`You replied with: "${body}"`, threadID, messageID);
    api.sendMessage(`The custom data was: ${customData}`, threadID);
  };
  ```

#### `handleReaction.js`

- **Purpose:** Similar to `handleReply`, but for message reactions.
- **Logic:**
  1. **Handler Retrieval:** Looks for a pending reaction handler in `global.client.reactions` that matches the reacted-to message's ID.
  2. **Execution:** Executes the `handleReaction` function of the command that initiated the reaction handler.

#### `handleDatabase.js`, `handleCreateDatabase.js` & `dynamicDatabaseSync.js`

- **Purpose:** These handlers keep MongoDB in sync with what actually happens on Messenger **without** requiring a heavy full-thread scan at startup.
- **`handleCreateDatabase.js`:**
  - **Core helpers only:** Exposes `createUser` and `createThread` helpers that other parts of the bot call.
  - **No full scan:** The old "get all threads with pagination" boot step is disabled; the function remains only for backward compatibility and logging.
- **`handleDatabase.js`:**
  - **Real-time Updates:** Runs on every message (except presence/typing/read_receipt) to keep users, threads and currencies up to date.
  - **On-demand Creation:** Lazily creates users, threads and currency records the first time they are seen.
  - **Activity Tracking:** Updates `lastActive`, per-thread `messageCount`, EXP and money, and delegates special events (join/leave, nickname, image, calls, etc.) to dedicated event handlers.
- **`dynamicDatabaseSync.js`:**
  - **Fallback Bootstrap:** If the original thread scan fails, this module gradually populates the database from live traffic only.
  - **Auto-detects Threads:** Uses `api.getThreadInfo` and `api.getUserInfo` to synthesise missing users and threads when messages arrive.

## 4. Creating New Commands

To create a new command, add a new JavaScript file to the `modules/commands` directory. Each command file must export an object with `config` and `run` properties.

### 4.1. Command Structure

```javascript
module.exports = {
  config: {
    name: 'mycommand', // The primary name of the command
    aliases: ['mc'], // Optional aliases for the command
    description: 'A description of what the command does',
    usage: '{prefix}mycommand [argument]', // How to use the command
    credit: 'Your Name', // The author of the command
    hasPrefix: true, // Whether the command requires a prefix to be used
    permission: 'PUBLIC', // Required permission level (PUBLIC, SUPPORTER, ADMIN, OWNER)
    cooldown: 5, // Cooldown in seconds
    category: 'GENERAL' // The category the command belongs to
  },

  run: async function({ api, message, args }) {
    // Your command logic here
    const { threadID, messageID, senderID } = message;

    // Use the api object to send messages, get user info, etc.
    api.sendMessage('Hello from mycommand!', threadID, messageID);
  }
};
```

### 4.2. Command `config` Properties

| Property      | Type      | Description                                                                                             |
|---------------|-----------|---------------------------------------------------------------------------------------------------------|
| `name`        | `string`  | The primary name of the command.                                                                        |
| `aliases`     | `string[]`| An array of alternative names for the command.                                                          |
| `description` | `string`  | A brief description of the command's purpose.                                                           |
| `usage`       | `string`  | Instructions on how to use the command. Use `{prefix}` to represent the bot's prefix.                   |
| `credit`      | `string`  | The name of the command's author.                                                                       |
| `hasPrefix`   | `boolean` | If `true`, the command can only be triggered with the bot's prefix.                                      |
| `permission`  | `string`  | The required permission level: `PUBLIC`, `SUPPORTER`, `ADMIN`, or `OWNER`.                               |
| `cooldown`    | `number`  | The cooldown period for the command in seconds.                                                         |
| `category`    | `string`  | The category the command belongs to, used for grouping in the `help` command.                           |

### 4.3. Command `run` Function

The `run` function is the entry point for your command's logic. It receives an object with the following properties:

| Property  | Type     | Description                                               |
|-----------|----------|-----------------------------------------------------------|
| `api`     | `object` | The Facebook API instance from `fca-priyansh`.            |
| `message` | `object` | The full message object from the Messenger platform.      |
| `args`    | `string[]`| An array of arguments passed to the command.              |

## 5. Creating New Events

To create a new event handler, add a new JavaScript file to the `modules/events` directory. Event handlers are triggered by specific Messenger events.

### 5.1. Event Structure

```javascript
module.exports = {
  config: {
    name: 'userJoin', // The name of the event (e.g., userJoin, userLeave)
    description: 'Handles new users joining a group',
    credit: 'Your Name'
  },

  run: async function({ api, message, logMessageData }) {
    // Your event logic here
    const { threadID } = message;
    const addedParticipants = logMessageData.addedParticipants || [];

    for (const participant of addedParticipants) {
      api.sendMessage(`Welcome, ${participant.fullName}!`, threadID);
    }
  }
};
```

### 5.2. Event `run` Function

The `run` function for an event receives an object with the following properties:

| Property         | Type     | Description                                           |
|------------------|----------|-------------------------------------------------------|
| `api`            | `object` | The Facebook API instance from `fca-priyansh`.        |
| `message`        | `object` | The full message object containing the event data.    |
| `logMessageData` | `object` | The specific data associated with the event.          |

## 6. Detailed Database Models

The bot uses Mongoose to interact with a MongoDB database. The following models are defined in the `/models` directory:

- **`users.js`:**
  - `userID`: The user's Facebook ID (Primary Key).
  - `name`: The user's full name.
  - `isBanned`: A boolean indicating if the user is banned from using the bot.
  - `banReason`: The reason for the ban.
  - `dateCreated`: The date the user was first seen by the bot.
  - `lastActive`: The last time the user sent a message or interacted with the bot.
  - `lastThreadID`: The ID of the last thread the user was active in.

- **`threads.js`:**
  - `threadID`: The thread's Facebook ID (Primary Key).
  - `threadName`: The name of the thread.
  - `users`: An array of user objects (`{ id, name, nickname }`) who are members of the thread.
  - `isBanned`: A boolean indicating if the thread is banned from using the bot.
  - `banReason`: The reason for the ban.
  - `settings`: Thread-specific settings, such as `antiJoin` (prevents new users from joining) or `welcome` (enables/disables welcome messages).
  - `messageCount`: A map of user IDs to their message counts within the thread, used for tracking activity.

- **`currencies.js`:**
  - `userID`: The user's Facebook ID (Primary Key).
  - `exp`: The user's experience points, gained through activity.
  - `level`: The user's level, which increases with EXP.
  - `money`: The user's primary currency, used for various economy commands.
  - `bank`: The user's bank balance, for storing money securely.
  - `bankCapacity`: The maximum amount of money a user can store in their bank.
  - `inventory`: An array of items the user owns, which can provide various effects.

- **`antiThread.js`:**
  - `threadID`: The thread's Facebook ID (Primary Key).
  - `fullLock`, `groupNameLock`, `groupImageLock`, `nicknameLock`: Booleans to enable/disable anti-change features.
  - `originalGroupName`, `originalGroupImage`, `originalNicknames`: Stores the original state of the thread to revert any unauthorized changes.

## 7. API and Utilities

The `/utils` directory contains several helpful modules:

- **`api.js`:** Provides a global wrapper around the `fca-priyansh` API, making it easy to send messages, get user info, and more.
- **`logger.js`:** A custom logging utility with different log levels (system, command, event, error, etc.) and color-coded output.
- **`loader.js`:** Dynamically loads all commands and events at startup, and exposes helpers to hot-reload one or all commands.
- **`permissions.js`:** Contains the logic for checking user permissions and mapping user IDs to roles (OWNER, ADMIN, SUPPORTER, PUBLIC).
- **`server.js`:** A simple HTTP server for displaying bot stats, exposing `/api/stats`, and keeping the bot alive on hosting platforms like Render.com.
- **`sessionManager.js`:** Handles periodic DTSG/cookie refresh, automatic `appstate.json` saves, reconnection logic and detailed session error reporting.
- **`global.js`:** Bootstraps `global.client`, `global.config`, `global.logger`, `global.utils` and other globals before the bot starts.

## 8. FCA integration (`fca-priyansh`)

This project uses the npm package `fca-priyansh` instead of relying on a local fork. The main bot (`main.js`) imports the package using:

- `const login = require('fca-priyansh');` to log in with `appstate.json`.
- Uses the forked FCA instance for all messaging and MQTT events.

Key enhancements in the fork include:

- **Automation checkpoint handling:**
  - Centralised logic in `Main.js`, `utils.parseAndCheckLogin` and `src/listenMqtt.js` to detect the automation popup (checkpoint `601051028565049`).
  - A bypass pipeline (`global.Fca.BypassAutomationNotification`) that sends a GraphQL mutation to dismiss the warning and then refreshes cookies.
  - A temporary `AutomationHold` flag that pauses bot replies while a checkpoint is being auto-resolved.
- **Improved sendMessage behaviour:**
  - Smarter detection of group vs user threads.
  - Automatic retry with the “opposite” format when Facebook returns transient errors like `1545012`.
  - Better handling of network errors and timeouts when sending messages.
- **Safer cookie/AppState handling:**
  - Shared helpers in `utils.js` for `getAppState` and cookie formatting.
  - Hot-reload support: `main.js` watches the `appstate.json` file and injects new cookies into the running session without a full restart.

Whenever you modify or update `fca-updated`, the rest of the bot will automatically use the new behaviour on the next restart.

## 9. Session management & reliability

The bot’s long-term stability is managed via `utils/sessionManager.js` plus FCA’s own reconnection options:

- **DTSG & cookie refresh:**
  - Periodically pings Facebook (either through internal HTTP helpers or lightweight API calls) to keep cookies and security tokens fresh.
- **Automatic AppState saving:**
  - Saves a fresh `appstate.json` on a configurable interval so you can restart the bot without manually exporting cookies again.
- **Health monitoring & reconnects:**
  - Periodically inspects the context to see if the bot is still logged in.
  - Attempts a limited number of reconnection/refresh cycles before giving up and asking for manual intervention.
- **Rich error reporting:**
  - Analyses error codes (`ECONNRESET`, `ETIMEDOUT`, 401/403, checkpoint markers, etc.) and prints a human-readable “logout reason” to the console.

All key timings can be tuned in `config.json` under the `sessionManagement` block (refresh intervals, max reconnect attempts, etc.).

## 10. Spam protection, bans & modes

Several layers of anti-abuse are built into the core handlers:

- **Per-command spam ban (`spamBan` and `spamBanSettings`):**
  - Limits how many commands a user can run in a sliding time window.
  - Temporarily bans abusers and remembers ban state in the database.
- **User & thread bans:**
  - `global.User.isBanned` blocks commands, replies and reactions from that user.
  - `global.Thread.isBanned` blocks bot usage in a particular group, with a stored ban reason.
- **NSFW gating:**
  - Commands whose `config.category` is `NSFW` only run if the thread has NSFW enabled in its settings.
- **Admin-only modes:**
  - **Global:** `config.adminOnlyMode` can restrict commands to OWNER / ADMINS / SUPPORTERS everywhere; `handleCommand` enforces this with a per-user cooldowned warning message.
  - **Per-thread:** each thread can store its own `adminOnlyMode` setting, allowing some groups to be admin-only while others remain public.
- **Cooldown system:**
  - Each command declares a `cooldown` in seconds; `handleCommand` tracks per-user cooldowns and sends a friendly “please wait” message instead of executing too often.

These mechanisms are all implemented in `handles/handleCommand.js` and the Mongoose models under `/models`.

## 11. Web server & monitoring

The HTTP server in `utils/server.js` provides a simple status page and an API for monitoring:

- Serves static files from the `public/` directory (default `index.html`).
- Exposes `/api/stats` with basic JSON stats such as:
  - Bot uptime (human-readable).
  - Loaded command count.
  - Loaded event count.
- Logs the server URL (e.g. `http://localhost:4000`) and stores it in `global.config.serverUrl` for other modules to display.
- Detects Render.com via the `RENDER_EXTERNAL_URL` environment variable and, if enabled, periodically pings that URL to keep the dyno alive.

You can control this behaviour in `config.json` under the `server` block, including toggling `enabled` and `autoUptimeMonitoring`.

## 12. Attachments & large media

Media-heavy commands (music, song, video, etc.) follow a consistent pattern:

1. **Download:** Use `axios` or another HTTP client to stream the remote file into a temporary path inside the command’s folder (e.g. `modules/commands/temp/` or `modules/commands/tempsr/`).
2. **Validate:** After the write stream finishes, call `fs.stat` on the temp file and **skip sending** if the file is empty (0 bytes) or unreadable.
3. **Send:** Call `api.sendMessage({ body, attachment: fs.createReadStream(filePath) }, threadID, ...)`.
4. **Cleanup:** Delete the temp file once the send finishes (whether it succeeds or fails).

The FCA fork (`fca-updated/src/sendMessage.js` and `utils.postFormData`) has been tuned for large uploads:

- Uses `https://upload.facebook.com/ajax/mercury/upload.php` with `multipart/form-data` for attachments.
- Applies a higher timeout to this endpoint than normal API calls to reduce spurious `ESOCKETTIMEDOUT` errors for big files.
- Performs minimal but robust JSON parsing on upload responses so that non-critical automation checks do not break media sending.

When writing new commands that send media, copy the existing pattern from `music.js`, `song.js`, `video.js` or `videov2.js` to ensure reliable downloads, uploads and cleanup.

