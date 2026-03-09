import Link from "next/link";
import { discoverAllPrototypes, getRecentPrototypes } from "@/lib/discovery";
import { SearchHome } from "@/components/home/search-home";
import { RecentFeed } from "@/components/home/recent-feed";
import { UserMenu } from "@/components/layout/user-menu";
import { DarkModeToggle } from "@/components/layout/dark-mode-toggle";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const designerGroups = discoverAllPrototypes();
  const recentPrototypes = getRecentPrototypes(5);
  const session = await auth();
  const currentDesigner = session?.user?.designerFolder ?? null;

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-base-content mb-2">
            Prototype Playground
          </h1>
          <p className="text-base-content/60 text-lg">
            Interactive prototypes from the team. Browse, explore, and get
            inspired.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 mt-1">
          {process.env.NODE_ENV === "development" && (
            <Link
              href="/prototypes/claude-bot/create-new-project"
              className="flex items-center gap-1.5 px-4 h-9 rounded-md text-sm font-medium bg-primary text-primary-content hover:bg-primary/80 transition-colors"
            >
              + New project
            </Link>
          )}
          <DarkModeToggle />
          <UserMenu />
        </div>
      </header>

      <div className="flex gap-10 items-start">
        <div className="flex-1 min-w-0">
          {designerGroups.length === 0 ? (
            <div className="text-center py-20 text-base-content/40">
              <p className="text-lg mb-2">No prototypes yet.</p>
              <p className="text-sm">
                Run{" "}
                <code className="bg-base-300 px-2 py-1 rounded text-base-content/60 font-mono">
                  npm run new your-name &quot;My Prototype&quot;
                </code>{" "}
                to create your first one.
              </p>
            </div>
          ) : (
            <SearchHome
              designerGroups={designerGroups}
              currentDesigner={currentDesigner}
            />
          )}
        </div>
        <RecentFeed prototypes={recentPrototypes} />
      </div>
    </main>
  );
}
