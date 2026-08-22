"use client";

import { useDictionary } from "@/lib/i18n/dictionary-provider";

type CommentRow = {
  id: string;
  text: string;
  hidden: boolean;
  created_at: string;
  author: { id: string; full_name: string } | null;
};

export function CommentList({ comments }: { comments: CommentRow[] }) {
  const { dict, language } = useDictionary();

  if (comments.length === 0) {
    return <p className="text-sm text-brand-text-muted">{dict.common.noData}</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-lg border border-brand-border p-3">
          <div className="flex items-center justify-between text-xs text-brand-text-muted">
            <span className="font-medium text-brand-ink">
              {comment.author?.full_name ?? "—"}
            </span>
            <span>
              {new Date(comment.created_at).toLocaleString(language === "ru" ? "ru-RU" : "kk-KZ", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-brand-ink whitespace-pre-wrap">
            {comment.hidden ? (
              <em className="text-brand-text-muted">{dict.tasks.hiddenComment}</em>
            ) : (
              comment.text
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
