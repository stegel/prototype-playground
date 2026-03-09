"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/layout/user-menu";
import { DarkModeToggle } from "@/components/layout/dark-mode-toggle";
import type { PrototypeMeta, CommentAuthor } from "@/lib/types";
import { cn, displayName, formatDate } from "@/lib/utils";

interface Reply {
  id: string;
  text: string;
  createdAt: string;
  author?: CommentAuthor;
}

interface Comment {
  id: string;
  x: number; // percentage of content area width
  y: number; // percentage of content area height
  text: string;
  createdAt: string;
  resolved: boolean;
  author?: CommentAuthor;
  replies?: Reply[];
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);

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

  const replyToComment = (commentId: string, text: string) => {
    const reply: Reply = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      author: session?.user
        ? { name: session.user.name ?? null, image: session.user.image ?? null }
        : undefined,
    };
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c
      )
    );
    fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designer, slug, comment: reply, parentId: commentId }),
    }).catch(() => {});
  };

  const deleteReply = (commentId: string, replyId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== replyId) }
          : c
      )
    );
    fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designer, slug, id: replyId, parentId: commentId }),
    }).catch(() => {});
  };

  const openEditModal = () => {
    setEditDescription(meta?.description ?? "");
    setEditModalOpen(true);
    editModalRef.current?.showModal();
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    editModalRef.current?.close();
  };

  const saveDescription = async () => {
    setEditSaving(true);
    try {
      await fetch(`/api/prototypes/${encodeURIComponent(designer)}/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription }),
      });
      closeEditModal();
    } finally {
      setEditSaving(false);
    }
  };

  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-base-300 px-6 py-3 flex items-center gap-4 bg-base-100 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-base-content/60 hover:text-base-content transition-colors"
        >
          <Icon name="arrow-left" size={16} />
          <span className="text-sm">Back</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-base-content truncate">
            {meta?.title ?? displayName(slug)}
          </h1>
          <p className="text-xs text-base-content/40">
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
          {/* Edit prototype */}
          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium bg-base-200 text-base-content/60 border border-base-300 hover:bg-base-300 hover:text-base-content transition-colors"
          >
            <Icon name="edit" size={14} />
            <span>Edit prototype</span>
          </button>
          {/* New project */}
          <Link
            href="/prototypes/claude-bot/create-new-project"
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium bg-base-200 text-base-content/60 border border-base-300 hover:bg-base-300 hover:text-base-content transition-colors"
          >
            <Icon name="plus" size={14} />
            <span>New project</span>
          </Link>
          {/* Copy URL */}
          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium bg-base-200 text-base-content/60 border border-base-300 hover:bg-base-300 hover:text-base-content transition-colors"
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
                ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content/60 border border-base-300 hover:bg-base-300 hover:text-base-content"
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
                ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content/60 border border-base-300 hover:bg-base-300 hover:text-base-content"
            )}
          >
            <Icon name="panel-right" size={14} />
            <span>Comments</span>
            {unresolvedCount > 0 && (
              <span
                className={cn(
                  "ml-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1",
                  sidebarOpen ? "bg-white/30 text-white" : "bg-primary text-primary-content"
                )}
              >
                {unresolvedCount}
              </span>
            )}
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          <DarkModeToggle />
          <UserMenu />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content with overlay */}
        <div
          ref={contentRef}
          className={cn("flex-1 relative overflow-auto bg-base-100", commentMode && "cursor-crosshair")}
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
              onReply={(text) => replyToComment(comment.id, text)}
              onDeleteReply={(replyId) => deleteReply(comment.id, replyId)}
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

      {/* Edit prototype modal */}
      <dialog ref={editModalRef} className="modal" onClose={closeEditModal}>
        <div className="modal-box bg-base-100 border border-base-300">
          <h3 className="text-base font-semibold text-base-content mb-1">Edit prototype</h3>
          <p className="text-xs text-base-content/40 mb-4">{meta?.title ?? slug}</p>
          <label className="block text-sm font-medium text-base-content/60 mb-1.5">
            Description
          </label>
          <textarea
            className="textarea textarea-bordered w-full text-sm text-base-content bg-base-200 border-base-300 resize-none"
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Describe what this prototype demonstrates…"
          />
          <div className="modal-action mt-4">
            <button
              onClick={closeEditModal}
              className="btn btn-ghost btn-sm text-base-content/60"
            >
              Cancel
            </button>
            <button
              onClick={saveDescription}
              disabled={editSaving}
              className="btn btn-sm bg-primary text-primary-content hover:bg-primary/80 border-0"
            >
              {editSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeEditModal}>close</button>
        </form>
      </dialog>
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
  onReply: (text: string) => void;
  onDeleteReply: (replyId: string) => void;
}

function CommentPin({ comment, index, isActive, onActivate, onResolve, onDelete, onReply, onDeleteReply }: CommentPinProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const replyPickerRef = useRef<HTMLDivElement>(null);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [replySuggestions, setReplySuggestions] = useState<Array<{ key: string; emoji: string }>>([]);
  const [replyShortcodeStart, setReplyShortcodeStart] = useState<number | null>(null);
  const [replyActiveSuggestion, setReplyActiveSuggestion] = useState(0);

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

  // Focus reply textarea when opened
  useEffect(() => {
    if (replyOpen) replyInputRef.current?.focus();
  }, [replyOpen]);

  // Reset reply state when popover closes
  useEffect(() => {
    if (!isActive) {
      setReplyOpen(false);
      setReplyText("");
      setShowReplyEmojiPicker(false);
      setReplySuggestions([]);
    }
  }, [isActive]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showReplyEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (replyPickerRef.current && !replyPickerRef.current.contains(e.target as Node)) {
        setShowReplyEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReplyEmojiPicker]);

  const insertReplyEmoji = (emoji: string, replaceFrom?: number) => {
    const textarea = replyInputRef.current;
    const cursorPos = textarea?.selectionStart ?? replyText.length;
    const start = replaceFrom ?? cursorPos;
    const newText = replyText.slice(0, start) + emoji + replyText.slice(cursorPos);
    setReplyText(newText);
    setReplySuggestions([]);
    setReplyShortcodeStart(null);
    setShowReplyEmojiPicker(false);
    const newPos = start + emoji.length;
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handleReplyTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(val);
    const cursor = e.target.selectionStart;
    const textUpToCursor = val.slice(0, cursor);
    const colonIdx = textUpToCursor.lastIndexOf(":");
    if (colonIdx !== -1 && colonIdx < cursor) {
      const query = textUpToCursor.slice(colonIdx + 1);
      if (/^[a-z_]*$/.test(query)) {
        const suggestions = getShortcodeSuggestions(query);
        setReplySuggestions(suggestions);
        setReplyShortcodeStart(colonIdx);
        setReplyActiveSuggestion(0);
        return;
      }
    }
    setReplySuggestions([]);
    setReplyShortcodeStart(null);
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (replySuggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setReplyActiveSuggestion((a) => Math.min(a + 1, replySuggestions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setReplyActiveSuggestion((a) => Math.max(a - 1, 0)); return; }
      if (e.key === "Tab" || (e.key === "Enter" && replySuggestions.length > 0)) {
        e.preventDefault();
        insertReplyEmoji(replySuggestions[replyActiveSuggestion].emoji, replyShortcodeStart ?? undefined);
        return;
      }
      if (e.key === "Escape") { setReplySuggestions([]); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); }
    if (e.key === "Escape") { setReplyOpen(false); setReplyText(""); }
  };

  const submitReply = () => {
    if (!replyText.trim()) return;
    onReply(replyText.trim());
    setReplyText("");
    setReplyOpen(false);
  };

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
            ? "bg-base-300 text-base-content/40"
            : "bg-primary text-primary-content"
        )}
      >
        {index}
      </button>

      {/* Popover */}
      {isActive && (
        <div
          data-comment-ui
          className="absolute top-3 left-4 z-30 w-72 bg-base-100 rounded-lg shadow-md border border-base-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Original comment */}
          <div className="p-3">
            {comment.author?.name && (
              <div className="flex items-center gap-1.5 mb-1.5">
                {comment.author.image ? (
                  <img src={comment.author.image} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[8px] font-bold flex items-center justify-center">
                    {comment.author.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-base-content/60">{comment.author.name}</span>
              </div>
            )}
            <p className="text-sm text-base-content leading-relaxed">{comment.text}</p>
            <p className="text-xs text-base-content/40 mt-1.5">
              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="border-t border-base-300">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="px-3 py-2 flex items-start gap-2 group">
                  <div className="shrink-0 mt-0.5">
                    {reply.author?.image ? (
                      <img src={reply.author.image} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-base-300 flex items-center justify-center text-[8px] font-bold text-base-content/40">
                        {reply.author?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {reply.author?.name && (
                      <span className="text-xs font-medium text-base-content/60">{reply.author.name} </span>
                    )}
                    <span className="text-xs text-base-content leading-relaxed">{reply.text}</span>
                    <p className="text-[10px] text-base-content/40 mt-0.5">
                      {new Date(reply.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteReply(reply.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-base-content/40 hover:text-red-600 transition-all"
                    title="Delete reply"
                  >
                    <Icon name="trash" size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Reply input */}
          {replyOpen && (
            <div className="border-t border-base-300 p-3">
              {/* Shortcode suggestions */}
              {replySuggestions.length > 0 && (
                <div className="mb-1.5 flex flex-wrap gap-0.5 bg-base-200 rounded p-1">
                  {replySuggestions.map((s, i) => (
                    <button
                      key={s.key}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertReplyEmoji(s.emoji, replyShortcodeStart ?? undefined);
                      }}
                      title={`:${s.key}:`}
                      className={cn(
                        "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors",
                        i === replyActiveSuggestion
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-200 text-base-content/60"
                      )}
                    >
                      <span className="text-base leading-none">{s.emoji}</span>
                      <span className="text-base-content/40">{s.key}</span>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                ref={replyInputRef}
                value={replyText}
                onChange={handleReplyTextChange}
                onKeyDown={handleReplyKeyDown}
                placeholder="Reply… (Enter to post, :emoji: for emojis)"
                rows={2}
                className="w-full text-sm text-base-content placeholder:text-base-content/40 resize-none outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-1.5">
                <div className="relative" ref={replyPickerRef}>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowReplyEmojiPicker((v) => !v);
                    }}
                    title="Insert emoji"
                    className="text-base leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-base-200 transition-colors"
                  >
                    😊
                  </button>
                  {showReplyEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-1 w-64 bg-base-100 rounded-lg shadow-md border border-base-300 z-40 overflow-hidden">
                      <div className="max-h-52 overflow-y-auto p-2 space-y-2">
                        {EMOJI_CATEGORIES.map((cat) => (
                          <div key={cat.name}>
                            <p className="text-[10px] font-semibold text-base-content/40 uppercase tracking-wide mb-1 px-1">
                              {cat.name}
                            </p>
                            <div className="flex flex-wrap gap-0.5">
                              {cat.emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    insertReplyEmoji(emoji);
                                  }}
                                  className="text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-base-200 transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setReplyOpen(false); setReplyText(""); }}
                    className="text-xs font-medium px-2 h-6 rounded text-base-content/60 hover:bg-base-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReply}
                    disabled={!replyText.trim()}
                    className="text-xs font-medium px-2 h-6 rounded bg-primary text-primary-content disabled:opacity-40 hover:bg-primary/80 transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-base-300 px-3 py-2 flex items-center gap-2">
            <button
              onClick={() => setReplyOpen((r) => !r)}
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 h-6 rounded transition-colors",
                replyOpen
                  ? "bg-primary/10 text-primary"
                  : "text-base-content/60 hover:bg-base-200"
              )}
            >
              <Icon name="message-circle" size={12} />
              Reply{comment.replies?.length ? ` · ${comment.replies.length}` : ""}
            </button>
            <button
              onClick={onResolve}
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 h-6 rounded transition-colors",
                comment.resolved
                  ? "text-base-content/60 hover:text-base-content hover:bg-base-200"
                  : "text-green-600 hover:bg-green-50"
              )}
            >
              <Icon name="check" size={12} />
              {comment.resolved ? "Reopen" : "Resolve"}
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-xs font-medium px-2 h-6 rounded text-base-content/40 hover:text-red-600 hover:bg-red-50 transition-colors ml-auto"
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

// ── Emoji Data ───────────────────────────────────────────────────────────────

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😂", "😊", "😍", "🤔", "😅", "😎", "🥳", "😢", "😡", "😴", "🤗", "🥺", "😏", "😤"],
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👋", "👏", "🙌", "💪", "🤝", "✌️", "🤞", "💯", "🙏", "👀", "✍️", "🫡", "🤌"],
  },
  {
    name: "Symbols",
    emojis: ["❤️", "🔥", "✨", "💡", "🎉", "🎊", "⭐", "💫", "🚀", "🌟", "✅", "❌", "⚠️", "💬", "📝"],
  },
  {
    name: "People",
    emojis: ["👮‍♀️", "👮‍♂️", "👩‍💻", "👨‍💻", "🧑‍🎨", "🕵️‍♀️", "🕵️‍♂️", "💂‍♀️", "💂‍♂️", "👷‍♀️", "🧑‍🔬", "🧑‍⚕️"],
  },
];

const SHORTCODES: Record<string, string> = {
  smile: "😊",
  laughing: "😂",
  lol: "😂",
  grin: "😀",
  thinking: "🤔",
  sunglasses: "😎",
  party: "🥳",
  sad: "😢",
  angry: "😡",
  sleepy: "😴",
  hug: "🤗",
  pleading: "🥺",
  thumbsup: "👍",
  thumbsdown: "👎",
  wave: "👋",
  clap: "👏",
  raise_hands: "🙌",
  muscle: "💪",
  handshake: "🤝",
  v: "✌️",
  crossed_fingers: "🤞",
  "100": "💯",
  pray: "🙏",
  eyes: "👀",
  write: "✍️",
  salute: "🫡",
  pinched: "🤌",
  heart: "❤️",
  fire: "🔥",
  sparkles: "✨",
  bulb: "💡",
  tada: "🎉",
  confetti: "🎊",
  star: "⭐",
  dizzy: "💫",
  rocket: "🚀",
  glowing_star: "🌟",
  check: "✅",
  white_check_mark: "✅",
  x: "❌",
  warning: "⚠️",
  speech_balloon: "💬",
  memo: "📝",
  policewoman: "👮‍♀️",
  policeman: "👮‍♂️",
  woman_technologist: "👩‍💻",
  man_technologist: "👨‍💻",
  artist: "🧑‍🎨",
  detective_woman: "🕵️‍♀️",
  detective_man: "🕵️‍♂️",
  guard_woman: "💂‍♀️",
  guard_man: "💂‍♂️",
  construction_worker_woman: "👷‍♀️",
  scientist: "🧑‍🔬",
  doctor: "🧑‍⚕️",
};

function getShortcodeSuggestions(query: string): Array<{ key: string; emoji: string }> {
  if (!query) return [];
  const lower = query.toLowerCase();
  return Object.entries(SHORTCODES)
    .filter(([key]) => key.startsWith(lower))
    .slice(0, 8)
    .map(([key, emoji]) => ({ key, emoji }));
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
  const pickerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ key: string; emoji: string }>>([]);
  const [shortcodeStart, setShortcodeStart] = useState<number | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  const insertEmoji = (emoji: string, replaceFrom?: number) => {
    const textarea = inputRef.current;
    const cursorPos = textarea?.selectionStart ?? text.length;
    const start = replaceFrom ?? cursorPos;
    const newText = text.slice(0, start) + emoji + text.slice(cursorPos);
    onTextChange(newText);
    setSuggestions([]);
    setShortcodeStart(null);
    setShowEmojiPicker(false);
    const newPos = start + emoji.length;
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onTextChange(newText);

    const cursorPos = e.target.selectionStart ?? newText.length;
    const textBeforeCursor = newText.slice(0, cursorPos);
    const colonIdx = textBeforeCursor.lastIndexOf(":");

    if (colonIdx !== -1) {
      const query = textBeforeCursor.slice(colonIdx + 1);
      // Only show suggestions for single-word queries after ":"
      if (!query.includes(" ") && query.length >= 1) {
        const matches = getShortcodeSuggestions(query);
        if (matches.length > 0) {
          setSuggestions(matches);
          setShortcodeStart(colonIdx);
          setActiveSuggestion(0);
          return;
        }
      }
    }

    setSuggestions([]);
    setShortcodeStart(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && suggestions.length > 0)) {
        e.preventDefault();
        insertEmoji(suggestions[activeSuggestion].emoji, shortcodeStart ?? undefined);
        return;
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        setShortcodeStart(null);
        return;
      }
    }

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
      <div className="w-7 h-7 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <Icon name="message-circle" size={12} className="text-white" />
      </div>

      {/* Input popover */}
      <div className="absolute top-3 left-4 w-72 bg-base-100 rounded-lg shadow-md border border-base-300">
        {/* Shortcode suggestions */}
        {suggestions.length > 0 && (
          <div className="border-b border-base-300 px-2 py-1.5 flex flex-wrap gap-0.5">
            {suggestions.map((s, i) => (
              <button
                key={s.key}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertEmoji(s.emoji, shortcodeStart ?? undefined);
                }}
                title={`:${s.key}:`}
                className={cn(
                  "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors",
                  i === activeSuggestion
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-base-200 text-base-content/60"
                )}
              >
                <span className="text-base leading-none">{s.emoji}</span>
                <span className="text-base-content/40">{s.key}</span>
              </button>
            ))}
          </div>
        )}

        <div className="p-3 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment… (Enter to post, :emoji: for emojis)"
            rows={3}
            className="w-full text-sm text-base-content placeholder:text-base-content/40 resize-none outline-none leading-relaxed"
          />
        </div>

        <div className="border-t border-base-300 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" ref={pickerRef}>
            <div className="relative">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowEmojiPicker((v) => !v);
                }}
                title="Insert emoji"
                className="text-base leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-base-200 transition-colors"
              >
                😊
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-1 w-64 bg-base-100 rounded-lg shadow-md border border-base-300 z-40 overflow-hidden">
                  <div className="max-h-52 overflow-y-auto p-2 space-y-2">
                    {EMOJI_CATEGORIES.map((cat) => (
                      <div key={cat.name}>
                        <p className="text-[10px] font-medium text-base-content/40 uppercase tracking-wide px-1 mb-1">
                          {cat.name}
                        </p>
                        <div className="flex flex-wrap gap-0.5">
                          {cat.emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                insertEmoji(emoji);
                              }}
                              className="text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-base-200 transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-xs text-base-content/40">Shift+Enter for newline</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onCancel}
              className="text-xs font-medium px-2 h-6 rounded text-base-content/60 hover:bg-base-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!text.trim()}
              className="text-xs font-medium px-2 h-6 rounded bg-primary text-primary-content disabled:opacity-40 hover:bg-primary/80 transition-colors"
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
    <aside className="w-72 border-l border-base-300 bg-base-100 flex flex-col shrink-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-base-300 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-content">
          Comments
          {unresolved.length > 0 && (
            <span className="ml-2 text-xs font-normal text-base-content/40">
              {unresolved.length} open
            </span>
          )}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-base-200 text-base-content/40 hover:text-base-content transition-colors"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
            <Icon name="message-circle" size={32} className="text-base-content/40 mb-3" />
            <p className="text-sm font-medium text-base-content/60">No comments yet</p>
            <p className="text-xs text-base-content/40 mt-1">
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
                  <p className="text-xs font-medium text-base-content/40 uppercase tracking-wide">
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
        isActive ? "bg-primary/15" : "hover:bg-base-200",
        comment.resolved && "opacity-50"
      )}
      onClick={onActivate}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5",
            comment.resolved ? "bg-base-300 text-base-content/40" : "bg-primary"
          )}
        >
          {index}
        </span>
        <div className="flex-1 min-w-0">
          {comment.author?.name && (
            <p className="text-xs font-medium text-base-content/60 mb-0.5">{comment.author.name}</p>
          )}
          <p className="text-sm text-base-content leading-snug line-clamp-3">{comment.text}</p>
          <p className="text-xs text-base-content/40 mt-1">
            {new Date(comment.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
          {comment.replies && comment.replies.length > 0 && (
            <p className="text-xs text-base-content/40 mt-0.5 flex items-center gap-1">
              <Icon name="message-circle" size={10} />
              {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 ml-7" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onResolve}
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 h-5 rounded transition-colors",
            comment.resolved
              ? "text-base-content/60 hover:bg-base-300"
              : "text-green-600 hover:bg-green-50"
          )}
        >
          <Icon name="check" size={10} />
          {comment.resolved ? "Reopen" : "Resolve"}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 text-xs font-medium px-2 h-5 rounded text-base-content/40 hover:text-red-600 hover:bg-red-50 transition-colors ml-auto"
        >
          <Icon name="trash" size={10} />
          Delete
        </button>
      </div>
    </div>
  );
}
