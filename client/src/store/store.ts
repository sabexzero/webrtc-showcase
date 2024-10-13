import { create } from "zustand";
import { ParamSlice, paramSlice } from "./paramSlice.ts";
import { LogsSlice, logsSlice } from "./logsSlice.ts";

export const useGlobalStore = create<ParamSlice & LogsSlice>((...a) => ({
    ...paramSlice(...a),
    ...logsSlice(...a),
}));
