import { Clock } from "lucide-react";
import { Meet } from "@shared/schema";
import { useMemo } from "react";

interface CountdownTimerProps {
  meets: Meet[];
}

export default function CountdownTimer({ meets }: CountdownTimerProps) {
  // Find the next upcoming meet
  const nextMeet = useMemo(() => {
    if (!meets.length) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingMeets = meets
      .filter(meet => {
        // Parse date consistently to avoid timezone issues
        const meetDate = typeof meet.date === 'string' && meet.date.match(/^\d{4}-\d{2}-\d{2}$/)
          ? new Date(`${meet.date}T00:00:00`)
          : new Date(meet.date);
        
        return meetDate >= today;
      })
      .sort((a, b) => {
        const dateA = typeof a.date === 'string' && a.date.match(/^\d{4}-\d{2}-\d{2}$/)
          ? new Date(`${a.date}T00:00:00`)
          : new Date(a.date);
        
        const dateB = typeof b.date === 'string' && b.date.match(/^\d{4}-\d{2}-\d{2}$/)
          ? new Date(`${b.date}T00:00:00`)
          : new Date(b.date);
        
        return dateA.getTime() - dateB.getTime();
      });
    
    return upcomingMeets.length > 0 ? upcomingMeets[0] : null;
  }, [meets]);

  // Calculate days until the next meet
  const daysUntil = useMemo(() => {
    if (!nextMeet) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetDate = typeof nextMeet.date === 'string' && nextMeet.date.match(/^\d{4}-\d{2}-\d{2}$/)
      ? new Date(`${nextMeet.date}T00:00:00`)
      : new Date(nextMeet.date);
    
    // Calculate the difference in milliseconds and convert to days
    const diffTime = Math.abs(meetDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [nextMeet]);

  if (!nextMeet || daysUntil === null) {
    return null;
  }

  return (
    <div className="bg-secondary/5 px-3 py-1 text-xs text-center border-b border-secondary/10 flex items-center justify-center gap-1.5 w-full text-gray-600">
      <Clock className="h-3 w-3 text-secondary/60" />
      <span>
        <span className="font-medium">{daysUntil}</span> day{daysUntil !== 1 ? 's' : ''} until {nextMeet.name}
      </span>
    </div>
  );
}