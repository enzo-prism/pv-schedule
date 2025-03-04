import { useState } from "react";

export default function SponsorLogos() {
  // SVG-based minimalistic sponsor logos
  const sponsors = [
    { 
      name: "NikeTF", 
      svg: (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M21,7c0,0-4,3.5-8,3.5S5,7,3,7c0,3.5,2,7.5,6,7.5c2,0,3-0.5,4-1c1,0.5,2,1,4,1C21,14.5,21,7,21,7z" />
        </svg>
      )
    },
    { 
      name: "Adidas", 
      svg: (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M4.5,15.5l3-3l3,3l3-3l3,3l3-3v3l-3,3l-3-3l-3,3l-3-3l-3,3V15.5z" />
          <path d="M4.5,9.5l3-3l3,3l3-3l3,3l3-3v3l-3,3l-3-3l-3,3l-3-3l-3,3V9.5z" />
        </svg>
      )
    },
    { 
      name: "Puma", 
      svg: (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M5,12c0-2.2,1.8-4,4-4c1.5,0,2.9,0.9,3.5,2.2C13.1,8.9,14.5,8,16,8c1.7,0,3,1.3,3,3c0,1.2-0.7,2.2-1.8,2.7 C17.7,16.2,16,18,14,18c-2.2,0-4-1.8-4-4h-1C8.2,14,6.8,12.8,5,12z" />
        </svg>
      )
    },
    { 
      name: "New Balance", 
      svg: (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M5,7l2,10h2l1-5l1,5h2l5-10h-2l-3,7l-1-4h-1l-1,4L7,7H5z" />
        </svg>
      )
    },
    { 
      name: "Under Armour", 
      svg: (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M12,7c-3.9,0-7,3.1-7,7s3.1,7,7,7s7-3.1,7-7S15.9,7,12,7z M12,18c-2.2,0-4-1.8-4-4s1.8-4,4-4s4,1.8,4,4 S14.2,18,12,18z" />
          <circle cx="12" cy="14" r="2" />
        </svg>
      )
    }
  ];

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-gray-50 py-2 border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400 mr-2">Sponsors:</div>
          <div className={`flex items-center flex-grow justify-around md:justify-center md:space-x-8 overflow-hidden transition-all ${isExpanded ? 'flex-wrap' : 'flex-nowrap'}`}>
            {sponsors.map((sponsor, index) => (
              <div key={index} className="flex flex-col items-center group cursor-pointer mx-1">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 p-1 transition-colors">
                  {sponsor.svg}
                </div>
                <span className="mt-1 text-[10px] sm:text-xs text-gray-400 group-hover:text-gray-600 transition-colors">{sponsor.name}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-xs text-gray-400 hover:text-gray-600 ml-2 hidden sm:block"
            aria-label={isExpanded ? "Show fewer sponsors" : "Show more sponsors"}
          >
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}