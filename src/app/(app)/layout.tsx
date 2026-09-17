import { AppShell } from "@/components/app-shell";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, recentSessions, recentCloseouts } = await loadRecoveryPageData({
    limit: null,
  });

  // Signed-out visitors only reach "/" (other pages redirect there) and see the
  // landing without the shell.
  if (!user) return children;

  return (
    <AppShell
      streak={calculateLoggingStreak(recentSessions, recentCloseouts)}
      user={{ email: user.email, user_metadata: user.user_metadata }}
    >
      {children}
    </AppShell>
  );
}
