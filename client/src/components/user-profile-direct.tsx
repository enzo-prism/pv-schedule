import React from "react";
import { FaUserCircle } from "react-icons/fa";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo" }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between py-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm flex items-center justify-center bg-white">
          <img 
            src="/enzo-profile.png" 
            alt={`${name}'s profile`}
            className="h-10 w-10 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.style.display = 'none';
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