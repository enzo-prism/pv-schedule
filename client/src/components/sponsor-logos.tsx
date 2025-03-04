import { useState } from "react";

export default function SponsorLogos() {
  // SVG-based minimalistic sponsor logos
  const sponsors = [
    { 
      name: "FilAm Sports", 
      svg: (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M5,5h14v2H5V5z M5,11h14v2H5V11z M5,17h14v2H5V17z" />
        </svg>
      )
    },
    { 
      name: "Prism", 
      svg: (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M12,4L4,8l8,4l8-4L12,4z M4,12l8,4l8-4v4l-8,4l-8-4V12z" />
        </svg>
      )
    },
    { 
      name: "Tesla", 
      svg: (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M12,4C6.5,4,5,8,5,12h4.5v-1h5v1H19C19,8,17.5,4,12,4z M12,5c3.5,0,5,2.5,5,6h-1.5v-1h-7v1H7 C7,7.5,8.5,5,12,5z M8,13v7h8v-7H8z" />
        </svg>
      )
    },
    { 
      name: "Elevate Compliance", 
      svg: (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M12,3L4,9v12h16V9L12,3z M12,5.5l5,3.8V19h-2v-7H9v7H7V9.2L12,5.5z M11,14h2v5h-2V14z" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-full bg-gray-50 py-2 border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center">
          <div className="text-xs text-gray-400 mr-4 whitespace-nowrap">Sponsors:</div>
          <div className="flex items-center justify-center w-full">
            <div className="grid grid-cols-4 gap-2 sm:gap-8 w-full max-w-lg">
              {sponsors.map((sponsor, index) => (
                <div key={index} className="flex flex-col items-center group cursor-pointer">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 p-1.5 transition-colors">
                    {sponsor.svg}
                  </div>
                  <span className="mt-1 text-[10px] sm:text-xs text-gray-400 group-hover:text-gray-600 transition-colors text-center">{sponsor.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}