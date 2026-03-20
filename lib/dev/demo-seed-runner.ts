import { getUserByEmail } from "@/lib/auth/user";

type DemoSeedUser = {
  id: string;
  email: string;
};

type DemoSeedRunnerDeps = {
  getUserByEmail: (email: string) => Promise<DemoSeedUser | null>;
};

const defaultDeps: DemoSeedRunnerDeps = {
  getUserByEmail,
};

function readEmailArg(argv: string[]) {
  const emailIndex = argv.indexOf("--email");
  return emailIndex >= 0 ? argv[emailIndex + 1] : undefined;
}

function assertLocalSeedEnvironment() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seed is limited to local/dev environments");
  }
}

export async function runDemoSeed(argv: string[], deps: DemoSeedRunnerDeps = defaultDeps) {
  const email = readEmailArg(argv);
  if (!email) {
    throw new Error("--email is required");
  }

  assertLocalSeedEnvironment();

  const user = await deps.getUserByEmail(email);
  if (!user) {
    throw new Error(`No user found for email "${email}"`);
  }

  return { user };
}
