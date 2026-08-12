const axios = require("axios");
const he = require("he"); // Import the he package

module.exports = {
  config: {
    name: "quiz",
    hasPrefix: true,
    description: "Participate in a quiz and answer the question.",
    usage: "{prefix}quiz",
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    permission: "PUBLIC",
    cooldown: 5,
    category: "FUN"
  },

  run: async function ({ api, message, args }) {
    const { threadID, messageID, senderID } = message;

    try {
      const response = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
      const questionData = response.data.results[0];

      // Decode HTML entities using the he package
      const question = he.decode(questionData.question);
      const correctAnswer = he.decode(questionData.correct_answer);
      const incorrectAnswers = questionData.incorrect_answers.map(answer => he.decode(answer));

      const options = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5); // Shuffle options

      const optionLetters = ['A', 'B', 'C', 'D']; // Uppercase letters
      let optionsMessage = "Options:\n";
      options.forEach((option, index) => {
        optionsMessage += `${optionLetters[index]}. ${option}\n`;
      });

      api.sendMessage(`Question: ${question}\n${optionsMessage}\nYou have 10 seconds to answer with A, B, C, or D.`, threadID, async (err, info) => {
        const replies = global.client.replies.get(threadID) || [];
        replies.push({
          command: this.config.name,
          messageID: info.messageID,
          expectedSender: senderID,
          data: { correctAnswer, optionLetters, options } // Store options for later use
        });
        global.client.replies.set(threadID, replies);

        // Set timeout for 10 seconds
        setTimeout(() => {
          const currentReplies = global.client.replies.get(threadID);
          if (currentReplies) {
            global.client.replies.delete(threadID);
            api.sendMessage(`Time's up! You have been disqualified. The correct answer was: ${correctAnswer}`, threadID);
          }
        }, 10000);
      }, messageID);

    } catch (error) {
      api.sendMessage("❌ An error occurred while fetching the quiz question.", threadID, messageID);
    }
  },

  handleReply: async function ({ api, message, args, replyData }) {
    const { threadID, messageID, senderID, body } = message;
    const answer = body.trim().toUpperCase(); // Convert to uppercase
    const { correctAnswer, optionLetters, options } = replyData;

    // Check if the answer is valid
    if (optionLetters.includes(answer)) {
      const selectedOptionIndex = optionLetters.indexOf(answer);
      const selectedAnswer = options[selectedOptionIndex];

      if (selectedAnswer === correctAnswer) {
        api.sendMessage("✅ Correct answer!", threadID, messageID);
      } else {
        api.sendMessage("❌ Wrong answer!", threadID, messageID);
      }
    } else {
      api.sendMessage("Invalid option! Please reply with A, B, C, or D.", threadID, messageID);
    }

    // Clean up replies
    global.client.replies.delete(threadID);
  }
};