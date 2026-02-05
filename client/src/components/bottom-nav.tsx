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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-card/50 backdrop-blur-xl"
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
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "text-muted-foreground hover:text-white"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-transparent transition-colors",
                  isActive ? "bg-white/10 border-white/10" : "bg-transparent",
                )}
                aria-hidden="true"
              >
                <Icon className={cn("h-5 w-5", isActive && "text-white")} />
              </span>
              <span className={cn("text-[11px]", isActive && "text-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
