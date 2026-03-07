import Link from "next/link";
import { discoverAllPrototypes } from "@/lib/discovery";
import { DesignerSection } from "@/components/home/designer-section";

export default async function HomePage() {
  const designerGroups = discoverAllPrototypes();

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-12 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Prototype Playground
          </h1>
          <p className="text-text-secondary text-lg">
            Interactive prototypes from the team. Browse, explore, and get
            inspired.
          </p>
        </div>
        <Link
          href="/prototypes/claude-bot/create-new-project"
          className="shrink-0 mt-1 flex items-center gap-1.5 px-4 h-9 rounded-md text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          + New project
        </Link>
      </header>

      <div className="space-y-12">
        {designerGroups.map((group) => (
          <DesignerSection key={group.designer} group={group} />
        ))}
      </div>

      {designerGroups.length === 0 && (
        <div className="text-center py-20 text-text-tertiary">
          <p className="text-lg mb-2">No prototypes yet.</p>
          <p className="text-sm">
            Run{" "}
            <code className="bg-bg-tertiary px-2 py-1 rounded text-text-secondary font-mono">
              npm run new your-name &quot;My Prototype&quot;
            </code>{" "}
            to create your first one.
          </p>
        </div>
      )}
    </main>
  );
}
