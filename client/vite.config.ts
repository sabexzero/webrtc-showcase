import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@pages": path.resolve(__dirname, "src/pages"),
            "@hooks": path.resolve(__dirname, "src/hooks"),
            "@providers": path.resolve(__dirname, "src/providers"),
            "@components": path.resolve(__dirname, "src/components"),
            "@store": path.resolve(__dirname, "src/store"),
        },
    },
});
