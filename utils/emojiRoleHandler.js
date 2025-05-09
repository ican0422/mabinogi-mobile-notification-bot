export async function handleReaction(reaction, user, client, isAdd = true) {
    try {
        const { message, emoji } = reaction;
        const { reactionRoleMessageId, reactionRoleRoleId } = client;

        // 메시지 ID와 이모지 이름이 일치하는지 확인
        if (message.id === reactionRoleMessageId && emoji.name === '▶️') {
            const guild = message.guild;
            const member = await guild.members.fetch(user.id);

            if (isAdd) {
                await member.roles.add(reactionRoleRoleId);
                console.log(`✅ 역할 부여 완료: ${user.username}`);
            } else {
                await member.roles.remove(reactionRoleRoleId);
                console.log(`🗑️ 역할 제거 완료: ${user.username}`);
            }
        }

    } catch (error) {
        console.error(`📛 역할 ${isAdd ? '부여' : '제거'} 중 오류 발생:`, error);
    }
}
