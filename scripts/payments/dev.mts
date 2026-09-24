import nextEnv from "@next/env";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";

// Check before writing .env.local or starting another Stripe listener.
// Next stores server metadata here; Node can read it while Windows holds the lock.
let running: { pid?: number; appUrl?: string } | undefined;
try {
  running = JSON.parse(await readFile(resolve(".next/dev/lock"), "utf8"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
    console.error(
      "Could not check the Next.js dev lock. Stop the existing dev server before retrying. Local settings were not changed.",
    );
    process.exit(1);
  }
}
if (Number.isInteger(running?.pid) && running!.pid! > 0) {
  let alive = true;
  try {
    process.kill(running!.pid!, 0);
  } catch (error) {
    alive = (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
  if (alive) {
    let checkout = "the existing server";
    try {
      const url = new URL(running!.appUrl!);
      if (
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
        checkout = `${url.origin}/checkout`;
    } catch {
      /* Fall back to a generic message. */
    }
    console.log(
      `This project's Next.js server is already running. Open ${checkout}.`,
    );
    console.log(
      "Local settings were not changed and no second Stripe listener was started. To restart, stop the existing payments:dev command with Ctrl+C first.",
    );
    process.exit(0);
  }
}

nextEnv.loadEnvConfig(process.cwd(), true);
const port = process.argv[2] || "3000";
if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535)
  throw new Error("Choose a local port between 1024 and 65535.");
const origin = `http://localhost:${port}`;
const key = process.env.STRIPE_SECRET_KEY ?? "";
if (!/^(sk|rk)_test_/.test(key))
  throw new Error("Set a Stripe test secret key in .env first.");
const require = createRequire(import.meta.url);
const cli = resolve(
  require.resolve(
    `@stripe/cli-${process.platform}-${process.arch}/package.json`,
  ),
  "..",
  "bin",
  process.platform === "win32" ? "stripe.exe" : "stripe",
);
const env = {
  ...process.env,
  STRIPE_API_KEY: key,
  STRIPE_DEVICE_NAME: "simbiat-local",
};
const events =
  "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired";
let secret: string;
try {
  const result = await promisify(execFile)(cli, ["listen", "--print-secret"], {
    env,
    windowsHide: true,
    timeout: 30000,
  });
  const match = (result.stdout + result.stderr).match(/whsec_[A-Za-z0-9]+/);
  if (!match) throw new Error("No secret returned");
  secret = match[0];
} catch {
  console.error(
    "Could not connect the Stripe listener. Check the test API key and network connection.",
  );
  process.exit(1);
}
// Preserve the Dashboard endpoint secret in .env; this override is local and ignored by Git.
const path = resolve(".env.local");
let local = await readFile(path, "utf8").catch(
  (error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  },
);
for (const [name, value] of Object.entries({
  STRIPE_WEBHOOK_SECRET: secret,
  STRIPE_CHECKOUT_ENABLED: "true",
  APP_URL: origin,
})) {
  const pattern = new RegExp(`^${name}=.*$`, "m");
  local = pattern.test(local)
    ? local.replace(pattern, `${name}=${value}`)
    : `${local.trimEnd()}\n${name}=${value}\n`;
}
await writeFile(path, local, { mode: 0o600 });
console.log(
  "Local Stripe signing secret configured in .env.local (value hidden). Dashboard secret in .env preserved.",
);
const listener = spawn(
  cli,
  [
    "listen",
    "--events",
    events,
    "--forward-to",
    `${origin}/api/stripe/webhook`,
  ],
  { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
const server = spawn(
  process.execPath,
  [
    resolve("node_modules/next/dist/bin/next"),
    "dev",
    "--hostname",
    "localhost",
    "--port",
    port,
  ],
  {
    env: {
      ...process.env,
      STRIPE_WEBHOOK_SECRET: secret,
      STRIPE_CHECKOUT_ENABLED: "true",
      APP_URL: origin,
    },
    windowsHide: true,
    stdio: "inherit",
  },
);
// Do not print the listener's signing secret, even if its output arrives in chunks.
for (const stream of [listener.stdout, listener.stderr]) {
  let pending = "";
  stream?.on("data", (chunk) => {
    pending += chunk.toString();
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";
    for (const line of lines)
      console.log(
        line.replace(/whsec_[A-Za-z0-9]+/g, "[signing secret hidden]"),
      );
  });
}
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  listener.kill();
  server.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
listener.on("error", () => {
  console.error("Stripe listener could not start.");
  stop();
});
server.on("error", () => {
  console.error("Next.js could not start.");
  stop();
});
listener.on("exit", (code) => {
  if (!stopping && code) process.exitCode = code;
  stop();
});
server.on("exit", (code) => {
  if (!stopping && code) process.exitCode = code;
  stop();
});
