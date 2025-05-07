import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('대시보드')
    .setDescription('대시보드 설정 메뉴를 엽니다.');

export async function execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('select_notification_channel')
            .setLabel('알림 채널 선택')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('select_notification_role')
            .setLabel('알림 역할 선택')
            .setStyle(ButtonStyle.Secondary)
    );

    const message = await interaction.reply({
        content: '🔧 대시보드 설정 메뉴',
        components: [row],
        fetchReply: true
    });

    // 메시지 ID를 캐시에 저장
    interaction.client.dashboardMessageId = message.id;
}
