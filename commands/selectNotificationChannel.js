import { SlashCommandBuilder, ChannelType, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('알림채널선택')
    .setDescription('알림을 받을 채널을 선택합니다.');

export async function execute(interaction) {
    const channels = interaction.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
    const options = channels.map(channel => ({
        label: channel.name,
        value: channel.id
    }));

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('notification_channel')
            .setPlaceholder('알림을 받을 채널을 선택하세요')
            .addOptions(options)
    );

    await interaction.reply({
        content: '📢 알림 채널 선택 메뉴',
        components: [row],
        flags: MessageFlags.Ephemeral
    });
}
