"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

type Status = "pending" | "submitting" | "success" | "error";

const STATUS_OPTIONS = ["in-progress", "complete", "archived"] as const;

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a tag..."
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          className="flex-1"
        />
        <Button variant="secondary" onClick={addTag} type="button">
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-info/15 text-base-content text-xs font-medium hover:opacity-75 transition-opacity"
            >
              {tag}
              <span className="text-base-content/60">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateNewProject() {
  const { data: session } = useSession();
  const [designers, setDesigners] = useState<string[]>([]);
  const [designer, setDesigner] = useState("");
  const [customDesigner, setCustomDesigner] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("in-progress");
  const [formStatus, setFormStatus] = useState<Status>("pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ path: string; designer: string; slug: string } | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    fetch("/api/designers")
      .then((r) => r.json())
      .then((data: { designers: string[] }) => setDesigners(data.designers))
      .catch(() => {});
  }, []);

  // Auto-select the user's claimed folder
  useEffect(() => {
    if (hasAutoSelected || designer) return;
    const folder = session?.user?.designerFolder;
    if (folder && designers.includes(folder)) {
      setDesigner(folder);
      setHasAutoSelected(true);
    }
  }, [session, designers, designer, hasAutoSelected]);

  const effectiveDesigner = designer === "__new__" ? customDesigner : designer;

  function toSlug(t: string) {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  const previewSlug = title ? toSlug(title) : "";
  const previewPath =
    effectiveDesigner && previewSlug
      ? `/prototypes/${effectiveDesigner.toLowerCase().replace(/[^a-z0-9-]/g, "-")}/${previewSlug}`
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveDesigner || !title) return;

    setFormStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/create-prototype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designer: effectiveDesigner,
          title,
          description,
          tags,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong");
        setFormStatus("error");
      } else {
        setResult(data);
        setFormStatus("success");
      }
    } catch {
      setErrorMsg("Network error — please try again");
      setFormStatus("error");
    }
  }

  function handleReset() {
    setTitle("");
    setDescription("");
    setTags([]);
    setStatus("in-progress");
    setDesigner("");
    setCustomDesigner("");
    setResult(null);
    setFormStatus("pending");
    setErrorMsg("");
  }

  if (formStatus === "success" && result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200 p-8">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-base-content mb-1">
              Project created!
            </h2>
            <p className="text-base-content/60 text-sm">
              Your prototype has been scaffolded and is ready to edit.
            </p>
          </div>
          <div className="bg-base-300 rounded-lg p-4 text-left space-y-1">
            <p className="text-xs text-base-content/40 font-mono">Path</p>
            <p className="text-sm text-base-content font-mono break-all">
              src/prototypes/{result.designer}/{result.slug}/
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={handleReset}
            >
              Create another
            </Button>
            <Button
              onClick={() => (window.location.href = result.path)}
            >
              Open prototype
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-8">
      <Card className="max-w-lg w-full p-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-base-content mb-1">
            Create New Project
          </h2>
          <p className="text-base-content/60 text-sm">
            Scaffold a new prototype in your designer folder.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Designer */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-base-content">
              Designer <span className="text-primary">*</span>
            </label>
            <select
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
              required
              className={cn(
                "w-full px-3 py-2 rounded-md border border-base-300 bg-base-100 text-base-content text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "appearance-none"
              )}
            >
              <option value="">Select your name...</option>
              {designers.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value="__new__">+ Add new name</option>
            </select>

            {designer === "__new__" && (
              <Input
                value={customDesigner}
                onChange={(e) => setCustomDesigner(e.target.value)}
                placeholder="your-name (kebab-case)"
                required
                autoFocus
              />
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-base-content">
              Title <span className="text-primary">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Prototype"
              required
            />
            {previewPath && (
              <p className="text-xs text-base-content/40 font-mono">
                {previewPath}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-base-content">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this prototype demonstrates."
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-md border border-base-300 bg-base-100 text-base-content text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "resize-none placeholder:text-base-content/40"
              )}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-base-content">
              Tags
            </label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-base-content">
              Status
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm border transition-colors",
                    status === s
                      ? "border-primary bg-primary/15 text-primary font-medium"
                      : "border-base-300 text-base-content/60 hover:border-base-content/25"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {formStatus === "error" && errorMsg && (
            <div className="px-4 py-3 rounded-md bg-base-300 border border-base-300 text-sm text-base-content/60">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              formStatus === "submitting" ||
              !title ||
              !designer ||
              (designer === "__new__" && !customDesigner)
            }
          >
            {formStatus === "submitting" ? "Creating..." : "Create project"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
