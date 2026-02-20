import { CalendarDays } from "lucide-react";
import FilterSection from "@/components/filter-section";
import UserProfile from "@/components/user-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CyclePhase = {
  week: number;
  window: string;
  phase: string;
};

const cyclePhases: CyclePhase[] = [
  { week: 1, window: "Feb 22 - 28", phase: "Speed/Comp Phase (emphasis Speed)" },
  { week: 2, window: "March 1 - 7", phase: "Speed/Comp Phase (emphasis Speed)" },
  { week: 3, window: "March 8 - 14", phase: "Speed/Comp Phase (emphasis Speed)" },
  { week: 4, window: "March 15 - 21", phase: "Comp/Speed Phase (emphasis Comps)" },
  { week: 5, window: "March 22 – 28", phase: "Comp/Speed Phase (emphasis Comps)" },
  { week: 6, window: "March 29 – April 4", phase: "Active Rest" },
  { week: 7, window: "April 5 – 11", phase: "Load week 1" },
  { week: 8, window: "April 12 – 18", phase: "Load week 2" },
  { week: 9, window: "April 19 – 25", phase: "Load week 3" },
  { week: 10, window: "April 26 – May 2", phase: "Active Rest" },
  { week: 11, window: "May 3 - 9", phase: "Transition" },
  { week: 12, window: "May 10 - 16", phase: "Transition" },
  { week: 13, window: "May 17 – 23", phase: "Speed/Peak" },
  { week: 14, window: "May 24-30", phase: "Speed/Peak" },
  { week: 15, window: "June 1 – 6", phase: "Speed/Peak" },
  { week: 16, window: "June 7 – 15", phase: "National Champs" },
];

export default function Cycle() {
  return (
    <div className="min-h-screen bg-background relative pb-app-nav">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-7 pb-16">
        <section className="sticky top-0 z-30 rounded-b-3xl border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <UserProfile name="Enzo Sison" />
            <FilterSection
              currentPage="cycle"
              className="self-start sm:self-auto"
            />
          </div>
        </section>

        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2026 Cycle Plan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Phase focus for the upcoming season based on your outline.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Weekly focus blocks from Feb 22 through June 15, 2026
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-white/10">
                {cyclePhases.map((entry) => (
                  <div
                    key={entry.week}
                    className="flex items-start gap-4 px-4 py-3 sm:py-4"
                  >
                    <div className="w-14 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-center text-xs font-medium text-white/80">
                      W{entry.week}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">
                        {entry.window}
                      </div>
                      <div className="text-sm text-muted-foreground">{entry.phase}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
