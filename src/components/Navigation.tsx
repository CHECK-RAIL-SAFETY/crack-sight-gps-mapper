
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
            <div className="relative">
              <img 
                src="/lovable-uploads/0abec741-34d7-4460-baca-3eef50f6755d.png" 
                alt="tracksense logo" 
                className="h-8 w-auto"
              />
            </div>
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
