import React, { useState } from "react";

import useWebSocket from "@hooks/useWebSocket.tsx";
import usePeerConnection from "@hooks/usePeerConnection.tsx";
import useNegotiation from "@hooks/useNegotiation.tsx";

const UseStartConnection = (
    videoRef: React.RefObject<HTMLVideoElement>,
    audioDeviceId: string | undefined,
    videoDeviceId: string | undefined
) => {
    const socket = useWebSocket("ws://localhost:8080/webrtc");
    const { pc } = usePeerConnection({ videoRef: videoRef });
    const { negotiate } = useNegotiation({
        pc: pc,
        websocket: socket,
    });

    const [pause, setPause] = useState<boolean>(false);

    // Хук инициализирует всю логику для создания вебртс соединения
    const start = async () => {
        try {
            const constraints = {
                audio: audioDeviceId
                    ? { deviceId: { exact: audioDeviceId } }
                    : true,
                video: videoDeviceId
                    ? { deviceId: { exact: videoDeviceId } }
                    : true,
            };

            if (pc) {
                const stream =
                    await navigator.mediaDevices.getUserMedia(constraints);

                stream.getTracks().forEach((track) => {
                    pc.addTrack(track, stream);
                });

                // Если изначально передача вебртс не ставилась на паузу
                // то используется хук для начала переговоров между беком и фронтом.
                // Если вебртс останавливался паузой, то для возобновления переговоры
                // не нужны.
                if (!pause) {
                    negotiate();
                }

                // Включаем отправку медиа-треков, не зависимо от того
                // первичная ли инициализация вебртс или возобновление вебртс
                pc?.getSenders().forEach((sender) => {
                    const parameters = sender.getParameters();
                    parameters.encodings[0].active = true;
                    sender.setParameters(parameters);
                });

                setPause(false);
            }
        } catch (err) {
            console.error("Could not acquire media:", err);
        }
    };

    // Хук останавливает передачу медиа-треков по вебртс соединению
    const stop = () => {
        try {
            // Отключаем отправку медиа-треков
            pc?.getSenders().forEach((sender) => {
                const parameters = sender.getParameters();
                parameters.encodings[0].active = false;
                sender.setParameters(parameters);
            });

            setPause(true);
        } catch (error) {
            console.error(error);
        }
    };

    return { start, stop };
};

export default UseStartConnection;
