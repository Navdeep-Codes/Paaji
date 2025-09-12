const { isUserInSlackList } = require('../utils/slackHelpers');

function setupChannelLeaveManager(app, channelId, userGroupId, notifyChannelId) {
  app.event('member_left_channel', async ({ event, client }) => {
    if (event.channel !== channelId) return;

    const isAllowed = await isUserInSlackList(client, event.user, userGroupId);

    if (isAllowed) {
      await client.chat.postMessage({
        channel: notifyChannelId,
        text: `<@${event.user}> has left the channel! BYEE!`
      });
    } else {
      try {
        await client.conversations.invite({
          channel: channelId,
          users: event.user
        });
        await client.chat.postMessage({
        channel: notifyChannelId,
        text: `<@${event.user}> please use <https://slack.com/shortcuts/Ft09EXF6Q2V8/a0cd6b1f45f019900551867c029d44d5|this shortcut> to leave the channel properly.`
      });
      } catch (err) {
        console.error('Failed to re-add user:', err.data?.error || err.message);
      }
    }
  });
}

module.exports = { setupChannelLeaveManager };