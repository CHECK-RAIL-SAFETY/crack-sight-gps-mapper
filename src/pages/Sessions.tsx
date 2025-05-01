
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSessions, getSessionFrames } from "@/services/supabaseService";
import { ScanSession, ProcessedFrame } from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResultsTable from "@/components/ResultsTable";
import MapView from "@/components/MapView";

const Sessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ScanSession | null>(null);
  const [sessionFrames, setSessionFrames] = useState<ProcessedFrame[]>([]);
  const [loadingFrames, setLoadingFrames] = useState(false);
  
  useEffect(() => {
    loadSessions();
  }, []);
  
  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };
  
  const loadSessionFrames = async (session: ScanSession) => {
    setSelectedSession(session);
    setLoadingFrames(true);
    try {
      const frames = await getSessionFrames(session.id);
      setSessionFrames(frames);
    } catch (error) {
      console.error("Error loading session frames:", error);
      toast.error("Failed to load session frames");
    } finally {
      setLoadingFrames(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-700';
      case 'failed':
        return 'bg-red-500/20 text-red-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Inspection Sessions</h1>
          <p className="text-muted-foreground">
            View and manage your railway inspection sessions
          </p>
        </div>
        <Button onClick={() => navigate("/")}>New Inspection</Button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-4 md:col-span-1">
          <h2 className="text-2xl font-semibold mb-4">Previous Sessions</h2>
          
          {loading ? (
            <Card className="p-6">
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            </Card>
          ) : sessions.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground py-8">No sessions found.</p>
            </Card>
          ) : (
            sessions.map(session => (
              <Card 
                key={session.id}
                className={`overflow-hidden cursor-pointer transition-all ${selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => loadSessionFrames(session)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{session.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Frames</p>
                      <p className="font-semibold">{session.totalFrames}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Processed</p>
                      <p className="font-semibold">{session.processedFrames}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cracks</p>
                      <p className="font-semibold">{session.totalCracks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <div className="md:col-span-2">
          {selectedSession ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{selectedSession.name}</h2>
                <Badge className={getStatusColor(selectedSession.status)}>
                  {selectedSession.status.replace('_', ' ')}
                </Badge>
              </div>
              
              {loadingFrames ? (
                <Card className="p-6">
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                </Card>
              ) : sessionFrames.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground py-16">No frames found for this session.</p>
                </Card>
              ) : (
                <Tabs defaultValue="map" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="map">Map View</TabsTrigger>
                    <TabsTrigger value="table">Table View</TabsTrigger>
                  </TabsList>
                  <TabsContent value="map">
                    <MapView results={sessionFrames} />
                  </TabsContent>
                  <TabsContent value="table">
                    <ResultsTable results={sessionFrames} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          ) : (
            <Card className="p-6 text-center h-full flex items-center justify-center">
              <div>
                <p className="text-muted-foreground mb-4">
                  Select a session to view its details
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sessions;
