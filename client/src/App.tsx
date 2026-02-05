import { Switch, Route, useLocation } from "wouter";
import { Plus } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MeetDetails from "@/pages/meet-details";
import Trends from "@/pages/trends";
import BottomNav from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { isReadOnlyMode } from "@/lib/env";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/meet/:id" component={MeetDetails} />
      <Route path="/trends" component={Trends} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  const isReadOnly = isReadOnlyMode;
  const showFab = !isReadOnly && !location.startsWith("/meet/");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen pb-app-nav">
        <Router />
        {showFab && (
          <Button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("add", "1");
              const search = params.toString();
              setLocation(search ? `/?${search}` : "/?add=1");
            }}
            className="fixed left-1/2 z-50 -translate-x-1/2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg"
            style={{
              bottom:
                "calc(var(--app-bottom-nav-height) + env(safe-area-inset-bottom) + 12px)",
            }}
            aria-label="Add meet"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add meet
          </Button>
        )}
        <BottomNav />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
