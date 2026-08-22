/** Replaces `{key}` placeholders in a translated string, e.g. format("{level}-й уровень", { level: 2 }). */
export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}
