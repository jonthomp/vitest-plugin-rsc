import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { vitestPluginRSC } from "vitest-plugin-rsc";

export default defineWorkersConfig({
  plugins: [vitestPluginRSC()],
  test: {
    // Keep worker-pool tests separate from browser-mode tests.
    include: ["src/**/*.worker.test.{ts,tsx}"],
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
      },
    },
  },
});

