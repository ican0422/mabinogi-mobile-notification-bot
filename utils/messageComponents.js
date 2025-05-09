import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// ✅ 버튼 그룹 생성 함수 (가로 배치 지원)
export function createButtonRow(buttonConfigs) {
    const row = new ActionRowBuilder();
    buttonConfigs.forEach(config => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(config.customId)
                .setLabel(config.label)
                .setStyle(config.style || ButtonStyle.Primary)
        );
    });
    return row;
}

// 📑 채널 선택 메뉴 생성
export function createChannelSelectMenu(channels, customId, placeholder) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .addOptions(channels.map(channel => ({
                label: channel.name,
                value: channel.id
            })))
    );
}

// 📑 역할 선택 메뉴 생성
export function createRoleSelectMenu(roles, customId, placeholder) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .addOptions(roles.map(role => ({
                label: role.name,
                value: role.id
            })))
    );
}
