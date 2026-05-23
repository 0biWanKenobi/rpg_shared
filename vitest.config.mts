import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {

	const env = loadEnv(mode, process.cwd(), '');
	process.env = { ...process.env, ...env };

	return {
		test: {
			environment: "node",
			include: ["tests/**/*.test.ts"]
		},
	}
});
