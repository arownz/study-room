import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { RequireRoleSelected } from "@/components/auth/RequireRoleSelected";
import { AuthProvider } from "@/contexts/auth-context";
import Dashboard from "@/pages/Dashboard";
import Notes from "@/pages/Notes";
import Flashcards from "@/pages/Flashcards";
import StudyRooms from "@/pages/StudyRooms";
import AITutor from "@/pages/AITutor";
import Whiteboard from "@/pages/Whiteboard";
import Pomodoro from "@/pages/Pomodoro";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Onboarding from "@/pages/Onboarding";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  return (
    <RequireAuth>
      <RequireRoleSelected>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/notes/:noteId" component={Notes} />
            <Route path="/notes" component={Notes} />
            <Route path="/flashcards/deck/:deckId" component={Flashcards} />
            <Route path="/flashcards/card/:flashcardId" component={Flashcards} />
            <Route path="/flashcards" component={Flashcards} />
            <Route path="/rooms/:roomId" component={StudyRooms} />
            <Route path="/rooms" component={StudyRooms} />
            <Route path="/ai-tutor" component={AITutor} />
            <Route path="/whiteboard/:whiteboardId" component={Whiteboard} />
            <Route path="/whiteboard" component={Whiteboard} />
            <Route path="/pomodoro" component={Pomodoro} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </RequireRoleSelected>
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/onboarding" component={Onboarding} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
