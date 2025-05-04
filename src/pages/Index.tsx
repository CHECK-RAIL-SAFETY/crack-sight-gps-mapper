
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileUploader from "@/components/FileUploader";
import FrameList from "@/components/FrameList";
import ResultsTable from "@/components/ResultsTable";
import MapView from "@/components/MapView";
import SessionManager from "@/components/SessionManager";
import { GpsLogEntry, ProcessedFrame } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveGpsLogs, completeSession } from "@/services/supabaseService";
import GpsAlert from "@/components/GpsAlert";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const navigate = useNavigate();
  const [frames, setFrames] = useState<File[]>([]);
  const [gpsLog, setGpsLog] = useState<File | null>(null);
  const [gpsData, setGpsData] = useState<GpsLogEntry[]>([]);
  const [results, setResults] = useState<ProcessedFrame[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSession, setActiveSession] = useState<{ id: string; name: string } | null>(null);
  const [gpsParseError, setGpsParseError] = useState<string | null>(null);

  const handleFramesUploaded = (files: FileList) => {
    // Convert FileList to array and filter for image files
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.name.match(/^\d+\.jpg$/i)
    );
    
    setFrames(imageFiles);
    
    if (imageFiles.length === 0) {
      toast.warning("No valid frame images found. Frame images should be named like 0.jpg, 1.jpg, etc.");
    } else {
      toast.success(`Uploaded ${imageFiles.length} frames`);
    }
  };

  const handleGpsLogUploaded = (file: File) => {
    setGpsLog(file);
    setGpsParseError(null);
    parseGpsLog(file);
  };

  const parseGpsLog = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        // Skip header line
        const dataLines = lines.slice(1);
        
        const parsedData: GpsLogEntry[] = [];
        let parseErrors = 0;
        
        for (const line of dataLines) {
          if (!line.trim()) continue;
          
          const [second, latitude, longitude, accuracy] = line.split(',');
          
          if (!second || !latitude || !longitude || !accuracy) {
            parseErrors++;
            continue;
          }
          
          parsedData.push({
            second: parseInt(second.trim()),
            latitude: parseFloat(latitude.trim()),
            longitude: parseFloat(longitude.trim()),
            accuracy: parseFloat(accuracy.trim())
          });
        }
        
        if (parsedData.length === 0) {
          setGpsParseError("No valid GPS data found in the file. Please check the format.");
          toast.error("Failed to parse GPS data");
          return;
        }
        
        if (parseErrors > 0) {
          toast.warning(`Parsed GPS data with ${parseErrors} invalid entries`);
        }
        
        setGpsData(parsedData);
        
        // Save GPS logs to Supabase if we have an active session
        if (activeSession && activeSession.id) {
          try {
            await saveGpsLogs(parsedData, activeSession.id);
            toast.success(`Loaded and saved ${parsedData.length} GPS points`);
          } catch (error) {
            console.error("Error saving GPS logs:", error);
            toast.error("Error saving GPS log data to database");
          }
        } else {
          toast.success(`Loaded ${parsedData.length} GPS points`);
        }
      } catch (error) {
        console.error("Error parsing GPS log:", error);
        setGpsParseError("Error parsing GPS log file. Please check the format.");
        toast.error("Error parsing GPS log file");
      }
    };
    
    reader.readAsText(file);
  };

  const handleFrameProcessed = (processedFrame: ProcessedFrame) => {
    setResults(prev => {
      // Remove any existing result with the same frameId
      const filteredResults = prev.filter(r => r.frameId !== processedFrame.frameId);
      return [...filteredResults, processedFrame];
    });
  };

  const handleSessionCreated = (sessionId: string, name: string) => {
    setActiveSession({ id: sessionId, name });
  };

  const handleFinishSession = async () => {
    if (!activeSession) return;
    
    try {
      await completeSession(activeSession.id);
      toast.success(`Session "${activeSession.name}" completed successfully`);
      
      // Navigate to the sessions page
      navigate("/sessions");
    } catch (error) {
      console.error("Error completing session:", error);
      toast.error("Failed to complete session");
    }
  };

  return (
    <div className="container py-8 max-w-7xl">
      <header className="mb-8 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img 
            src="/lovable-uploads/0abec741-34d7-4460-baca-3eef50f6755d.png" 
            alt="tracksense logo" 
            className="h-10 w-auto"
          />
          <h1 className="text-4xl font-bold">tracksense.</h1>
        </div>
        <p className="text-muted-foreground">
          Upload frames and GPS data to detect railway cracks using AI
        </p>
      </header>

      <div className="space-y-8">
        {!activeSession ? (
          <SessionManager onSessionCreated={handleSessionCreated} />
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">Active Session: {activeSession.name}</h2>
                <p className="text-muted-foreground">
                  Upload frames and GPS data for this inspection session
                </p>
              </div>
              <Button onClick={handleFinishSession}>Finish Session</Button>
            </div>

            <Card className="p-6 bg-card">
              <FileUploader 
                onFramesUploaded={handleFramesUploaded}
                onGpsLogUploaded={handleGpsLogUploaded}
                isUploading={isUploading}
              />
            </Card>

            {gpsParseError && (
              <Alert variant="destructive">
                <AlertTitle>GPS Data Error</AlertTitle>
                <AlertDescription>{gpsParseError}</AlertDescription>
              </Alert>
            )}

            {frames.length > 0 && (
              <>
                {gpsData.length === 0 ? (
                  <GpsAlert type="required" />
                ) : (
                  <FrameList 
                    frames={frames}
                    gpsData={gpsData}
                    onFrameProcess={handleFrameProcessed}
                    isProcessing={isProcessing}
                    sessionId={activeSession.id}
                  />
                )}
              </>
            )}

            {results.length > 0 && (
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="map">Map View</TabsTrigger>
                </TabsList>
                <TabsContent value="table">
                  <ResultsTable results={results} />
                </TabsContent>
                <TabsContent value="map">
                  <MapView results={results} />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
