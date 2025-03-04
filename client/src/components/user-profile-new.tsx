import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FaUserCircle } from "react-icons/fa";

interface UserProfileProps {
  name?: string;
}

export default function UserProfile({ name = "Enzo" }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between py-4 mb-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-gray-200 shadow-sm">
          <AvatarFallback className="bg-gray-100 text-gray-800">
            <FaUserCircle className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-medium text-gray-800">{name}'s Meet Tracker</h2>
          <p className="text-xs text-gray-500">Track your upcoming track & field events</p>
        </div>
      </div>
    </div>
  );
}