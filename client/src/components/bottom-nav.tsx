import { Link, useLocation } from "wouter";
import { Home, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Meets", Icon: Home },
  { href: "/trends", label: "Trends", Icon: TrendingUp },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-around px-6 pt-2 safe-bottom">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = location === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-800"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-gray-900")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
