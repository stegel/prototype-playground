"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClaimFolderPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [unclaimed, setUnclaimed] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/user/claim-folder")
      .then((res) => res.json())
      .then((data) => {
        if (data.currentFolder) {
          router.push("/");
          return;
        }
        setUnclaimed(data.unclaimed || []);
        setLoading(false);
      });
  }, [status, router]);

  async function handleClaim() {
    if (!selected) return;
    setClaiming(true);
    setError("");

    const res = await fetch("/api/user/claim-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: selected }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to claim folder");
      setClaiming(false);
      return;
    }

    await update();
    router.push("/");
    router.refresh();
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-8">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h2 className="card-title">Claim your folder</h2>
          <p className="text-base-content/70 text-sm">
            Select the designer folder that belongs to you. This links your
            account to your prototypes.
          </p>

          {unclaimed.length === 0 ? (
            <div className="alert alert-warning mt-4">
              <span>No unclaimed folders available.</span>
            </div>
          ) : (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {unclaimed.map((folder) => (
                <label
                  key={folder}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected === folder
                      ? "border-primary bg-primary/5"
                      : "border-base-300 hover:border-base-content/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="folder"
                    className="radio radio-primary radio-sm"
                    checked={selected === folder}
                    onChange={() => setSelected(folder)}
                  />
                  <span className="font-mono text-sm">{folder}</span>
                </label>
              ))}
            </div>
          )}

          
          {error && <div className="text-error text-sm mt-2">{error}</div>}

          <div className="card-actions mt-4">
            <button
              className="btn btn-primary w-full"
              disabled={!selected || claiming}
              onClick={handleClaim}
            >
              {claiming ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Claim this folder"
              )}
            </button>
            <button
              className="btn btn-ghost w-full btn-sm"
              onClick={() => router.push("/")}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
