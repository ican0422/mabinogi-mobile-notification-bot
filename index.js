import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, Events, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendAlertMessage } from './utils/sendReactionRoleMessage.js';
import { createChannelSelectMenu } from './utils/messageComponents.js';
import { handleReaction } from './utils/emojiRoleHandler.js';
import { startAlertTimer } from './utils/alertTimer.js';  // 분리된 알림 타이머

// __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 클라이언트 초기화
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ],
    partials: ['MESSAGE', 'REACTION', 'USER']
});

client.commands = new Collection();
client.alertTimers = {};
client.currentAlertChannelId = null;
client.selectedChannelId = null;
client.selectedRoleId = null;

// 명령어 파일 로딩
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`✅ 명령어 로드됨: ${command.data.name}`);
    }
}

// 봇 준비 완료 이벤트
client.once(Events.ClientReady, () => {
    console.log(`✅ 봇이 준비되었습니다 - ${client.user.tag}`);
});

// 상호작용 이벤트 처리
client.on(Events.InteractionCreate, async interaction => {
    try {
        // 슬래시 명령어 처리
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (command) {
                console.log(`⚙️ 명령어 실행됨: ${interaction.commandName}`);
                await command.execute(interaction);
            }
        }

        // 버튼 상호작용 처리
        if (interaction.isButton()) {
            const { customId } = interaction;
            console.log(`🔘 버튼 눌림: ${customId}`);

            if (customId === '알림설정') {
                const command = client.commands.get('알림설정');
                if (command) await command.execute(interaction);
            }

            if (customId === '결계알림채널') {
                const channels = interaction.guild.channels.cache.filter(channel => channel.isTextBased());
                const channelMenu = createChannelSelectMenu(channels, '결계_알림_채널_선택', '결계 알림을 보낼 채널을 선택하세요');

                await interaction.reply({
                    content: '🔔 결계 알림 채널을 선택하세요',
                    components: [channelMenu],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (customId === '알림_설정_완료') {
                const selectedChannelId = client.selectedChannelId;
                const selectedRoleId = client.selectedRoleId;

                if (!selectedChannelId || !selectedRoleId) {
                    await interaction.reply({
                        content: '⚠️ 채널 또는 역할이 선택되지 않았습니다.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                await sendAlertMessage(selectedChannelId, selectedRoleId, client);

                await interaction.update({
                    content: '✅ 알림 설정이 완료되었습니다.',
                    components: []
                });

                console.log(`✅ 알림 메시지 전송 완료: 채널(${selectedChannelId}), 역할(${selectedRoleId})`);
            }
        }

        // 선택 메뉴 상호작용 처리
        if (interaction.isStringSelectMenu()) {
            const { customId, values } = interaction;
            
            // 알림 설정 (채널)
            if (interaction.customId === '알림_채널_선택') {
                // 클라이언트 전역으로 채널 ID 저장
                client.selectedChannelId = interaction.values[0];

                await interaction.reply({
                    content: `📢 선택된 알림 채널: <#${interaction.values[0]}>`,
                    ephemeral: true
                });
            }

            // 알림 설정 (역할)
            if (interaction.customId === '알림_역할_선택') {
                // 클라이언트 전역으로 역할 ID 저장
                client.selectedRoleId = interaction.values[0];

                await interaction.reply({
                    content: `👥 선택된 역할: <@&${interaction.values[0]}>`,
                    ephemeral: true
                });
            }

            // 결계 알림 채널 선택
            if (customId === '결계_알림_채널_선택') {
                const selectedAlertChannelId = values[0];
                client.selectedAlertChannelId = selectedAlertChannelId;
                
                // 결계 알림 타이머 시작 (코드 분리)
                startAlertTimer(client, selectedAlertChannelId);

                await interaction.update({
                    content: `🛡️ 선택된 결계 알림 채널: <#${client.selectedAlertChannelId}>`,
                    components: [],
                    flags: MessageFlags.Ephemeral
                });

                console.log(`✅ 결계 알림 채널 설정 완료: ${client.selectedAlertChannelId}`);
            }
        }

    } catch (error) {
        console.error('📛 상호작용 처리 중 오류 발생:', error);
    }
});

// 이모지 반응 추가 및 제거 처리
client.on(Events.MessageReactionAdd, (reaction, user) => handleReaction(reaction, user, client, true));
client.on(Events.MessageReactionRemove, (reaction, user) => handleReaction(reaction, user, client, false));

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);
