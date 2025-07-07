async function handleAddMembers(client, event, Q) {
  const match = Q.match(/add (\d+) members of #([\w-]+) (here|to #([\w-]+))/i);
  if (!match) {
    return 'use : add x members of #channel here/to #channeltoaddmembers';
  }

  const numMembersToAdd = parseInt(match[1], 10);
  const sourceChannelName = match[2];
  const targetChannelName = match[4] || event.channel;

  try {
    const sourceChannel = await getChannelByName(client, sourceChannelName);
    const targetChannel = targetChannelName === event.channel
      ? { id: event.channel }
      : await getChannelByName(client, targetChannelName);

    if (!sourceChannel) {
      return `Source channel #${sourceChannelName} not found.`;
    }

    if (!targetChannel) {
      return `Target channel #${targetChannelName} not found.`;
    }

    const members = await client.conversations.members({ channel: sourceChannel.id });
    if (!members.members || members.members.length === 0) {
      return `No members found in #${sourceChannelName}.`;
    }

    const availableMembers = members.members;
    if (availableMembers.length < numMembersToAdd) {
      return `Not enough members in #${sourceChannelName} to add. Only ${availableMembers.length} available.`;
    }

    const selectedMembers = [];
    while (selectedMembers.length < numMembersToAdd) {
      const randomMember = availableMembers[Math.floor(Math.random() * availableMembers.length)];
      if (!selectedMembers.includes(randomMember)) {
        selectedMembers.push(randomMember);
      }
    }

    for (const member of selectedMembers) {
      await client.conversations.invite({
        channel: targetChannel.id,
        users: member
      });
    }

    return `Kidnapped ${numMembersToAdd} people from #${sourceChannelName} to #${targetChannelName}.`;
  } catch (error) {
    console.error('Error adding members:', error);
    return 'Huh why dis aint working? Aye <@U083T3ZP6AV> bro, I think you broke something go fix it!';
  }
}

async function getChannelByName(client, channelName) {
  const result = await client.conversations.list({ limit: 1000 });
  return result.channels.find(ch => ch.name === channelName.replace('#', ''));
}

module.exports = { handleAddMembers };
// not working yet i will see a work around for this