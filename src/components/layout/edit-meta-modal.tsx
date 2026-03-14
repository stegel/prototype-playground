"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { PrototypeMeta } from "@/lib/types";

interface EditMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  meta: PrototypeMeta;
  designer: string;
  protoSlug: string;
}

export function EditMetaModal({
  isOpen,
  onClose,
  meta,
  designer,
  protoSlug,
}: EditMetaModalProps) {
  const [title, setTitle] = useState(meta.title);
  const [description, setDescription] = useState(meta.description);
  const [tags, setTags] = useState<string[]>(meta.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveMode, setSaveMode] = useState<"filesystem" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(meta.title);
      setDescription(meta.description);
      setTags(meta.tags || []);
      setNewTag("");
      setShowSuccess(false);
      setSaveMode(null);
      setError(null);
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen, meta]);

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/prototypes/${encodeURIComponent(designer)}/${encodeURIComponent(protoSlug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, tags }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update metadata");
      }

      const data = await response.json() as { success: boolean; mode: "filesystem" | "github" };
      setSaveMode(data.mode);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    if (showSuccess) {
      window.location.reload();
    }
  };

  return (
    <dialog
      ref={modalRef}
      className="modal"
      onClose={handleClose}
    >
      <div className="modal-box bg-base-100 border border-base-300 max-w-lg">
        {showSuccess ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Changes Saved
            </h3>
            <p className="text-base-content/60 text-sm mb-4">
              Your metadata has been updated.
            </p>
            {saveMode === "github" ? (
              <div className="alert alert-success text-left mb-4">
                <Icon name="code" size={18} />
                <div>
                  <p className="font-medium">Committed to GitHub!</p>
                  <p className="text-sm opacity-80">
                    Run <code className="bg-base-300 px-1 rounded">git pull</code> locally to sync your changes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="alert alert-info text-left mb-4">
                <Icon name="code" size={18} />
                <div>
                  <p className="font-medium">Don&apos;t forget to commit!</p>
                  <p className="text-sm opacity-80">
                    Run <code className="bg-base-300 px-1 rounded">git commit</code> and{" "}
                    <code className="bg-base-300 px-1 rounded">git push</code> to save your changes.
                  </p>
                </div>
              </div>
            )}
            <button className="btn btn-primary" onClick={handleClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-base-content">
                Edit Prototype
              </h3>
              <button
                className="btn btn-sm btn-ghost btn-circle"
                onClick={handleClose}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-base-content/60"
                  htmlFor="edit-meta-title"
                >
                  Title
                </label>
                <input
                  id="edit-meta-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-base-content/60"
                  htmlFor="edit-meta-description"
                >
                  Description
                </label>
                <textarea
                  id="edit-meta-description"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="textarea textarea-bordered w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-base-content/60">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge badge-neutral gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-circle"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="input input-bordered input-sm flex-1"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={handleAddTag}
                  >
                    <Icon name="plus" size={16} />
                    Add
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <Icon name="x" size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={cn("btn btn-primary", isSubmitting && "loading")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
