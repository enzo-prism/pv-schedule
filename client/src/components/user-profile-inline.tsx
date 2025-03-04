import React from "react";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo" }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between py-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-800 flex items-center justify-center">
          {/* Simple face illustration inline SVG */}
          <svg 
            viewBox="0 0 50 50" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-11 w-11"
          >
            {/* Face outline */}
            <circle cx="25" cy="25" r="23" fill="white" />
            
            {/* Hair */}
            <path 
              d="M5,20 C5,10 15,5 25,5 C40,5 45,15 45,20 C45,25 40,30 40,30 L35,25 C35,25 45,15 35,10 C25,5 10,10 5,20z" 
              fill="black" 
            />
            
            {/* Glasses */}
            <circle cx="17" cy="22" r="5" fill="black" />
            <circle cx="33" cy="22" r="5" fill="black" />
            <rect x="17" y="17" width="16" height="5" fill="black" />
            
            {/* Ear */}
            <circle cx="5" cy="25" r="3" fill="white" />
            
            {/* Smile */}
            <path 
              d="M20,32 C20,35 25,38 30,32" 
              fill="transparent"
              stroke="black"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-800">{name}'s Meet Tracker</h2>
          <p className="text-xs text-gray-500">Track your upcoming track & field events</p>
        </div>
      </div>
    </div>
  );
}