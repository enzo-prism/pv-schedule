import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FaUserCircle } from "react-icons/fa";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo" }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between py-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 rounded-full border-2 border-gray-200 shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            width="44"
            height="44"
            fill="none"
            className="absolute"
          >
            <circle cx="50" cy="50" r="45" fill="#000" />
            <path
              d="M30 35 C 30 35, 40 20, 65 30 C 80 36, 75 60, 70 65 C 65 70, 50 75, 35 70 C 25 67, 15 55, 30 35"
              fill="#000"
              stroke="#000"
              strokeWidth="1"
            />
            <circle cx="50" cy="45" r="10" fill="#000" />
            <rect
              x="40"
              y="43"
              width="20"
              height="10"
              rx="2"
              fill="#000"
              stroke="#fff"
              strokeWidth="1"
            />
            <path
              d="M45 55 C 45 55, 48 60, 55 55"
              fill="none"
              stroke="#fff"
              strokeWidth="1"
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