// commands/dashboard.js
import { SlashCommandBuilder, ButtonStyle } from 'discord.js';
import { createButtonRow } from '../utils/messageComponents.js';

export const data = new SlashCommandBuilder()
    .setName('대시보드')
    .setDescription('알림 설정을 시작합니다.');

export async function execute(interaction) {
    try {
        // 가로로 버튼 배치
        const buttonRow = createButtonRow([
            { customId: '알림설정', label: '알림 설정', style: ButtonStyle.Primary },
            { customId: '결계알림채널', label: '결계 알림 채널', style: ButtonStyle.Secondary }
        ]);

        await interaction.reply({
            content: '🔧 대시보드 설정 메뉴',
            components: [buttonRow],
            flags: 0  // 수정 가능 여부에 따라 설정
        });

        console.log('✅ 대시보드 메시지 전송 성공');
    } catch (error) {
        console.error('📛 대시보드 메시지 전송 중 오류 발생:', error);
    }
}
