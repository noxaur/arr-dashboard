"use client";

export function EventsPagination({
  page,
  totalPages,
  onSetPage,
}: {
  page: number;
  totalPages: number;
  onSetPage: (p: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        onClick={() => onSetPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
      >
        Previous
      </button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        let pageNum: number;
        if (totalPages <= 7) {
          pageNum = i + 1;
        } else if (page <= 4) {
          pageNum = i + 1;
        } else if (page >= totalPages - 3) {
          pageNum = totalPages - 6 + i;
        } else {
          pageNum = page - 3 + i;
        }
        return (
          <button
            key={pageNum}
            onClick={() => onSetPage(pageNum)}
            className={`rounded px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none ${
              pageNum === page
                ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
            }`}
          >
            {pageNum}
          </button>
        );
      })}
      <button
        onClick={() => onSetPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
      >
        Next
      </button>
      <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
