"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-base-300 animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <button className="btn btn-sm btn-ghost" onClick={() => signIn()}>
        Sign in
      </button>
    );
  }

  const initials = (session.user.name || session.user.email || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
        {session.user.image ? (
          <div className="w-8 rounded-full">
            <img
              src={session.user.image}
              alt={session.user.name || "Avatar"}
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        )}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-300"
      >
        <li className="menu-title px-2 py-1">
          <span className="text-sm font-medium">{session.user.name}</span>
          {session.user.email && (
            <span className="text-xs opacity-60">{session.user.email}</span>
          )}
        </li>
        {session.user.designerFolder && (
          <li className="disabled">
            <span className="text-xs opacity-60">
              Folder: {session.user.designerFolder}
            </span>
          </li>
        )}
        <li>
          <button onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
}
