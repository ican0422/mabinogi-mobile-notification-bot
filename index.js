import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, Events, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendAlertMessage } from './utils/sendReactionRoleMessage.js';

// __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 명령어 파일 로딩
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    if (command.data) {
        client.commands.set(command.data.name, command);
        console.log(`✅ 명령어 로드됨: ${command.data.name}`);
    }
}

client.once(Events.ClientReady, () => {
    console.log(`✅ 봇이 준비되었습니다 - ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    try {
        // 슬래시 명령어 처리
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            console.log(`⚙️ 명령어 실행됨: ${interaction.commandName}`);
            await command.execute(interaction);
        }

        // 버튼 상호작용 처리
        if (interaction.isButton()) {
            // 알림 설정 버튼
            if (interaction.customId === '알림설정') {
                console.log('🛡️ 알림 설정 버튼 눌림');
                const command = client.commands.get('알림설정');
                if (command) {
                    await command.execute(interaction);
                } else {
                    console.error('❌ 알림설정 명령어를 찾을 수 없습니다.');
                }
            }

            // 결계 알림 채널 버튼
            if (interaction.customId === '결계알림채널') {
                console.log('🔔 결계 알림 채널 버튼 눌림');

                // 텍스트 채널 목록 가져오기
                const channels = interaction.guild.channels.cache
                    .filter(channel => channel.isTextBased())
                    .map(channel => ({
                        label: channel.name,
                        value: channel.id
                    }));

                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('결계_알림_채널_선택')
                        .setPlaceholder('결계 알림을 보낼 채널을 선택하세요')
                        .addOptions(channels)
                );

                await interaction.reply({
                    content: '🔔 결계 알림 채널을 선택하세요',
                    components: [row],
                    ephemeral: true
                });

                console.log('✅ 결계 알림 채널 선택 메뉴 전송 성공');
            }

            // 알림 설정 완료 버튼
            if (interaction.customId === '알림_설정_완료') {
                const selectedChannelId = client.selectedChannelId;
                const selectedRoleId = client.selectedRoleId;

                if (!selectedChannelId || !selectedRoleId) {
                    await interaction.reply({
                        content: '⚠️ 채널 또는 역할이 선택되지 않았습니다.',
                        ephemeral: true
                    });
                    return;
                }

                // 🆕 여기서 sendAlertMessage 호출
                await sendAlertMessage(selectedChannelId, selectedRoleId, client);

                await interaction.update({
                    content: '✅ 알림 설정이 완료되었습니다.',
                    components: []
                });

                console.log('✅ 알림 메시지 전송 성공');
            }
        }

        // 선택 메뉴 상호작용 처리
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === '알림_채널_선택') {
                // 클라이언트 전역으로 채널 ID 저장
                client.selectedChannelId = interaction.values[0];

                await interaction.reply({
                    content: `📢 선택된 알림 채널: <#${interaction.values[0]}>`,
                    ephemeral: true
                });
            }

            if (interaction.customId === '알림_역할_선택') {
                // 클라이언트 전역으로 역할 ID 저장
                client.selectedRoleId = interaction.values[0];

                await interaction.reply({
                    content: `👥 선택된 역할: <@&${interaction.values[0]}>`,
                    ephemeral: true
                });
            }

            if (interaction.customId === '결계_알림_채널_선택') {
                const selectedChannelId = interaction.values[0];
                
                // 클라이언트 전역으로 선택된 결계 알림 채널 저장
                client.selectedAlertChannelId = selectedChannelId;

                // 기존 타이머 정리
                if (client.alertTimers[selectedChannelId]) {
                    clearInterval(client.alertTimers[selectedChannelId]);
                    console.log(`🛑 기존 결계 알림 타이머 중지: ${selectedChannelId}`);
                }

                // 결계 알림 타이머 설정
                client.alertTimers[selectedChannelId] = setInterval(async () => {
                    try {
                        const now = new Date();
                        const hours = now.getHours();
                        const minutes = now.getMinutes();

                        // 알림 시간 (5분 전)
                        const alertTimes = [23, 2, 5, 8, 11, 14, 17, 20];
                        if (alertTimes.includes(hours) && minutes === 55) {
                            const channel = await client.channels.fetch(selectedChannelId);
                            if (channel && channel.isTextBased()) {
                                const nextHour = (hours + 1) % 24;
                                const period = nextHour >= 12 ? 'PM' : 'AM';
                                const displayHour = nextHour % 12 === 0 ? 12 : nextHour % 12;

                                await channel.send(`🛡️ **결계 알림** - ${displayHour}:00 ${period}에 결계가 열립니다! 준비하세요.`);
                                console.log(`✅ 결계 알림 전송: ${selectedChannelId} (${displayHour}:00 ${period})`);
                            }
                        }
                    } catch (error) {
                        console.error('📛 주기적 메시지 전송 중 오류 발생:', error);
                    }
                }, 60000); // 60초 간격

                await interaction.reply({
                    content: `✅ 선택된 결계 알림 채널: <#${selectedChannelId}>`,
                    ephemeral: true
                });

                console.log(`✅ 결계 알림 채널 설정 완료: ${selectedChannelId}`);
            }
        }

    } catch (error) {
        console.error('📛 상호작용 처리 중 오류 발생:', error);
    }
});

// 🆕 이모지 반응 처리 (추가 및 제거)
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
        const { message, emoji } = reaction;
        const { reactionRoleMessageId, reactionRoleRoleId } = client;

        if (message.id === reactionRoleMessageId && emoji.name === '▶️') {
            const guild = message.guild;
            const member = await guild.members.fetch(user.id);
            
            // 역할 부여
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
            const guild = message.guild;
            const member = await guild.members.fetch(user.id);
            
            // 역할 제거
            await member.roles.remove(reactionRoleRoleId);
            console.log(`🗑️ 역할 제거 완료: ${user.username}`);
        }

    } catch (error) {
        console.error('📛 역할 제거 중 오류 발생:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
