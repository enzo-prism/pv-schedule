import React from "react";

interface IconProps {
  className?: string;
}

export const HeightIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Abstract minimalist height measurement icon */}
    <path d="M12 4L12 20" />
    <path d="M8 7L16 7" />
    <path d="M9 12L15 12" />
    <path d="M7 17L17 17" />
  </svg>
);

export const PoleIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Abstract minimalist pole icon */}
    <path d="M7 4L17 20" />
    <path d="M12 4L12 8" />
    <path d="M10 14.5L14 14.5" />
  </svg>
);

export const TakeoffIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Abstract minimalist takeoff icon */}
    <path d="M5 19L19 19" />
    <path d="M12 5V14" />
    <path d="M8 10L16 10" />
    <path d="M17 13L12 14L7 13" />
  </svg>
);

export const PlaceIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Abstract minimalist place/ranking icon */}
    <path d="M12 7L14 10L18 11L15 14L16 18L12 16L8 18L9 14L6 11L10 10L12 7Z" />
    <path d="M8 4H16" />
  </svg>
);