import React, { useState } from "react"

const Logs: React.FC = () => {
    const [isLogsToggled, setLogsToggle] = useState(true);

    return (
        <>
            <h2 className="text-3xl pt-16 text-black text-left">
                <button onClick={() => setLogsToggle(prevState => !prevState)}>
                    Logs ↓
                </button>
            </h2>
            {isLogsToggled && (
                <div id="logs-dropdown" className="flex flex-col gap-4 break-words text-left">
                    <div id="ICE-state" className="flex flex-col gap-1">
                        <p>ICE gathering state: <span id="ice-gathering-state"></span></p>
                        <p>ICE connection state: <span id="ice-connection-state"></span></p>
                        <p>Signaling state: <span id="signaling-state"></span></p>
                    </div>

                    <div id="DC-state">
                        <h2>Data channel:</h2>
                        <pre id="data-channel"></pre>
                    </div>

                    <div id="SDP-state" className="flex flex-col gap-1">
                        <h3>SPD Offer:</h3>
                        <pre id="offer-sdp"></pre>

                        <h3>Answer:</h3>
                        <pre id="answer-sdp"></pre>
                    </div>
                </div>
            )}
        </>
    )
}

export default Logs