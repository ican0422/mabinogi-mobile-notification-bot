export async function sendAlertMessage(channelId, roleId, client) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) throw new Error('유효하지 않은 채널입니다.');

        // 메시지 전송
        const message = await channel.send({
            content: `🛡️ <@&${roleId}> 알림을 받으려면 아래 이모지로 반응해주세요.\n\n▶️ : 결계 알림 받기`
        });

        // 메시지에 이모지 추가
        await message.react('▶️');

        // 메시지 ID 저장 (이모지 반응 로직을 위해)
        client.reactionRoleMessageId = message.id;
        client.reactionRoleChannelId = channelId;
        client.reactionRoleRoleId = roleId;

        console.log('✅ 결계 알림 메시지 전송 성공:', message.id);

    } catch (error) {
        console.error('📛 결계 알림 메시지 전송 중 오류 발생:', error);
    }
}
