import { createServer, type Server } from "node:net";
import { resolveConfig, type Plugin, type ViteDevServer } from "vite";
import { afterEach, expect, test } from "vitest";
import { vitestPluginRSC } from "./index.ts";

const servers: Server[] = [];
const browserPlugin = { name: "vitest:browser:config" };
const configureServer = getHookHandler(getPlugin("rsc:browser-api-port").configureServer);

afterEach(async () => {
  await Promise.all(servers.splice(0).map(closeServer));
});

test("moves the Vitest browser API server before Vite falls back from an occupied port", async () => {
  const occupiedPort = await occupyPort();
  const server = createViteServer([browserPlugin], { port: occupiedPort });

  await configureServer.call({} as never, server);

  expect(server.config.server.port).toEqual(expect.any(Number));
  expect(server.config.server.port).not.toBe(occupiedPort);
});

test.each([
  ["strict Vitest browser API ports", [browserPlugin], { strictPort: true }],
  ["non-browser Vite servers", [], {}],
])("leaves %s untouched", async (_name, plugins, options) => {
  const occupiedPort = await occupyPort();
  const server = createViteServer(plugins, { port: occupiedPort, ...options });

  await configureServer.call({} as never, server);

  expect(server.config.server.port).toBe(occupiedPort);
});

test("does not hide non-port listen failures", async () => {
  const server = createViteServer([browserPlugin], {
    port: 0,
    host: "invalid.invalid",
  });

  await expect(configureServer.call({} as never, server)).rejects.toMatchObject({
    code: "ENOTFOUND",
  });
  expect(server.config.server.port).toBe(0);
});

test("keeps react_client pre-bundling when Vitest disables the optimizer of other environments", async () => {
  // Mirrors Vitest 5's vitest:environments-module-runner plugin, which in
  // browser mode only leaves the `client` environment's optimizeDeps alone.
  const vitestLikePlugin: Plugin = {
    name: "vitest-like",
    configEnvironment: {
      order: "post",
      handler(name, config) {
        if (name !== "client") config.optimizeDeps = { noDiscovery: true, include: [] };
      },
    },
  };

  // Returning a partial config makes Vite merge it into a new environment config.
  const addsDepPlugin: Plugin = {
    name: "adds-dep",
    configEnvironment(name) {
      if (name === "react_client") return { optimizeDeps: { include: ["some-dep"] } };
    },
  };

  const config = await resolveConfig(
    {
      configFile: false,
      logLevel: "silent",
      plugins: [vitestPluginRSC(), addsDepPlugin, vitestLikePlugin],
    },
    "serve",
  );

  expect(config.environments.react_client!.optimizeDeps).toMatchObject({
    noDiscovery: false,
    include: expect.arrayContaining(["react", "react-dom/client", "react/jsx-runtime", "some-dep"]),
  });
});

function getPlugin(name: string): Plugin {
  const plugin = vitestPluginRSC().find((candidate) => candidate.name === name);
  if (!plugin) throw new Error(`Could not find ${name}.`);
  return plugin;
}

function getHookHandler<T extends (...args: never[]) => unknown>(
  hook: T | { handler: T } | undefined,
): T {
  if (!hook) throw new Error("Expected Vite hook to be defined.");
  return typeof hook === "function" ? hook : hook.handler;
}

function createViteServer(
  plugins: Array<{ name: string }>,
  server: {
    port: number;
    strictPort?: boolean;
    host?: ViteDevServer["config"]["server"]["host"];
  },
): ViteDevServer {
  return {
    config: { plugins, server },
  } as unknown as ViteDevServer;
}

function occupyPort(host?: string) {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen({ port: 0, host }, () => {
      servers.push(server);
      resolve((server.address() as { port: number }).port);
    });
  });
}

function closeServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
