import { AppearanceSync } from "@/components/appearance/appearance-sync";
import { AppShell } from "@/components/app-shell";
import { appearanceFromMetadata } from "@/lib/appearance";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, recentSessions, recentCloseouts } = await loadRecoveryPageData({
    limit: null,
  });

  // Signed-out visitors only reach "/" (other pages redirect there) and see the
  // landing without the shell.
  if (!user) return children;

  const appearance = appearanceFromMetadata(user.user_metadata);

  return (
    <AppShell
      streak={calculateLoggingStreak(recentSessions, recentCloseouts)}
      user={{ email: user.email, user_metadata: user.user_metadata }}
    >
      <AppearanceSync accent={appearance.accent} theme={appearance.theme} />
      {children}
    </AppShell>
  );
}
