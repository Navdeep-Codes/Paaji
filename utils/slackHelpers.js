async function getThreadContext(client, channel, threadTs) {
  try {
    const result = await client.conversations.replies({
      channel: channel,
      ts: threadTs,
      limit: 50
    });
    
    return result.messages || [];
  } catch (error) {
    console.error('Error fetching thread context:', error);
    return [];
  }
}

async function isUserInSlackList(client, userId, userGroupId) {
  try {
    const res = await client.usergroups.users.list({ usergroup: userGroupId });
    return res.users && res.users.includes(userId);
  } catch (err) {
    console.error('Error checking Slack list:', err.data?.error || err.message);
    return false;
  }
}

module.exports = { getThreadContext, isUserInSlackList };