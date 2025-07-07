const axios = require('axios');
const systemprompt = require('../systempromt.js');
const { getThreadContext } = require('../utils/slackHelpers');

async function handleThreadSummary(client, channelId, threadTs, userQuestion) {
  try {
    const threadMessages = await getThreadContext(client, channelId, threadTs);
    
    if (threadMessages.length === 0) {
      return "I couldn't find that thread or don't have access to it.";
    }

    const convoText = threadMessages.map(msg => {
      const username = msg.user ? `<@${msg.user}>` : 'Bot';
      const cleanText = msg.text.replace(/<@[^>]+>/g, '').trim();
      return `${username}: ${cleanText}`;
    }).join('\n');

    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'gemma2-9b-it',
        messages: [
          {
            role: 'system',
            content: `${systemprompt}`
          },
          {
            role: 'user',
            content: `You have previously read this Slack thread:${convoText}
                    Now answer this follow-up question from the user: "${userQuestion}".
                    Be precise and refer only to the messages in that thread.`
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_KEY}`
        }
      }
    );

    return res.data.choices?.[0]?.message?.content || 'No response from Groq.';
  } catch (error) {
    console.error('Thread summarization error:', error.response?.data || error.message);
    return 'Huh why dis aint working? Aye <@U083T3ZP6AV> bro, I think you broke something go fix it!';
  }
}

module.exports = { handleThreadSummary };