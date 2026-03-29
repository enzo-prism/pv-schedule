import React from "react";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo Sison" }: UserProfileProps) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
        <span>2026 Season</span>
        <span className="hidden h-1 w-1 rounded-full bg-white/15 sm:inline-block" aria-hidden="true" />
        <a
          href="https://www.filamsports.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-normal normal-case tracking-normal text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-0"
        >
          FilAm Sports
        </a>
      </div>
      <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-tight text-foreground text-pretty sm:text-[1.85rem]">
        {name}
      </h2>
    </div>
  );
}
