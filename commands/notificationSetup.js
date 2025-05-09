import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('알림설정')
    .setDescription('알림 설정을 시작합니다.');

export async function execute(interaction) {
    try {
        // 1️⃣ 알림 채널 선택 메뉴
        const channels = interaction.guild.channels.cache.filter(channel => channel.isTextBased());
        const channelOptions = channels.map(channel => ({
            label: channel.name,
            value: channel.id
        }));

        // 2️⃣ 역할 선택 메뉴
        const roles = interaction.guild.roles.cache.filter(role => !role.managed);
        const roleOptions = roles.map(role => ({
            label: role.name,
            value: role.id
        }));

        // 3️⃣ 컴포넌트 생성
        const row1 = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('알림_채널_선택')
                .setPlaceholder('🔔 알림을 보낼 채널을 선택하세요')
                .addOptions(channelOptions)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('알림_역할_선택')
                .setPlaceholder('👥 역할을 선택하세요')
                .addOptions(roleOptions)
        );

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('알림_설정_완료')
                .setLabel('설정 완료')
                .setStyle(ButtonStyle.Success)
        );

        // ⚠️ 상호작용 응답 (초기 3초 타임아웃 방지)
        await interaction.deferReply({ ephemeral: false });

        // 기존 메시지 수정
        await interaction.editReply({
            content: '🔧 알림 설정을 시작합니다.',
            components: [row1, row2, row3]
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
