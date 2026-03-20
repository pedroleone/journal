import { loadProjectEnv } from "../lib/drizzle-env";
import { runDemoSeed } from "../lib/dev/demo-seed-runner";

Object.assign(process.env, loadProjectEnv(process.cwd()));

runDemoSeed(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
