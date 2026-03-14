import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";


const interfacesEntry = fileURLToPath(new URL("./src/settings/interfaces.ts", import.meta.url));
const pluginEntry = fileURLToPath(new URL("./src/settings/plugin.ts", import.meta.url));
const confirmModalEntry = fileURLToPath(new URL("./src/ui/confirmModal.ts", import.meta.url));


export default defineConfig({
	build: {
		lib: {
			entry: {
				"settings/interfaces": interfacesEntry,
				"settings/plugin": pluginEntry,
				"ui/confirmModal": confirmModalEntry,
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
