import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import { Meet } from "@shared/schema";
import { format } from "date-fns";

interface MeetCardProps {
  meet: Meet;
}

export default function MeetCard({ meet }: MeetCardProps) {
  const isPastDate = (dateString: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetDate = new Date(dateString);
    return meetDate < today;
  };

  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), "EEEE, MMMM d, yyyy");
  };

  const isPast = isPastDate(meet.date);
  const statusClass = isPast ? "text-gray-400" : "text-green-600";
  const statusText = isPast ? "Past" : "Upcoming";

  return (
    <Card className="overflow-hidden border border-accent shadow-sm meet-transition">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{meet.name}</h3>
          <span className={`${statusClass} text-xs font-medium px-2 py-1 bg-gray-100 rounded-full`}>
            {statusText}
          </span>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <Calendar className="text-secondary h-4 w-4 mr-1" />
          <span>{formatDate(meet.date)}</span>
        </div>
        <div className="mt-1 flex items-center text-sm text-gray-600">
          <MapPin className="text-secondary h-4 w-4 mr-1" />
          <span>{meet.location}</span>
        </div>
        {meet.description && (
          <div className="mt-3 pt-3 border-t border-accent">
            <p className="text-sm text-gray-600">{meet.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
