export function InboxBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-[var(--inbox-dim)] px-2 py-0.5 text-xs font-medium text-[var(--inbox)]">
      {count} unsorted
    </span>
  );
}
