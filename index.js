import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, Events, ButtonStyle, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendAlertMessage } from './utils/sendReactionRoleMessage.js';
import { createChannelSelectMenu, createRoleSelectMenu, createButtonRow } from './utils/messageComponents.js';

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

// 📂 명령어 파일 로딩
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

// 🟢 봇 준비 완료 이벤트
client.once(Events.ClientReady, () => {
    console.log(`✅ 봇이 준비되었습니다 - ${client.user.tag}`);
});

// 📣 상호작용 이벤트 처리
client.on(Events.InteractionCreate, async interaction => {
    try {
        // 📝 슬래시 명령어 처리
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (command) {
                console.log(`⚙️ 명령어 실행됨: ${interaction.commandName}`);
                await command.execute(interaction);
            }
        }

        // 🔘 버튼 상호작용 처리
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

        // 📑 선택 메뉴 상호작용 처리
        if (interaction.isStringSelectMenu()) {
            const { customId, values } = interaction;

            if (customId === '알림_채널_선택') {
                client.selectedChannelId = values[0];
                await interaction.reply({
                    content: `📢 선택된 알림 채널: <#${values[0]}>`,
                    flags: MessageFlags.Ephemeral
                });
            }

            if (customId === '알림_역할_선택') {
                client.selectedRoleId = values[0];
                await interaction.reply({
                    content: `👥 선택된 역할: <@&${values[0]}>`,
                    flags: MessageFlags.Ephemeral
                });
            }

            if (customId === '결계_알림_채널_선택') {
                const selectedChannelId = values[0];
                client.selectedAlertChannelId = selectedChannelId;

                // 기존 타이머 정리
                if (client.alertTimers[selectedChannelId]) {
                    clearInterval(client.alertTimers[selectedChannelId]);
                    console.log(`🛑 기존 결계 알림 타이머 중지: ${selectedChannelId}`);
                }

                // 🕰️ 결계 알림 타이머 설정 (1분 간격 체크)
                client.alertTimers[selectedChannelId] = setInterval(async () => {
                    try {
                        const now = new Date();
                        const hours = now.getHours();
                        const minutes = now.getMinutes();
                        const alertTimes = [23, 2, 5, 8, 11, 14, 17, 20];

                        if (alertTimes.includes(hours) && minutes === 55) {
                            const channel = await client.channels.fetch(selectedChannelId);
                            if (channel.isTextBased()) {
                                const nextHour = (hours + 1) % 24;
                                const period = nextHour >= 12 ? 'PM' : 'AM';
                                const displayHour = nextHour % 12 === 0 ? 12 : nextHour % 12;
                                await channel.send(`🛡️ **결계 알림** - ${displayHour}:00 ${period}에 결계가 열립니다! 준비하세요.`);
                                console.log(`✅ 결계 알림 전송: ${selectedChannelId} (${displayHour}:00 ${period})`);
                            }
                        }
                    } catch (error) {
                        console.error('📛 결계 알림 타이머 오류:', error);
                    }
                }, 60000);

                await interaction.reply({
                    content: `✅ 선택된 결계 알림 채널: <#${selectedChannelId}>`,
                    flags: MessageFlags.Ephemeral
                });

                console.log(`✅ 결계 알림 채널 설정 완료: ${selectedChannelId}`);
            }
        }

    } catch (error) {
        console.error('📛 상호작용 처리 중 오류 발생:', error);
    }
});

// 🆕 이모지 반응 추가 처리
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
        const { message, emoji } = reaction;
        const { reactionRoleMessageId, reactionRoleRoleId } = client;

        if (message.id === reactionRoleMessageId && emoji.name === '▶️') {
            const member = await message.guild.members.fetch(user.id);
            await member.roles.add(reactionRoleRoleId);
            console.log(`✅ 역할 부여 완료: ${user.username}`);
        }
    } catch (error) {
        console.error('📛 역할 부여 중 오류 발생:', error);
    }
});

// 🆕 이모지 반응 제거 처리
client.on(Events.MessageReactionRemove, async (reaction, user) => {
    try {
        const { message, emoji } = reaction;
        const { reactionRoleMessageId, reactionRoleRoleId } = client;

        if (message.id === reactionRoleMessageId && emoji.name === '▶️') {
            const member = await message.guild.members.fetch(user.id);
            await member.roles.remove(reactionRoleRoleId);
            console.log(`🗑️ 역할 제거 완료: ${user.username}`);
        }
    } catch (error) {
        console.error('📛 역할 제거 중 오류 발생:', error);
    }
});

// 🔑 봇 로그인
client.login(process.env.DISCORD_TOKEN);
