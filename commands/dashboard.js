import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('대시보드')
    .setDescription('알림 설정을 시작합니다.');

export async function execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('알림설정')  // 여기 수정
            .setLabel('설정')
            .setStyle(ButtonStyle.Primary)
    );

    // 기존 메시지를 수정하는 방식
    const message = await interaction.reply({
        content: '🔧 대시보드 설정 메뉴',
        components: [row],
        flags: 0  // 비공개 메시지가 아닌 일반 메시지
    });

    // 메시지 ID 저장
    interaction.client.dashboardMessageId = message.id;

    console.log('✅ 대시보드 메시지 전송 성공:', message.id);
}
