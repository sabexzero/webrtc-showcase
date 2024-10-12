import { StateCreator } from "zustand";

export type ParamSlice = {
    params: Record<string, boolean>;
    toggleParam: (id: string) => void;
};

enum Params {
    "use-datachannel" = "use-datachannel",
    "use-audio" = "use-audio",
    "use-video" = "use-video",
    "use-stun" = "use-stun",
    "show-ICE-state" = "show-ICE-state",
    "show-SDP" = "show-SDP",
}

export const paramSlice: StateCreator<ParamSlice> = (set) => ({
    params: {
        [Params["use-datachannel"]]: false,
        [Params["use-audio"]]: false,
        [Params["use-video"]]: true,
        [Params["use-stun"]]: false,
        [Params["show-ICE-state"]]: true,
        [Params["show-SDP"]]: false,
    },
    toggleParam: (id) =>
        set((state) => ({
            params: {
                ...state.params,
                [id]: !state.params[id],
            },
        })),
});
