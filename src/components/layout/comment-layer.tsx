"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/layout/user-menu";
import type { PrototypeMeta, CommentAuthor } from "@/lib/types";
import { cn, displayName, formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  x: number; // percentage of content area width
  y: number; // percentage of content area height
  text: string;
  createdAt: string;
  resolved: boolean;
  author?: CommentAuthor;
}

interface CommentLayerProps {
  meta: PrototypeMeta | null;
  designer: string;
  slug: string;
  children: React.ReactNode;
}

export function CommentLayer({ meta, designer, slug, children }: CommentLayerProps) {
  const { data: session } = useSession();
  const [commentMode, setCommentMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [pendingText, setPendingText] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/comments?designer=${encodeURIComponent(designer)}&slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data); })
      .catch(() => {});
  }, [designer, slug]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleCommentMode = () => {
    setCommentMode((m) => {
      if (m) {
        setPendingPin(null);
        setPendingText("");
        setActiveCommentId(null);
      }
      return !m;
    });
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!commentMode) return;
    if (pendingPin) return;
    // Ignore clicks on pins or popovers
    if ((e.target as HTMLElement).closest("[data-comment-ui]")) return;
    const rect = contentRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPin({ x, y });
    setPendingText("");
    setActiveCommentId(null);
  };

  const submitComment = () => {
    if (!pendingPin || !pendingText.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      x: pendingPin.x,
      y: pendingPin.y,
      text: pendingText.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
      author: session?.user
        ? { name: session.user.name ?? null, image: session.user.image ?? null }
        : undefined,
    };
    setComments((prev) => [...prev, comment]);
    setPendingPin(null);
    setPendingText("");
    fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designer, slug, comment }),
    }).catch(() => {});
  };

  const cancelPending = () => {
    setPendingPin(null);
    setPendingText("");
  };

  const resolveComment = (id: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)));
    if (activeCommentId === id) setActiveCommentId(null);
    fetch("/api/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designer, slug, id }),
    }).catch(() => {});
  };

  const deleteComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    if (activeCommentId === id) setActiveCommentId(null);
    fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designer, slug, id }),
    }).catch(() => {});
  };

  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center gap-4 bg-white shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <Icon name="arrow-left" size={16} />
          <span className="text-sm">Back</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-text-primary truncate">
            {meta?.title ?? displayName(slug)}
          </h1>
          <p className="text-xs text-text-tertiary">
            {displayName(designer)}
            {meta?.date && ` · ${formatDate(meta.date)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {meta?.status && (
            <Badge variant={meta.status === "complete" ? "status" : "default"}>
              {meta.status}
            </Badge>
          )}
          {meta?.tags?.map((tag) => (
            <Badge key={tag} variant="subtle">
              {tag}
            </Badge>
          ))}
          <div className="h-4 w-px bg-border mx-1" />
          {/* New project */}
          <Link
            href="/prototypes/claude-bot/create-new-project"
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          >
            <Icon name="plus" size={14} />
            <span>New project</span>
          </Link>
          {/* Copy URL */}
          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          >
            <Icon name={copied ? "check" : "link"} size={14} />
            <span>{copied ? "Copied!" : "Copy URL"}</span>
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          {/* Comment mode toggle */}
          <button
            onClick={toggleCommentMode}
            title={commentMode ? "Exit comment mode (Esc)" : "Add comment"}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium transition-colors",
              commentMode
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary hover:text-text-primary"
            )}
          >
            <Icon name="message-circle" size={14} />
            <span>{commentMode ? "Commenting" : "Comment"}</span>
          </button>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            title="View all comments"
            className={cn(
              "relative flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium transition-colors",
              sidebarOpen
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary hover:text-text-primary"
            )}
          >
            <Icon name="panel-right" size={14} />
            <span>Comments</span>
            {unresolvedCount > 0 && (
              <span
                className={cn(
                  "ml-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1",
                  sidebarOpen ? "bg-white/30 text-white" : "bg-accent text-white"
                )}
              >
                {unresolvedCount}
              </span>
            )}
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          <UserMenu />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content with overlay */}
        <div
          ref={contentRef}
          className={cn("flex-1 relative overflow-auto", commentMode && "cursor-crosshair")}
          onClick={handleContentClick}
        >
          {children}

          {/* Existing pins */}
          {comments.map((comment, index) => (
            <CommentPin
              key={comment.id}
              comment={comment}
              index={index + 1}
              isActive={activeCommentId === comment.id}
              onActivate={() =>
                setActiveCommentId(activeCommentId === comment.id ? null : comment.id)
              }
              onResolve={() => resolveComment(comment.id)}
              onDelete={() => deleteComment(comment.id)}
            />
          ))}

          {/* Pending pin */}
          {pendingPin && (
            <PendingPin
              x={pendingPin.x}
              y={pendingPin.y}
              text={pendingText}
              onTextChange={setPendingText}
              onSubmit={submitComment}
              onCancel={cancelPending}
            />
          )}

          {/* Hint bar */}
          {commentMode && !pendingPin && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none select-none">
              Click anywhere to add a comment · Esc to exit
            </div>
          )}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <CommentSidebar
            comments={comments}
            activeId={activeCommentId}
            onActivate={setActiveCommentId}
            onResolve={resolveComment}
            onDelete={deleteComment}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── Comment Pin ──────────────────────────────────────────────────────────────

interface CommentPinProps {
  comment: Comment;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onResolve: () => void;
  onDelete: () => void;
}

function CommentPin({ comment, index, isActive, onActivate, onResolve, onDelete }: CommentPinProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onActivate(); // toggles off
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isActive, onActivate]);

  return (
    <div
      ref={ref}
      data-comment-ui
      className="absolute z-20"
      style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
    >
      {/* Pin bubble */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onActivate();
        }}
        title={`Comment ${index}`}
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2 border-white transition-transform hover:scale-110 -translate-x-1/2 -translate-y-1/2",
          comment.resolved
            ? "bg-bg-tertiary text-text-tertiary"
            : "bg-accent text-white"
        )}
      >
        {index}
      </button>

      {/* Popover */}
      {isActive && (
        <div
          data-comment-ui
          className="absolute top-3 left-4 z-30 w-64 bg-white rounded-lg shadow-card-hover border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3">
            {comment.author?.name && (
              <div className="flex items-center gap-1.5 mb-1.5">
                {comment.author.image ? (
                  <img src={comment.author.image} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-accent/20 text-accent text-[8px] font-bold flex items-center justify-center">
                    {comment.author.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-text-secondary">{comment.author.name}</span>
              </div>
            )}
            <p className="text-sm text-text-primary leading-relaxed">{comment.text}</p>
            <p className="text-xs text-text-tertiary mt-1.5">
              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="border-t border-border px-3 py-2 flex items-center gap-2">
            <button
              onClick={onResolve}
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 h-6 rounded transition-colors",
                comment.resolved
                  ? "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                  : "text-green-600 hover:bg-green-50"
              )}
            >
              <Icon name="check" size={12} />
              {comment.resolved ? "Reopen" : "Resolve"}
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-xs font-medium px-2 h-6 rounded text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors ml-auto"
            >
              <Icon name="trash" size={12} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pending Pin ──────────────────────────────────────────────────────────────

interface PendingPinProps {
  x: number;
  y: number;
  text: string;
  onTextChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function PendingPin({ x, y, text, onTextChange, onSubmit, onCancel }: PendingPinProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      data-comment-ui
      className="absolute z-30"
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pin */}
      <div className="w-7 h-7 rounded-full bg-accent border-2 border-white shadow-md flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <Icon name="message-circle" size={12} className="text-white" />
      </div>
      {/* Input popover */}
      <div className="absolute top-3 left-4 w-64 bg-white rounded-lg shadow-card-hover border border-border">
        <div className="p-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment… (Enter to post)"
            rows={3}
            className="w-full text-sm text-text-primary placeholder:text-text-tertiary resize-none outline-none leading-relaxed"
          />
        </div>
        <div className="border-t border-border px-3 py-2 flex items-center justify-between gap-2">
          <span className="text-xs text-text-tertiary">Shift+Enter for newline</span>
          <div className="flex gap-1.5">
            <button
              onClick={onCancel}
              className="text-xs font-medium px-2 h-6 rounded text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!text.trim()}
              className="text-xs font-medium px-2 h-6 rounded bg-accent text-white disabled:opacity-40 hover:bg-accent-hover transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

interface CommentSidebarProps {
  comments: Comment[];
  activeId: string | null;
  onActivate: (id: string | null) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function CommentSidebar({
  comments,
  activeId,
  onActivate,
  onResolve,
  onDelete,
  onClose,
}: CommentSidebarProps) {
  const unresolved = comments.filter((c) => !c.resolved);
  const resolved = comments.filter((c) => c.resolved);

  return (
    <aside className="w-72 border-l border-border bg-white flex flex-col shrink-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          Comments
          {unresolved.length > 0 && (
            <span className="ml-2 text-xs font-normal text-text-tertiary">
              {unresolved.length} open
            </span>
          )}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-bg-secondary text-text-tertiary hover:text-text-primary transition-colors"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
            <Icon name="message-circle" size={32} className="text-text-tertiary mb-3" />
            <p className="text-sm font-medium text-text-secondary">No comments yet</p>
            <p className="text-xs text-text-tertiary mt-1">
              Enable comment mode and click anywhere on the prototype to add one.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {unresolved.length > 0 && (
              <>
                {unresolved.map((comment) => {
                  const index = comments.indexOf(comment) + 1;
                  return (
                    <SidebarItem
                      key={comment.id}
                      comment={comment}
                      index={index}
                      isActive={activeId === comment.id}
                      onActivate={() => onActivate(activeId === comment.id ? null : comment.id)}
                      onResolve={() => onResolve(comment.id)}
                      onDelete={() => onDelete(comment.id)}
                    />
                  );
                })}
              </>
            )}

            {resolved.length > 0 && (
              <>
                <div className="px-2 pt-3 pb-1">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    Resolved
                  </p>
                </div>
                {resolved.map((comment) => {
                  const index = comments.indexOf(comment) + 1;
                  return (
                    <SidebarItem
                      key={comment.id}
                      comment={comment}
                      index={index}
                      isActive={activeId === comment.id}
                      onActivate={() => onActivate(activeId === comment.id ? null : comment.id)}
                      onResolve={() => onResolve(comment.id)}
                      onDelete={() => onDelete(comment.id)}
                    />
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  comment: Comment;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onResolve: () => void;
  onDelete: () => void;
}

function SidebarItem({ comment, index, isActive, onActivate, onResolve, onDelete }: SidebarItemProps) {
  return (
    <div
      className={cn(
        "rounded-md p-2.5 cursor-pointer transition-colors",
        isActive ? "bg-accent-light" : "hover:bg-bg-secondary",
        comment.resolved && "opacity-50"
      )}
      onClick={onActivate}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5",
            comment.resolved ? "bg-bg-tertiary text-text-tertiary" : "bg-accent"
          )}
        >
          {index}
        </span>
        <div className="flex-1 min-w-0">
          {comment.author?.name && (
            <p className="text-xs font-medium text-text-secondary mb-0.5">{comment.author.name}</p>
          )}
          <p className="text-sm text-text-primary leading-snug line-clamp-3">{comment.text}</p>
          <p className="text-xs text-text-tertiary mt-1">
            {new Date(comment.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 ml-7" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onResolve}
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 h-5 rounded transition-colors",
            comment.resolved
              ? "text-text-secondary hover:bg-bg-tertiary"
              : "text-green-600 hover:bg-green-50"
          )}
        >
          <Icon name="check" size={10} />
          {comment.resolved ? "Reopen" : "Resolve"}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 text-xs font-medium px-2 h-5 rounded text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors ml-auto"
        >
          <Icon name="trash" size={10} />
          Delete
        </button>
      </div>
    </div>
  );
}
