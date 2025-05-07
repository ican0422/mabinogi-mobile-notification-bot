import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('알림역할선택')
    .setDescription('알림을 받을 역할을 선택합니다.');

export async function execute(interaction) {
    const roles = interaction.guild.roles.cache.filter(role => !role.managed);
    const options = roles.map(role => ({
        label: role.name,
        value: role.id
    }));

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('notification_role')
            .setPlaceholder('알림을 받을 역할을 선택하세요')
            .addOptions(options)
    );

    await interaction.reply({
        content: '🛡️ 알림 역할 선택 메뉴',
        components: [row],
        flags: MessageFlags.Ephemeral
    });
}
