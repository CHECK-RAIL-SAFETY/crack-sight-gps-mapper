
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createScanSession } from "@/services/supabaseService";
import { toast } from "sonner";

interface SessionManagerProps {
  onSessionCreated: (sessionId: string, name: string) => void;
}

const SessionManager = ({ onSessionCreated }: SessionManagerProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a session name");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const session = await createScanSession(name, description);
      if (session) {
        toast.success(`Session "${name}" created successfully`);
        onSessionCreated(session.id, session.name);
        setIsOpen(false);
        setName("");
        setDescription("");
      } else {
        toast.error("Failed to create session");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("An error occurred while creating the session");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="bg-card shadow-md">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Start Railway Inspection</h2>
          <p className="text-muted-foreground">
            Create a new scan session to organize your railway inspection data
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Create New Scan Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Scan Session</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Session Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Railway Section A Inspection"
                  disabled={isCreating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about this inspection..."
                  disabled={isCreating}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={isCreating || !name.trim()}>
                  {isCreating ? "Creating..." : "Create Session"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SessionManager;
