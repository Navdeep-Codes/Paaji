const { App } = require('@slack/bolt');
const dotenv = require('dotenv');
dotenv.config();

const { handleChannelActivity } = require('./features/channelActivity');
const { handleThreadSummary } = require('./features/threadSummary');
const { handleConversation } = require('./features/conversation');
const { startHackatimeTracking } = require('./features/hackatimeTracker');
const { handleAddMembers } = require('./features/addMembers'); 
const { handleHcdMe } = require('./features/HCD/me'); 
const app = new App({
  token: process.env.BOT_AUTH_TOKEN,       
  signingSecret: process.env.BOT_SIGNIN_SECRET,
  socketMode: true,
  appToken: process.env.BOT_APP_TOKEN      
});

let hackatimeInterval;

app.event('app_mention', async ({ event, say, client }) => {
  const Q = event.text.replace(/<@[^>]+>/, '').trim(); 

  if (!Q) {
    await say({
      text: `Dont ping me with no reason bro.`,
      thread_ts: event.ts
    });
    return;
  }
  
  let response;

  if (Q.match(/^!HCD me/i)) {
    response = await handleHcdMe(event.user); 
  } else {
    const channelActivityMatch = Q.match(/(?:what'?s going on|tell me what'?s happening|recent activity|what'?s happening) in (#[\w-]+)/i);
  
    if (channelActivityMatch) {
      const channelName = channelActivityMatch[1];
      response = await handleChannelActivity(client, channelName);
    } else if (Q.match(/add (\d+) members of #([\w-]+) (here|to #([\w-]+))/i)) {
      response = await handleAddMembers(client, event, Q); 
    } else {
      const threadUrlMatch = Q.match(/https:\/\/hackclub\.slack\.com\/archives\/([A-Z0-9]+)\/p(\d+)/);
    
      if (threadUrlMatch) {
        const channelId = threadUrlMatch[1];
        const timestamp = threadUrlMatch[2];
        const threadTs = `${timestamp.slice(0, 10)}.${timestamp.slice(10)}`;
      
        const questionWithoutUrl = Q.replace(/https:\/\/hackclub\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/, '').trim();
      
        response = await handleThreadSummary(client, channelId, threadTs, questionWithoutUrl);
      } else {
        response = await handleConversation(client, event, Q);
      }
    }
  }

  await client.chat.postMessage({
    channel: event.channel,
    text: `${response}`,
    thread_ts: event.ts
  });
});
app.message(/^!HCD me/i, async ({ message, say }) => {
  const response = await handleHcdMe(message.user);
  await say({
    text: response,
    thread_ts: message.ts
  });
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Pajji bot is running!');
  
  hackatimeInterval = startHackatimeTracking(app.client);
})();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  if (hackatimeInterval) {
    clearInterval(hackatimeInterval);
  }
  process.exit(0);
});