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

module.exports = { getThreadContext };