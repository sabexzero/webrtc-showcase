import React, { useEffect, useRef, useState } from "react";

import useStartConnection from "@hooks/useStartConnection.tsx";

import StyledStartButton from "@components/StyledStartButton.tsx";
import Options from "@components/Options/Options.tsx";
import Logs from "@components/Logs/Logs.tsx";

const MainPage: React.FC = () => {
    const videoRef = useRef(null);
    const [state, toggleState] = useState<boolean>(false);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDeviceId, setVideoDeviceId] = useState<string | undefined>(
        undefined
    );
    const [audioDeviceId, setAudioDeviceId] = useState<string | undefined>(
        undefined
    );

    const { start, stop } = useStartConnection(
        videoRef,
        audioDeviceId,
        videoDeviceId
    );

    useEffect(() => {
        if (videoRef.current) {
            const videoElement = videoRef.current;
            console.log("Video element:", videoElement);
        }
    }, [videoRef]);

    useEffect(() => {
        const getDevices = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true,
                });

                let deviceInfos =
                    await navigator.mediaDevices.enumerateDevices();

                deviceInfos = deviceInfos.filter(
                    (device) => !device.label.includes("Monitor")
                );

                setDevices(deviceInfos);

                stream.getTracks().forEach((track) => track.stop());
            } catch (error) {
                console.error("Ошибка при получении устройств:", error);
            }
        };

        getDevices();
    }, []);

    return (
        <div className="container mx-auto min-h-screen jetbrains-mono flex flex-row gap-12">
            <div className="w-fit">
                <div className="flex flex-row">
                    <Options
                        setAudioDeviceId={setAudioDeviceId}
                        setVideoDeviceId={setVideoDeviceId}
                        devices={devices}
                    />
                </div>

                <div className="py-4">
                    <StyledStartButton
                        state={state}
                        toggleState={toggleState}
                        start={start}
                        stop={stop}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-4 w-full">
                <div
                    id="media"
                    className="flex flex-col items-center w-full pt-16"
                >
                    <audio id="audio" autoPlay />
                    <video
                        ref={videoRef}
                        id="video"
                        autoPlay
                        muted
                        playsInline
                    />
                    <h2 className="text-black">Media</h2>
                </div>

                <Logs />
            </div>
        </div>
    );
};

export default MainPage;
