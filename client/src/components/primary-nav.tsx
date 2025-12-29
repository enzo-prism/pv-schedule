import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Schedule", href: "/" },
  { label: "Trends", href: "/trends" },
];

export default function PrimaryNav() {
  const [location] = useLocation();

  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-sm">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? location === "/" : location.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
