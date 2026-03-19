import { auth } from "@/auth";
import { AuthPage } from "@/components/auth/auth-page";
import { DashboardHome } from "./dashboard-home";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return <AuthPage />;
  }

  return <DashboardHome />;
}
