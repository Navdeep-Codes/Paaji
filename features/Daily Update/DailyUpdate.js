const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const DATA_FILE = path.join(__dirname, 'daily_updates.json');
const TARGET_USER = 'U083T3ZP6AV'; 
function scheduleDailyPrompt(app, channelId) {
  cron.schedule('0 18 * * *', async () => {
    await app.client.chat.postMessage({
      channel: channelId,
      text: `<@${TARGET_USER}> How was your day?`
    });
  }, { timezone: "Asia/Kolkata" }); 
}

function handleNotionUpdate(message, user) {
  if (user !== TARGET_USER) return null;
  const regex = /Today I did:\s*([\s\S]*?)\nMy mood was pretty ([^\n]+)\nTommorrows goals:\s*([\s\S]*?)\nEnergy Level\s*:\s*(\d+)/i;
  const match = message.text.match(regex);
  if (!match) return null;

  const todayDid = match[1].trim().split('\n').map(s => s.replace(/^- /, '').trim());
  const mood = match[2].trim();
  const goals = match[3].trim().split('\n').map(s => s.replace(/^- /, '').trim());
  const energy = parseInt(match[4], 10);

  const entry = {
    date: new Date().toISOString().slice(0, 10),
    todayDid,
    mood,
    goals,
    energy
  };

  let data = [];
  if (fs.existsSync(DATA_FILE)) {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  data.push(entry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return entry;
}

module.exports = { scheduleDailyPrompt, handleNotionUpdate };