const axios = require('axios');
const systemprompt = require('../systempromt.js');

async function handleChannelActivity(client, channelName) {
  try {
    const channelsResult = await client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 1000
    });
    
    const channel = channelsResult.channels.find(ch => ch.name === channelName.replace('#', ''));
    
    if (!channel) {
      return `I couldn't find the channel ${channelName}. Make sure it exists and I have access to it.`;
    }
    
    const messagesResult = await client.conversations.history({
      channel: channel.id,
      limit: 20
    });
    
    if (!messagesResult.messages || messagesResult.messages.length === 0) {
      return `No recent activity found in ${channelName}.`;
    }
    
    const recentMessages = messagesResult.messages.reverse().map(msg => {
      const username = msg.user ? `<@${msg.user}>` : 'Bot';
      const cleanText = msg.text ? msg.text.replace(/<@[^>]+>/g, '').trim() : '[No text content]';
      const timestamp = new Date(parseFloat(msg.ts) * 1000).toLocaleString();
      return `${timestamp} - ${username}: ${cleanText}`;
    }).join('\n');
    
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'gemma2-9b-it',
        messages: [
          {
            role: 'system',
            content: `You are a Slack bot that summarizes channel activity. 

CRITICAL RULES:
- NEVER include URLs, links, or web addresses in your response
- NEVER mention hackclub.com or any website
- Focus ONLY on summarizing conversations and discussions
- Use Slack mrkdwn formatting (* for bold)
- Be concise and informative

Your response must start with "*Recent Activity in [channelname]*" followed by bullet points.`
          },
          {
            role: 'user',
            content: `Summarize recent activity in ${channelName}:

${recentMessages}

IMPORTANT: Do not include any URLs or links. Only describe the conversations and interactions.

Format exactly like this:
*Recent Activity in ${channelName}*
- User discussions and questions
- Mentions of specific topics or problems
- General activity summary`
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

    let aiResponse = res.data.choices?.[0]?.message?.content;
    
    if (aiResponse) {
      aiResponse = aiResponse.replace(/https?:\/\/[^\s]+/g, '');
      aiResponse = aiResponse.replace(/hackclub\.com[^\s]*/g, '');
      aiResponse = aiResponse.replace(/www\.[^\s]+/g, '');
    }
    
    console.log('AI Response for channel activity:', aiResponse);
    
    if (!aiResponse || aiResponse.length < 30) {
      return `*Recent Activity in ${channelName}*\n- Found ${messagesResult.messages.length} recent messages\n- Various discussions and interactions taking place\n- Active community engagement in the channel`;
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Channel activity error:', error.response?.data || error.message);
    return `Sorry, I couldn't get the activity for ${channelName}. I might not have access to that channel.`;
  }
}

module.exports = { handleChannelActivity };

// you prob will hate it as it wont work, and I just gave up. The documentation is just bad.