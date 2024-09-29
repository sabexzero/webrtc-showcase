interface UseNegotiationProps {
    pc: RTCPeerConnection | null;
    websocket: WebSocket | null;
}

const useNegotiation = ({ pc, websocket }: UseNegotiationProps) => {
    const negotiate = () => {
        if (pc && websocket) {
            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(
                    () =>
                        new Promise<void>((resolve) => {
                            if (pc.iceGatheringState === "complete") {
                                resolve();
                            } else {
                                const checkState = () => {
                                    if (pc.iceGatheringState === "complete") {
                                        pc.removeEventListener(
                                            "icegatheringstatechange",
                                            checkState
                                        );
                                        resolve();
                                    }
                                };
                                pc.addEventListener(
                                    "icegatheringstatechange",
                                    checkState
                                );
                            }
                        })
                )
                .then(() => {
                    const offer = pc.localDescription;
                    if (offer) {
                        websocket.send(
                            JSON.stringify({
                                sdp: offer.sdp,
                                type: offer.type,
                            })
                        );
                    }

                    websocket.addEventListener("message", (event) => {
                        const answer = JSON.parse(event.data);
                        pc.setRemoteDescription(
                            new RTCSessionDescription(answer)
                        ).catch((e) => console.log(e));
                    });
                })
                .catch((e) => {
                    console.log(e);
                });
        }
    };

    return { negotiate };
};

export default useNegotiation;
