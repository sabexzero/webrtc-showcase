import { StateCreator } from "zustand";

export type LogsSlice = {
    logs: Record<string, string>;
    appendText: (id: string, text: string) => void;
};

enum Logs {
    "ice-gathering-state" = "ice-gathering-state",
    "ice-connection-state" = "ice-connection-state",
    "signaling-state" = "signaling-state",
}

export const logsSlice: StateCreator<LogsSlice> = (set) => ({
    logs: {
        [Logs["ice-connection-state"]]: "",
        [Logs["ice-gathering-state"]]: "",
        [Logs["signaling-state"]]: "",
    },

    appendText: (id, text) =>
        set((state) => ({
            logs: {
                ...state.logs,
                [id]: state.logs[id] + "-->" + text,
            },
        })),
});
