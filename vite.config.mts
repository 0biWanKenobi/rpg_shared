import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import dts from "unplugin-dts/vite";
import { defineConfig, type Plugin } from "vite";


const interfacesEntry = fileURLToPath(new URL("./src/settings/interfaces.ts", import.meta.url));
const pluginEntry = fileURLToPath(new URL("./src/settings/plugin.ts", import.meta.url));
const confirmModalEntry = fileURLToPath(new URL("./src/ui/confirmModal.ts", import.meta.url));
const tabsEntry = fileURLToPath(new URL("./src/ui/tabs.ts", import.meta.url));
const headerWithIconEntry = fileURLToPath(new URL("./src/ui/headerWithIcon.ts", import.meta.url));
const iconButtonEntry = fileURLToPath(new URL("./src/ui/iconButton.ts", import.meta.url));
const googleDriveAuthEntry = fileURLToPath(new URL("./src/sync/googleDriveAuth.ts", import.meta.url));

function yalcPushOnWatch(): Plugin {
	let pushInFlight = false;
	let pushQueued = false;

	const runPush = () => {
		if (pushInFlight) {
			pushQueued = true;
			return;
		}

		pushInFlight = true;
		const yalcBin = process.env.YALC_BIN ?? `${process.env.HOME}/.local/bin/yalc`;
		console.log("Running yalc push...");
		const child = spawn(yalcBin, ["push", "--quiet"], {
			stdio: ["ignore", "inherit", "inherit"],
		});

		child.on("exit", (code) => {
			pushInFlight = false;
			if (code !== 0) {
				console.error(`yalc push exited with code ${code ?? "unknown"}`);
			}

			if (pushQueued) {
				pushQueued = false;
				runPush();
			}
		});
	};

	return {
		name: "yalc-push-on-watch",
		apply: "build",
		closeBundle() {
			if (!this.meta.watchMode || process.env.PUSH_YALC_ON_WATCH !== "1") {
				return;
			}

			runPush();
		},
	};
}


export default defineConfig({
	plugins: [
		dts({
			tsconfigPath: "./tsconfig.json",
			outDirs: "dist",
			entryRoot: "src",
		}),
		yalcPushOnWatch(),
	],
	build: {
		lib: {
			entry: {
				"settings/interfaces": interfacesEntry,
				"settings/plugin": pluginEntry,
				"ui/confirmModal": confirmModalEntry,
				"ui/tabs": tabsEntry,
				"ui/headerWithIcon": headerWithIconEntry,
				"ui/iconButton": iconButtonEntry,
				"sync/googleDriveAuth": googleDriveAuthEntry,
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
