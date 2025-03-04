import React from "react";
import { FaUserCircle } from "react-icons/fa";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo" }: UserProfileProps) {
  // Get base64 directly from the image to ensure it always works
  const profileImageBase64 = "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";

  return (
    <div className="flex items-center justify-between py-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm bg-white flex items-center justify-center">
          <img 
            src={`data:image/png;base64,${profileImageBase64}`}
            alt={`${name}'s profile`}
            className="h-12 w-12 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
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
          <h2 className="text-lg font-medium text-gray-800">{name}'s Meet Tracker</h2>
          <p className="text-xs text-gray-500">Track your upcoming track & field events</p>
        </div>
      </div>
    </div>
  );
}