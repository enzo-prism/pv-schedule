import { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MeetDetails from "@/pages/meet-details";
import Trends from "@/pages/trends";
import Cycle from "@/pages/cycle";
import CycleWeek from "@/pages/cycle-week";
import CycleDay from "@/pages/cycle-day";
import { normalizeAnalyticsEvent, normalizeAnalyticsPath } from "@/lib/analytics";

const CompetitionMap = lazy(() => import("@/pages/map"));

function Router() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/meet/:id" component={MeetDetails} />
        <Route path="/map" component={CompetitionMap} />
        <Route path="/trends" component={Trends} />
        <Route path="/cycle" component={Cycle} />
        <Route path="/cycle/week/:week/day/:day" component={CycleDay} />
        <Route path="/cycle/week/:week" component={CycleWeek} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [location] = useLocation();
  const analyticsPath = normalizeAnalyticsPath(location);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Router />
        <Analytics
          beforeSend={normalizeAnalyticsEvent}
          mode={import.meta.env.DEV ? "development" : "production"}
          path={analyticsPath}
          route={analyticsPath}
        />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
