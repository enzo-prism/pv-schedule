import React from "react";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo" }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between py-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm bg-white flex items-center justify-center">
          {/* Simple face illustration inline SVG */}
          <svg 
            viewBox="0 0 100 100" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
          >
            {/* Face shape */}
            <path
              d="M85,50 C85,70 70,85 50,85 C30,85 15,70 15,50 C15,20 30,15 50,15 C70,15 85,20 85,50z"
              fill="white"
              stroke="black"
              strokeWidth="2"
            />
            
            {/* Hair */}
            <path 
              d="M15,45 C15,20 30,15 50,15 C70,15 85,20 85,45 C85,45 80,30 70,25 C60,20 40,20 30,25 C20,30 15,45 15,45z" 
              fill="black" 
            />
            
            {/* Glasses */}
            <circle cx="35" cy="45" r="10" fill="black" />
            <circle cx="65" cy="45" r="10" fill="black" />
            <rect x="35" y="35" width="30" height="10" fill="black" />
            
            {/* Ear */}
            <path 
              d="M15,50 C15,50 10,55 10,60 C10,65 15,65 15,60 L15,50z" 
              fill="white"
              stroke="black"
              strokeWidth="1"
            />
            
            {/* Smile */}
            <path 
              d="M40,65 C40,70 50,75 60,65" 
              fill="transparent"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
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