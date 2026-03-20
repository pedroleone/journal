import { runDemoSeed } from "../lib/dev/demo-seed-runner";

runDemoSeed(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
