import { defineConfig } from '@tanstack/react-start/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

const config = await defineConfig({
	tsr: {
		appDirectory: "src",
	},
	vite: {
		plugins: [
			// this is the plugin that enables path aliases
			viteTsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			tailwindcss(),
		],
	},
});

config.addRouter({
	name: "ws",
	type: "http",
	handler: "./src/ws.ts",
	target: "server",
	base: "/_ws",
});

export default config;
