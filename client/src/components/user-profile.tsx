import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo" }: UserProfileProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Reset image states when component mounts
    setImageLoaded(false);
    setImageError(false);
    
    // Preload image to check if it's available
    const img = new Image();
    img.src = "/images/enzo-profile.png";
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
  }, []);

  return (
    <div className="flex items-center justify-between py-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm bg-white flex items-center justify-center">
          {!imageError ? (
            <img 
              src="/images/enzo-profile.png" 
              alt={`${name}'s profile`}
              className={`h-12 w-12 object-contain ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ transition: 'opacity 0.2s ease-in-out' }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <FaUserCircle className="h-12 w-12 text-gray-400" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-800">{name}'s Meet Tracker</h2>
          <p className="text-xs text-gray-500">Track your upcoming track & field events</p>
        </div>
      </div>
    </div>
  );
}