
import { useEffect, useState } from "react";
import FileUploader from "@/components/FileUploader";
import FrameList from "@/components/FrameList";
import ResultsTable from "@/components/ResultsTable";
import MapView from "@/components/MapView";
import { GpsLogEntry, ProcessedFrame } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [frames, setFrames] = useState<File[]>([]);
  const [gpsLog, setGpsLog] = useState<File | null>(null);
  const [gpsData, setGpsData] = useState<GpsLogEntry[]>([]);
  const [results, setResults] = useState<ProcessedFrame[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFramesUploaded = (files: FileList) => {
    // Convert FileList to array and filter for image files
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.name.match(/^\d+\.jpg$/i)
    );
    
    setFrames(imageFiles);
  };

  const handleGpsLogUploaded = (file: File) => {
    setGpsLog(file);
    parseGpsLog(file);
  };

  const parseGpsLog = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        // Skip header line
        const dataLines = lines.slice(1);
        
        const parsedData: GpsLogEntry[] = [];
        
        for (const line of dataLines) {
          if (!line.trim()) continue;
          
          const [second, latitude, longitude, accuracy] = line.split(',');
          
          if (!second || !latitude || !longitude || !accuracy) continue;
          
          parsedData.push({
            second: parseInt(second.trim()),
            latitude: parseFloat(latitude.trim()),
            longitude: parseFloat(longitude.trim()),
            accuracy: parseFloat(accuracy.trim())
          });
        }
        
        setGpsData(parsedData);
        toast.success(`Loaded ${parsedData.length} GPS points`);
      } catch (error) {
        console.error("Error parsing GPS log:", error);
        toast.error("Error parsing GPS log file. Please check the format.");
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

  const uploadToSupabase = async () => {
    // This function would upload the data to Supabase
    // For now, just show a toast success message
    toast.success("Results saved successfully!");
  };

  return (
    <div className="container py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Railway Crack Detection</h1>
        <p className="text-muted-foreground">
          Upload frames and GPS data to detect railway cracks using AI
        </p>
      </header>

      <div className="space-y-8">
        <Card className="p-6 bg-card">
          <FileUploader 
            onFramesUploaded={handleFramesUploaded}
            onGpsLogUploaded={handleGpsLogUploaded}
            isUploading={isUploading}
          />
        </Card>

        {frames.length > 0 && gpsData.length > 0 && (
          <FrameList 
            frames={frames}
            gpsData={gpsData}
            onFrameProcess={handleFrameProcessed}
            isProcessing={isProcessing}
          />
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
      </div>
    </div>
  );
};

export default Index;
