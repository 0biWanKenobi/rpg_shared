import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import dts from "unplugin-dts/vite";
import { defineConfig, type Plugin } from "vite";


function generateEntries(root: string, paths: string[]) {
	return paths.reduce<Record<string, string>>((o, p) => {
		o[root+"/"+p] = fileURLToPath(new URL(`./src/${root}/${p}.ts`, import.meta.url))
		return o;
	}, {})
}

const cryptoEntry = fileURLToPath(new URL("./src/crypto.ts", import.meta.url));
const settingsEntries = generateEntries("settings", ["interfaces", "plugin"])
const syncEntries =generateEntries("sync", ["googleDriveAuth", "googleDriveConnectModal", "googleDriveTokenCrypto"]);
const uiEntries = generateEntries("ui", ["confirmModal/index", "headerWithIcon/index", "iconButton/index", "tabs/index", "userPasswordModal/index", "driveFolder/index"]);

function resolveYalcBin(): string {
	if (process.env.YALC_BIN) {
		return process.env.YALC_BIN;
	}

	if (process.platform === "win32") {
		return "yalc.cmd";
	}

	return process.env.HOME ? `${process.env.HOME}/.local/bin/yalc` : "yalc";
}

function yalcPushOnWatch(): Plugin {
	let pushInFlight = false;
	let pushQueued = false;

	const runPush = () => {
		if (pushInFlight) {
			pushQueued = true;
			return;
		}

		pushInFlight = true;
		const yalcBin = resolveYalcBin();
		console.log("Running yalc push...");
		const child = spawn(yalcBin, ["push", "--no-workspace-resolve"], {
			shell: process.platform === "win32",
			stdio: ["ignore", "inherit", "inherit"],
			windowsHide: true,
		});

		child.on("error", (error) => {
			pushInFlight = false;
			console.error(`yalc push failed to start: ${error.message}`);
		});

		child.on("exit", (code) => {
			pushInFlight = false;
			if (code === 0) {
				console.log("yalc push completed.");
			} else {
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

export default defineConfig(({ mode }) => ({
	plugins: [
		dts({
			tsconfigPath: "./tsconfig.json",
			outDirs: "dist",
			entryRoot: "src",
		}),
		yalcPushOnWatch(),
	],
	build: {
		sourcemap: mode == "development" ? "inline" : false,
		lib: {
			entry: {
				"crypto": cryptoEntry,
				...syncEntries,
				...settingsEntries,
				...uiEntries,
			},
			name: "RpgShared",
			formats: ["es"],
			fileName: (_, entryName) =>
				`${entryName}.js`,
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
		target: "esnext",
		emptyOutDir: true,
	},
}));
