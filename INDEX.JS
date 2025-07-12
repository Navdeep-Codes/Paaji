const { App } = require('@slack/bolt');
const dotenv = require('dotenv');
dotenv.config();// to load stuff that your mom doesnt know...

const { handleChannelActivity } = require('./features/channelActivity');
const { handleThreadSummary } = require('./features/threadSummary');
const { handleConversation } = require('./features/conversation');
const { startHackatimeTracking } = require('./features/hackatimeTracker');
const { handleAddMembers } = require('./features/addMembers'); 
const { handleHcdMe } = require('./features/HCD/me'); 
const { scheduleDailyPrompt, handleNotionUpdate } = require('./features/Daily Update/DailyUpdate');
const app = new App({
  token: process.env.BOT_AUTH_TOKEN,       
  signingSecret: process.env.BOT_SIGNIN_SECRET,
  socketMode: true,
  appToken: process.env.BOT_APP_TOKEN      
});

let hackatimeInterval;

const TARGET_CHANNEL = 'C08JRG8VCBY';
scheduleDailyPrompt(app, TARGET_CHANNEL);

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
if (Q.match(/^!Help/i)) {
    response = await Helpme(event.user); 
    
  }
  else if (Q.match(/^!HCD me/i)) {
    response = await handleHcdMe(event.user); 
  } else if (Q.match(/add (\d+) members of #([\w-]+) (here|to #([\w-]+))/i)) {
    response = await handleAddMembers( event, Q);
  } else {
    const channelActivityMatch = Q.match(/(?:what'?s going on|tell me what'?s happening|recent activity|what'?s happening) in (#[\w-]+)/i);
  
    if (channelActivityMatch) {
      const channelName = channelActivityMatch[1];
      response = await handleChannelActivity(client, channelName);
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
    // -D gives errors but what can I do :(
    if (Q.match(/-D\s+(\d+)/i)) {
    const match = Q.match(/-D\s+(\d+)/i);
    const numToDelete = parseInt(match[1], 10);
    const history =  client.conversations.history({
      channel: message.channel,
      limit: 100
    });
    let deleted = 0;
    for (const msg of history.messages) {
if (
  msg.bot_id === process.env.BOT_ID ||
  msg.user === process.env.BOT_USER_ID ||
  msg.bot_profile?.name === "Paaji"
){        try { client.chat.delete({channel: message.channel,ts: msg.ts});
          deleted++;
          if (deleted >= numToDelete) break;
        } catch (err) {console.error('Failed to delete message:', err.data?.error || err.message);}}}
     say({text: `Deleted ${deleted} message(s).`,thread_ts: message.ts});return;

  };
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
app.message(async ({ message, say }) => {
  if (message.user && message.channel === TARGET_CHANNEL) {
    const entry = handleNotionUpdate(message, message.user);
    if (entry) {
      await say({
        text: `Cool Update! It has been saved. :yay:`,
        thread_ts: message.ts
      });
    }
  }
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