"use client";

import { useActionState, useRef } from "react";
import { addComment, type CommentFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea, FieldError } from "@/components/ui/input";
import { useDictionary } from "@/lib/i18n/dictionary-provider";

export function AddCommentForm({ taskId }: { taskId: string }) {
  const { dict } = useDictionary();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<CommentFormState, FormData>(
    async (prevState, formData) => {
      const result = await addComment(prevState, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    undefined,
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="taskId" value={taskId} />
      <Textarea name="text" placeholder={dict.tasks.commentPlaceholder} rows={2} required />
      <FieldError>{state?.error}</FieldError>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? dict.common.processing : dict.tasks.addComment}
      </Button>
    </form>
  );
}
