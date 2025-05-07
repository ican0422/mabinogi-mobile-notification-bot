import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();

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
            if (interaction.customId === '알림설정') {
                console.log('🟢 설정 버튼 눌림');
                const command = client.commands.get('알림설정');
                if (command) {
                    await command.execute(interaction);
                } else {
                    console.error('❌ 알림설정 명령어를 찾을 수 없습니다.');
                }
            }

            if (interaction.customId === '알림_설정_완료') {
                console.log('🔵 설정 완료 버튼 눌림');
                await interaction.update({
                    content: '✅ 설정이 완료되었습니다.',
                    components: [],
                    flags: 0  // 비공개 메시지가 아닌 일반 메시지
                });
            }
        }

        // 선택 메뉴 상호작용 처리
        if (interaction.isStringSelectMenu()) {
            const customId = interaction.customId;

            if (customId === '알림_채널_선택') {
                console.log('🔔 알림 채널 선택됨:', interaction.values);
                await interaction.reply({
                    content: `📢 선택된 알림 채널: <#${interaction.values[0]}>`,
                    ephemeral: true
                });
            }

            if (customId === '알림_종류_선택') {
                console.log('🛡️ 알림 종류 선택됨:', interaction.values);
                await interaction.reply({
                    content: `🛡️ 선택된 알림 종류: ${interaction.values[0]}`,
                    ephemeral: true
                });
            }

            if (customId === '알림_역할_선택') {
                console.log('👥 역할 선택됨:', interaction.values);
                await interaction.reply({
                    content: `👥 선택된 역할: <@&${interaction.values[0]}>`,
                    ephemeral: true
                });
            }
        }

    } catch (error) {
        console.error('📛 상호작용 처리 중 오류 발생:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
