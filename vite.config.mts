import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import dts from 'vite-plugin-dts';
import { defineConfig, type Plugin } from "vite";
import { svelte } from '@sveltejs/vite-plugin-svelte'

function generateEntries(root: string, paths: string[]) {
	return paths.reduce<Record<string, string>>((o, p) => {
		o[root+"/"+p] = fileURLToPath(new URL(`./src/${root}/${p}.ts`, import.meta.url))
		return o;
	}, {})
}

const cryptoEntry = fileURLToPath(new URL("./src/crypto.ts", import.meta.url));
const settingsEntries = generateEntries("settings", ["interfaces", "plugin"])
const syncEntries =generateEntries("sync", ["googleDriveAuth", "googleDriveConnectModal", "googleDriveTokenCrypto"]);
const uiEntries = generateEntries("ui", [
	"confirmModal/index",
	"headerWithIcon/index",
	"iconButton/index",
	"tabs/index",
	"userPasswordModal/index",
	"driveFolder/index",
	"base/index",
	"obsidian/index",
	"custom/index",
]);
function resolveYalcBin(): string {
	if (process.env.YALC_BIN) {
		return process.env.YALC_BIN;
	}

	if (process.platform === "win32") {
		return "yalc.cmd";
	}

	return process.env.HOME ? `${process.env.HOME}/.local/bin/yalc` : "yalc";
}

function resolveSveltePackageBin(): string {
	if (process.platform === "win32") {
		return join(process.cwd(), "node_modules", ".bin", "svelte-package.cmd");
	}

	return join(process.cwd(), "node_modules", ".bin", "svelte-package");
}

function postBuildPackaging(): Plugin {
	let taskInFlight = false;
	let taskQueued = false;

	const runCommand = (command: string, args: string[], label: string) =>
		new Promise<void>((resolve, reject) => {
			console.log(`Running ${label}...`);
			const child = spawn(command, args, {
				shell: process.platform === "win32",
				stdio: ["ignore", "inherit", "inherit"],
				windowsHide: true,
			});

			child.on("error", (error) => {
				reject(new Error(`${label} failed to start: ${error.message}`));
			});

			child.on("exit", (code) => {
				if (code === 0) {
					console.log(`${label} completed.`);
					resolve();
				} else {
					reject(new Error(`${label} exited with code ${code ?? "unknown"}`));
				}
			});
		});

	const runTasks = async () => {
		if (taskInFlight) {
			taskQueued = true;
			return;
		}

		taskInFlight = true;

		try {
			await runCommand(
				resolveSveltePackageBin(),
				["-i", "src", "-o", "dist", "-p", "--tsconfig", "./tsconfig.json"],
				"svelte-package"
			);

			if (process.env.PUSH_YALC_ON_WATCH === "1" && process.env.npm_lifecycle_event !== "build") {
				await runCommand(resolveYalcBin(), ["push", "--no-workspace-resolve"], "yalc push");
			}
		} finally {
			taskInFlight = false;

			if (taskQueued) {
				taskQueued = false;
				await runTasks();
			}
		}
	};

	return {
		name: "post-build-packaging",
		apply: "build",
		async closeBundle() {
			await runTasks();
		},
	};
}

export default defineConfig(({ mode }) => ({
	plugins: [
		dts({
			tsconfigPath: "./tsconfig.json",
			outDirs: "dist",
			entryRoot: "src",
			include: ["src/**/*.ts"],
		}),
		svelte(),
		postBuildPackaging(),
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
				'svelte',
				/^svelte\//
			],
			output: {
				preserveModules: true,
				preserveModulesRoot: "src",
				globals: {
					svelte: 'Svelte'
				}
			},
		},
		target: "esnext",
		emptyOutDir: true,
	},
}));
