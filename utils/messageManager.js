export async function updateMessage(interaction, content, components) {
    try {
        await interaction.update({
            content,
            components,
            ephemeral: true
        });
    } catch (error) {
        console.error(`⚠️ 메시지 수정 중 오류: ${error}`);
    }
}
