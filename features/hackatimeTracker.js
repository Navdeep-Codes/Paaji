const axios = require('axios');

let lastHourCount = 0;

async function checkHackatimeAndNotify(client) {
  try {
    const response = await axios.get(
      'https://hackatime.hackclub.com/api/hackatime/v1/users/current/statusbar/today',
      {
        headers: {
          'Authorization': `Bearer ${process.env.HACKATIMEAPI}`
        }
      }
    );

    const data = response.data;
    const totalSeconds = data.data.grand_total.total_seconds;
    const timeText = data.data.grand_total.text;
    
    console.log(`Hackatime check: ${timeText} (${totalSeconds} seconds)`);
    
    const currentHourCount = Math.floor(totalSeconds / 3600);
    
    if (currentHourCount > lastHourCount && currentHourCount > 0) {
      await sendHourNotification(client, currentHourCount, timeText);
      lastHourCount = currentHourCount;
    }
    
  } catch (error) {
    console.error('Hackatime tracking error:', error.response?.data || error.message);
  }
}

async function sendHourNotification(client, hours, timeText) {
  try {
    const channelId = process.env.HACKATIME_CHANNEL_ID || 'C08JRG8VCBY'; 
    
    const message = hours === 1 
      ? `<@U083T3ZP6AV> Gud boy! You coded an hour today :yay: , hoping you code more! (${timeText})`
      : `<@U083T3ZP6AV> Gud Gud boy! you get a :max_waffle: as you've coded for ${hours} hours today, hoping you code more! (${timeText})`;

    await client.chat.postMessage({
      channel: channelId,
      text: message
    });
    
    
    
  } catch (error) {
    console.error('Error sending hour message:', error);
  }
}

function startHackatimeTracking(client) {
  console.log('Starting Hackatime tracking...');
  
  const interval = setInterval(async () => {
    await checkHackatimeAndNotify(client);
  }, 300000);
  
  checkHackatimeAndNotify(client);
  
  return interval;
}

function stopHackatimeTracking(interval) {
  if (interval) {
    clearInterval(interval);
    console.log('Hackatime tracking stopped');
  }
}

function resetDailyTracking() {
  lastHourCount = 0;
  console.log('Daily Hackatime tracking reset');
}

module.exports = { 
  startHackatimeTracking, 
  stopHackatimeTracking, 
  checkHackatimeAndNotify,
  resetDailyTracking
};