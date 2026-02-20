import React from "react";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo Sison" }: UserProfileProps) {
  return (
    <div className="py-3">
      <h2 className="text-lg font-semibold text-foreground leading-tight">{name}</h2>
      <div className="space-y-0.5 mt-1">
        <p className="text-xs text-muted-foreground">
          <a 
            href="https://www.filamsports.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline hover:text-foreground transition-colors"
          >
            🇵🇭 FilAm Sports
          </a>
        </p>
        <p className="text-[11px] text-muted-foreground/70">
          <a
            href="https://www.design-prism.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-foreground transition-colors"
          >
            engineered by prism in silicon valley
          </a>
        </p>
      </div>
    </div>
  );
}
