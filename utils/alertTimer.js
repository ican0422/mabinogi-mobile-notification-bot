export function startAlertTimer(client, newChannelId) {
    // 기존 알림 채널이 있는 경우 중지
    const previousChannelId = client.currentAlertChannelId;
    if (previousChannelId && previousChannelId !== newChannelId) {
        clearInterval(client.alertTimers[previousChannelId]);
        delete client.alertTimers[previousChannelId];
        console.log(`🛑 기존 타이머 중지: ${previousChannelId}`);
    }

    // 새로운 채널을 현재 알림 채널로 설정
    client.currentAlertChannelId = newChannelId;

    // 정확한 분 단위 보정
    const setExactInterval = (callback, interval) => {
        const start = Date.now();
        const tick = () => {
            const now = Date.now();
            const drift = now - (start + Math.floor((now - start) / interval) * interval);
            setTimeout(tick, interval - drift);
            callback();
        };
        setTimeout(tick, interval);
    };

    // 새로운 타이머 시작
    client.alertTimers[newChannelId] = setExactInterval(async () => {
        try {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            // 정기 알림 (매 3시간, 5분 전)
            const alertHours = [0, 3, 6, 9, 12, 15, 18, 21];
            const nextHour = (hours + 1) % 24;

            if (alertHours.includes(nextHour) && minutes === 55) {
                const channel = await client.channels.fetch(newChannelId).catch(() => null);
                
                // 채널이 삭제된 경우 타이머 정리
                if (!channel || !channel.isTextBased()) {
                    clearInterval(client.alertTimers[newChannelId]);
                    delete client.alertTimers[newChannelId];
                    delete client.currentAlertChannelId;
                    console.log(`🛑 채널 삭제로 타이머 중지: ${newChannelId}`);
                    return;
                }

                // 알림 메시지 전송
                const displayHour = nextHour % 12 === 0 ? 12 : nextHour % 12;
                const period = nextHour >= 12 ? 'PM' : 'AM';
                
                const message = await channel.send(`🛡️ **결계 알림** - ${displayHour}:00 ${period}에 결계가 열립니다! 준비하세요.`);
                console.log(`✅ 결계 알림 전송: ${newChannelId} (${displayHour}:00 ${period})`);

                // 10분 후 메시지 삭제
                setTimeout(async () => {
                    try {
                        await message.delete();
                        console.log(`🗑️ 알림 메시지 삭제 완료: ${message.id}`);
                    } catch (deleteError) {
                        console.error(`📛 메시지 삭제 오류 (${message.id}):`, deleteError);
                    }
                }, 10 * 60 * 1000); // 10분 (600,000ms)
            }

            // // 테스트 알림
            // if (hours === 4 && minutes === 34) {
            //     const channel = await client.channels.fetch(newChannelId).catch(() => null);
                
            //     if (channel && channel.isTextBased()) {
            //         const testMessage = await channel.send(`🛠️ **테스트 알림** - 지금은 4시 20분입니다!`);
            //         console.log(`✅ 테스트 알림 전송: ${newChannelId} (4:20 AM)`);

            //         // 10분 후 메시지 삭제
            //         setTimeout(async () => {
            //             try {
            //                 await testMessage.delete();
            //                 console.log(`🗑️ 테스트 메시지 삭제 완료: ${testMessage.id}`);
            //             } catch (deleteError) {
            //                 console.error(`📛 테스트 메시지 삭제 오류 (${testMessage.id}):`, deleteError);
            //             }
            //         }, 10 * 60 * 1000); // 10분 (600,000ms)
            //     }
            // }

        } catch (error) {
            console.error(`📛 알림 오류 (${newChannelId}):`, error);
        }
    }, 60000);

    console.log(`✅ 새로운 타이머 시작: ${newChannelId}`);
}
