import { SlashCommandBuilder, ButtonStyle } from 'discord.js';
import { createChannelSelectMenu, createRoleSelectMenu, createButtonRow } from '../utils/messageComponents.js';

export const data = new SlashCommandBuilder()
    .setName('알림설정')
    .setDescription('알림 설정을 시작합니다.');

export async function execute(interaction) {
    try {
        const channels = interaction.guild.channels.cache.filter(channel => channel.isTextBased());
        const roles = interaction.guild.roles.cache.filter(role => !role.managed);

        const channelMenu = createChannelSelectMenu(channels, '알림_채널_선택', '🔔 알림을 보낼 채널을 선택하세요');
        const roleMenu = createRoleSelectMenu(roles, '알림_역할_선택', '👥 역할을 선택하세요');
        
        // 버튼 그룹 생성 (가로 정렬)
        const buttonRow = createButtonRow([
            { customId: '알림_설정_완료', label: '설정 완료', style: ButtonStyle.Success }
        ]);

        await interaction.deferReply({ ephemeral: true });

        await interaction.editReply({
            content: '🔧 알림 설정을 시작합니다.',
            components: [channelMenu, roleMenu, buttonRow]
        });

        console.log('✅ 알림 설정 메뉴 전송 성공');
    } catch (error) {
        console.error('📛 설정 중 오류 발생:', error);
        try {
            await interaction.followUp({
                content: '⚠️ 설정 중 오류가 발생했습니다.',
                ephemeral: true
            });
        } catch (followUpError) {
            console.error('📛 설정 후속 오류:', followUpError);
        }
    }
}