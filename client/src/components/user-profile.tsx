import React from "react";
// Import the image directly as a module (Vite will handle this)
import enzoProfilePic from "../assets/enzo-profile.png";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo Sison" }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between py-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-[22%] border border-white/10 bg-white/5 flex items-center justify-center">
          <img 
            src={enzoProfilePic}
            alt={`${name}'s profile`}
            className="h-14 w-14 object-cover scale-[1.08]"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error("Image failed to load:", target.src);
              target.onerror = null;
              target.style.display = 'none';
              
              // Insert fallback icon
              const parent = target.parentElement;
              if (parent) {
                const fallbackIcon = document.createElement('div');
                fallbackIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" /></svg>';
                parent.appendChild(fallbackIcon);
              }
            }}
          />
        </div>
        <div>
          <h2 className="text-base font-medium text-foreground">{name}</h2>
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">
              <a 
                href="https://www.filamsports.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline hover:text-white transition-colors"
              >
                🇵🇭 FilAm Sports
              </a>
            </p>
            <p className="text-[10px] text-muted-foreground/80">
              <a
                href="https://www.design-prism.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-white transition-colors"
              >
                engineered by prism in silicon valley
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
