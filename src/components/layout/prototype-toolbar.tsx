"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { DarkModeToggle } from "@/components/layout/dark-mode-toggle";
import { EditMetaModal } from "@/components/layout/edit-meta-modal";
import type { PrototypeMeta } from "@/lib/types";

interface PrototypeToolbarProps {
  meta: PrototypeMeta | null;
  designer: string;
  protoSlug: string;
}

export function PrototypeToolbar({
  meta,
  designer,
  protoSlug,
}: PrototypeToolbarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <Icon name="arrow-left" size={14} />
            Back
          </Link>
          {meta && (
            <span className="text-sm font-medium text-text-primary">
              {meta.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {meta && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-border transition-colors"
              title="Edit prototype metadata"
            >
              <Icon name="edit" size={15} />
            </button>
          )}
          <DarkModeToggle />
        </div>
      </nav>

      {meta && (
        <EditMetaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          meta={meta}
          designer={designer}
          protoSlug={protoSlug}
        />
      )}
    </>
  );
}
