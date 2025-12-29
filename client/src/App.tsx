import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MeetDetails from "@/pages/meet-details";
import Trends from "@/pages/trends";

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
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
