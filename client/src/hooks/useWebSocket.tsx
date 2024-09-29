import { useEffect, useState } from "react";

function useWebSocket(url: string) {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(url);
        setSocket(ws);

        ws.onopen = () => console.log("WebSocket connection established");
        ws.onerror = (event) => console.error("WebSocket error:", event);
        ws.onclose = (event) =>
            console.log("WebSocket connection closed:", event);

        return () => ws.close();
    }, [url]);

    return socket;
}

export default useWebSocket;
