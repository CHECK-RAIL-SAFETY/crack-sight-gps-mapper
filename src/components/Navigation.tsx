
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LogIn } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 w-full border-b">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M9 19c-2 0-4-1-4-3v-8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2"></path>
              <path d="M11 11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1z"></path>
              <path d="M18 16v.5a2.5 2.5 0 0 0 5 0v-.5"></path>
              <path d="M10.5 19H10"></path>
              <path d="M14 19h-1.5"></path>
              <path d="M14 22H9a9 9 0 0 1-9-9V7a5 5 0 0 1 5-5h14"></path>
            </svg>
            <span className="font-bold">Railway Crack Detection</span>
          </Link>
        </div>
        <div className="ml-auto flex gap-1">
          {user ? (
            <>
              <Button asChild variant={location.pathname === "/" ? "default" : "ghost"} size="sm">
                <Link to="/">New Inspection</Link>
              </Button>
              <Button asChild variant={location.pathname === "/sessions" ? "default" : "ghost"} size="sm">
                <Link to="/sessions">View Sessions</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" /> Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
