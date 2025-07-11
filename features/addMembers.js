async function handleAddMembers(client, event, Q) {
  console.log(event)
  const match = Q.match(/add (\d+) members of #([\w-]+) (here|to #([\w-]+))/i);
  if (!match) {
    return 'Usage: add x members of #channel here/to #channel';
  }

  const numMembersToAdd = parseInt(match[1], 10);
  const sourceChannelName = match[2];
  const targetChannelName = match[4] || event.channel;

  try {
    const sourceChannel = await getChannelByName(client, sourceChannelName);
    const targetChannel = targetChannelName === event.channel
      ? { id: event.channel }
      : await getChannelByName(client, targetChannelName.replace('#', ''));

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

    const userInfos = await Promise.all(
      members.members.map(id => client.users.info({ user: id }).catch(() => null))
    );

    const realHumanMembers = userInfos
      .filter(u => u && u.user && !u.user.is_bot && u.user.id !== 'USLACKBOT')
      .map(u => u.user.id);

    if (realHumanMembers.length < numMembersToAdd) {
      return `Not enough eligible members in #${sourceChannelName} to select ${numMembersToAdd}.`;
    }

    const selectedUserIds = [];
    while (selectedUserIds.length < numMembersToAdd) {
      const randomId = realHumanMembers[Math.floor(Math.random() * realHumanMembers.length)];
      if (!selectedUserIds.includes(randomId)) {
        selectedUserIds.push(randomId);
      }
    }

    try {
      await client.conversations.invite({
        channel: targetChannel.id,
        users: selectedUserIds.join(',')
      });
    } catch (err) {
      if (err.data && err.data.error === 'already_in_channel') {
        return `Some users are already in the target channel.`;
      } else if (err.data && err.data.error === 'restricted_action') {
        return `Cannot invite one or more users due to restrictions.`;
      } else {
        console.error('Invite error:', err);
        return `Something went wrong while inviting users.`;
      }
    }

const mentions = selectedUserIds.map(id => `<@${id}>`).join(', ');
return `Added ${mentions} to #${targetChannelName.replace('#', '')}.`;

  } catch (error) {
    console.error('Error adding members:', error);
    return 'Huh? Something broke. Hey <@U083T3ZP6AV>, fix this!';
  }
}

async function getChannelByName(client, channelName) {
  const result = await client.conversations.list({ limit: 1000 });
  return result.channels.find(ch => ch.name === channelName.replace('#', ''));
}

module.exports = { handleAddMembers };
// not working yet i will see a work around for this hopeflly soon