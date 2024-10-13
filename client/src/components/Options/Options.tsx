import React, { useState } from "react";

import Selector from "@components/Selector";
import ParamOption from "@components/Options/ParamOption";
import MediaSelector from "@components//MediaSelector.tsx";

interface OptionProps {
    devices: MediaDeviceInfo[];
    setVideoDeviceId: (id: string | undefined) => void;
    setAudioDeviceId: (id: string | undefined) => void;
}

const Options: React.FC<OptionProps> = ({
    devices,
    setVideoDeviceId,
    setAudioDeviceId,
}) => {
    const [isOptionToggled, setOptionToggle] = useState(true);

    const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
    );

    const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
    );

    const handleVideoChange = (deviceId: string) => {
        setVideoDeviceId(deviceId);
    };

    const handleAudioChange = (deviceId: string) => {
        setAudioDeviceId(deviceId);
    };

    return (
        <div className="flex flex-col gap-4 pt-4 w-fit text-left">
            <h2 className="text-3xl pt-12 text-black">
                <button
                    onClick={() => setOptionToggle((prevState) => !prevState)}
                >
                    Options ↓
                </button>
            </h2>
            {isOptionToggled && (
                <div className="flex flex-col gap-4" id="options-dropdown">
                    <ParamOption id="use-datachannel" label="Use datachannel">
                        <Selector
                            id="use-datachannel-selector"
                            values={[
                                "Ordered, reliable",
                                "Unordered, no retransmissions",
                                "Unordered, 500ms lifetime",
                            ]}
                        />
                    </ParamOption>
                    <ParamOption id="use-audio" label="Use audio">
                        <MediaSelector
                            options={audioDevices.map((device) => ({
                                label:
                                    device.label ||
                                    `Microphone ${device.deviceId}`,
                                value: device.deviceId,
                            }))}
                            onSelect={handleAudioChange}
                        />
                        <Selector
                            id="use-audio-codec"
                            defaultValue="Default codecs"
                            values={["opus/48000/2", "PCMU/8000", "PCMA/8000"]}
                        />
                    </ParamOption>
                    <ParamOption id="use-video" label="Use video">
                        <MediaSelector
                            options={videoDevices.map((device) => ({
                                label:
                                    device.label || `Camera ${device.deviceId}`,
                                value: device.deviceId,
                            }))}
                            onSelect={handleVideoChange}
                        />
                        <Selector
                            id="use-video-resolutions"
                            defaultValue="Default resolution"
                            values={[
                                "320x240",
                                "640x480",
                                "960x540",
                                "1280x720",
                            ]}
                        />
                        <Selector
                            id="use-video-codecs"
                            defaultValue="No codecs"
                            values={["VP8", "H264"]}
                        />
                    </ParamOption>
                    <div className="option">
                        <ParamOption id="use-stun" label="Use STUN server" />
                        <ParamOption
                            id="show-ICE-state"
                            label="Show ICE state"
                        />
                        <ParamOption
                            id="show-SDP"
                            label="Show SDP offer/answer"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Options;
