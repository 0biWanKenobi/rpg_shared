import { defineConfig } from "vite";

const interfacesEntry = new URL("./src/settings/interfaces.ts", import.meta.url).pathname;
const pluginEntry = new URL("./src/settings/plugin.ts", import.meta.url).pathname;

export default defineConfig({
	build: {
		lib: {
			entry: {
				"settings/interfaces": interfacesEntry,
				"settings/plugin": pluginEntry,
			},
			name: "RpgShared",
			formats: ["es", "cjs"],
			fileName: (format, entryName) =>
				format === "es" ? `${entryName}.js` : `${entryName}.cjs`,
		},
		rollupOptions: {
			external: [
				"@preact/signals",
				"@preact/signals-core",
				"obsidian",
			],
			output: {
				preserveModules: true,
				preserveModulesRoot: "src",
			},
		},
		target: "es2020",
		emptyOutDir: true,
	},
});
