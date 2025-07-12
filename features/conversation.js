const axios = require('axios');
const systemprompt = require('../systempromt.js');
const { getThreadContext } = require('../utils/slackHelpers');

async function handleConversation(client, event, Q) {
  const threadMessages = await getThreadContext(client, event.channel, event.thread_ts || event.ts);
  
  if (threadMessages.length > 1) {
    return await AIResponseWithContext(Q, threadMessages);
  } else {
    return await AIResponseSimple(Q);
  }
}

async function AIResponseWithContext(Q, threadMessages) {
  try {
    const conversationHistory = threadMessages.map(msg => {
      const isBot = msg.bot_id || msg.user === process.env.BOT_USER_ID;
      return {
        role: isBot ? 'assistant' : 'user',
        content: msg.text.replace(/<@[^>]+>/g, '').trim()
      };
    });

    const messages = [
      {
        role: 'system',
        content: `${systemprompt} You are continuing a conversation. Use the conversation history for context.`
      },
      ...conversationHistory.slice(0, -1),
      {
        role: 'user',
        content: Q
      }
    ];

    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'deepseek-r1-distill-llama-70b',
        messages: messages
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
    console.error('Groq API error (with context):', error.response?.data || error.message);
    return 'Huh why dis aint working? Aye <@U083T3ZP6AV> bro, I think you broke something go fix it!';
  }
}

async function AIResponseSimple(Q) {
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'deepseek-r1-distill-llama-70b',
        messages: [
          {
            role: 'system',
            content: `Follow this ${systemprompt}`,
          },
          {
            role: 'user',
            content: `Here is what the user has asked "${Q}"`,
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
    console.error('Grok API error:', error.response?.data || error.message);
    return 'Huh why dis aint working? Aye <@U083T3ZP6AV> bro, I think you broke something go fix it!';
  }
}

module.exports = { handleConversation, AIResponseWithContext, AIResponseSimple };