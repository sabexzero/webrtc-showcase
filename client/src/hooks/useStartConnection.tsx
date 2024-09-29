import React from "react";
import useWebSocket from "./useWebSocket.tsx";
import usePeerConnection from "./usePeerConnection.tsx";
import useNegotiation from "./useNegotiation.tsx";

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

                negotiate();
            }
        } catch (err) {
            console.error("Could not acquire media:", err);
        }
    };

    const stop = () => {
        try {
            pc?.getSenders().forEach((sender) => {
                sender.track?.stop();
            });
        } catch (error) {
            console.error(error);
        }
    };

    return { start, stop };
};

export default UseStartConnection;
