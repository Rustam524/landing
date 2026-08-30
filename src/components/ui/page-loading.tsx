/**
 * Shown instantly by Next.js while a route segment's Server Component is
 * still fetching data — without this, navigation has no feedback at all
 * until the fetch completes, which reads as an unresponsive click.
 */
export function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary"
        role="status"
        aria-label="Загрузка"
      />
    </div>
  );
}
