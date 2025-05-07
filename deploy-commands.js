import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const commands = [];
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`file://${path.join(commandsPath, file)}`);
    if (command.data && typeof command.data.toJSON === 'function') {
        commands.push(command.data.toJSON());
        console.log(`✅ 명령어 로드 성공: ${command.data.name}`);
    } else {
        console.warn(`⚠️ 명령어 로드 실패 (toJSON 메서드 없음): ${file}`);
    }
}

client.once('ready', async () => {
    try {
        console.log('🔄 명령어 등록 중...');

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        const applicationId = client.user.id;

        const guilds = client.guilds.cache.map(guild => guild.id);

        for (const guildId of guilds) {
            await rest.put(
                Routes.applicationGuildCommands(applicationId, guildId),
                { body: commands }
            );
            console.log(`✅ 명령어가 성공적으로 ${guildId} 서버에 등록되었습니다.`);
        }

        console.log('🎉 모든 서버에 명령어 등록이 완료되었습니다.');
    } catch (error) {
        console.error(`⚠️ 명령어 등록 중 오류 발생: ${error}`);
    } finally {
        client.destroy();
    }
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);
