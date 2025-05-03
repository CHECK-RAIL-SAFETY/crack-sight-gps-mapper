import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GpsLogEntry, ProcessedFrame, Prediction, RoboflowResponse } from "@/types";
import { toast } from "sonner";
import { saveProcessedFrame, updateSessionStats } from "@/services/supabaseService";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface FrameListProps {
  frames: File[];
  gpsData: GpsLogEntry[];
  onFrameProcess: (processedFrame: ProcessedFrame) => void;
  isProcessing: boolean;
  sessionId?: string;
}

const FrameList = ({ frames, gpsData, onFrameProcess, isProcessing, sessionId }: FrameListProps) => {
  const [processingFrames, setProcessingFrames] = useState<Set<string>>(new Set());
  const [processedCount, setProcessedCount] = useState(0);
  const [crackCount, setCrackCount] = useState(0);
  const [frameWithoutGps, setFrameWithoutGps] = useState<string[]>([]);

  useEffect(() => {
    // Update session stats when counts change and we have a sessionId
    if (sessionId) {
      updateSessionStats(sessionId, frames.length, processedCount, crackCount)
        .catch(error => console.error("Error updating session stats:", error));
    }
  }, [sessionId, frames.length, processedCount, crackCount]);

  const detectCracks = async (imageBlob: Blob): Promise<{
    hasCrack: boolean;
    predictions: Prediction[];
    confidence?: number;
  }> => {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob);
      
      const response = await fetch(
        'https://detect.roboflow.com/railway-crack-detection/15?api_key=FYe8IvPwEEQ19V0hf0jr',
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '5';
          await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
          return detectCracks(imageBlob);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json() as RoboflowResponse;
      const predictions = data.predictions || [];
      
      return {
        hasCrack: predictions.length > 0,
        predictions: predictions,
        confidence: predictions.length > 0 ? predictions[0].confidence : undefined,
      };
    } catch (error) {
      console.error('Error detecting cracks:', error);
      throw error;
    }
  };

  const findGpsDataForFrame = (frameId: string): GpsLogEntry | null => {
    // Extract the frame timestamp (assuming format like "123.jpg")
    const second = parseInt(frameId.split(".")[0]);
    
    // First try exact match
    let match = gpsData.find((entry) => entry.second === second);
    
    // If no exact match, try to find the closest timestamp
    if (!match && gpsData.length > 0) {
      // Sort by closest time difference
      const sorted = [...gpsData].sort((a, b) => 
        Math.abs(a.second - second) - Math.abs(b.second - second)
      );
      
      // Use the closest match if it's within 5 seconds
      if (Math.abs(sorted[0].second - second) <= 5) {
        match = sorted[0];
        console.log(`No exact GPS match for frame ${frameId}, using closest match at second ${match.second}`);
      }
    }
    
    return match;
  };

  const processFrame = async (frame: File) => {
    try {
      const frameId = frame.name;
      const gpsEntry = findGpsDataForFrame(frameId);
      
      if (!gpsEntry) {
        toast.error(`No GPS data found for frame ${frameId}`);
        setFrameWithoutGps(prev => [...prev, frameId]);
        return;
      }

      setProcessingFrames((prev) => new Set(prev).add(frameId));
      
      // Create object URL for the image
      const imageUrl = URL.createObjectURL(frame);
      
      // Run crack detection
      const { hasCrack, predictions, confidence } = await detectCracks(frame);
      
      // Create a processed frame object
      const processedFrame: ProcessedFrame = {
        frameId,
        imagePath: imageUrl,
        latitude: gpsEntry.latitude,
        longitude: gpsEntry.longitude,
        predictions: predictions,
        hasCrack,
        confidence: confidence || 0,
        class: predictions.length > 0 ? predictions[0].class : "",
        sessionId
      };
      
      // Process the image with bounding boxes if predictions exist
      if (hasCrack && predictions.length > 0) {
        console.log("Drawing bounding boxes for frame:", frameId, "with predictions:", predictions);
        // Get the image dimensions for drawing bounding boxes accurately
        const img = new Image();
        img.src = imageUrl;
        await new Promise(resolve => {
          img.onload = resolve;
        });
        
        const dimensions = { width: img.width, height: img.height };
        const processedImageUrl = await drawBoundingBoxes(frame, predictions, dimensions);
        processedFrame.processedImageUrl = processedImageUrl;
        console.log("Processed image URL created:", processedImageUrl ? "yes" : "no");
      }
      
      // Save to Supabase if we have a sessionId
      if (sessionId) {
        const frameId = await saveProcessedFrame(processedFrame, sessionId);
        if (frameId) {
          processedFrame.id = frameId;
        }
      }
      
      onFrameProcess(processedFrame);
      setProcessedCount(prevCount => prevCount + 1);
      
      if (hasCrack) {
        setCrackCount(prevCount => prevCount + 1);
      }
      
      toast.success(`Frame ${frameId} processed successfully`);
    } catch (error) {
      console.error(`Error processing frame:`, error);
      toast.error(`Error processing frame: ${(error as Error).message}`);
    } finally {
      setProcessingFrames((prev) => {
        const updated = new Set(prev);
        updated.delete(frame.name);
        return updated;
      });
    }
  };

  const drawBoundingBoxes = async (
    imageFile: File, 
    predictions: Prediction[], 
    dimensions: {width: number, height: number}
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          console.error("Could not get canvas context");
          resolve(URL.createObjectURL(imageFile));
          return;
        }
        
        // Use actual image dimensions from loaded image
        canvas.width = img.width;
        canvas.height = img.height;
        
        console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
        console.log("Drawing original image to canvas");
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Draw bounding boxes
        ctx.strokeStyle = "#00FFFF"; // Cyan color
        ctx.lineWidth = 3;
        ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
        
        predictions.forEach((pred) => {
          if (typeof pred.x === 'number' && 
              typeof pred.y === 'number' && 
              typeof pred.width === 'number' && 
              typeof pred.height === 'number') {
                
            const x = pred.x * canvas.width;
            const y = pred.y * canvas.height;
            const width = pred.width * canvas.width;
            const height = pred.height * canvas.height;
            
            console.log("Drawing bounding box:", x, y, width, height);
            
            ctx.strokeRect(x - width/2, y - height/2, width, height);
            ctx.fillRect(x - width/2, y - height/2, width, height);
            
            // Add confidence text
            ctx.font = "16px Arial";
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            const text = `${pred.class} ${(pred.confidence * 100).toFixed(1)}%`;
            ctx.strokeText(text, x - width/2, y - height/2 - 5);
            ctx.fillText(text, x - width/2, y - height/2 - 5);
          } else {
            console.warn("Invalid prediction data:", pred);
          }
        });
        
        // Convert canvas to URL with high quality
        const processedImageUrl = canvas.toDataURL("image/jpeg", 0.95);
        console.log("Processed image URL created with length:", processedImageUrl.length);
        resolve(processedImageUrl);
      };
      
      img.onerror = () => {
        console.error("Error loading image for bounding box drawing");
        resolve(URL.createObjectURL(imageFile));
      };
    });
  };

  const isFrameProcessing = (frameId: string) => {
    return processingFrames.has(frameId);
  };

  const hasNoGpsData = (frameId: string) => {
    return frameWithoutGps.includes(frameId);
  };

  const sortedFrames = [...frames].sort((a, b) => {
    const aName = parseInt(a.name.split(".")[0]);
    const bName = parseInt(b.name.split(".")[0]);
    return aName - bName;
  });

  const processAllFrames = async () => {
    // Process frames in sequence to avoid overwhelming the API
    for (const frame of sortedFrames) {
      if (!processingFrames.has(frame.name) && !hasNoGpsData(frame.name)) {
        await processFrame(frame);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Uploaded Frames</h2>
        <div className="flex gap-2">
          <Button 
            onClick={processAllFrames}
            disabled={isProcessing || processingFrames.size > 0}
            variant="secondary"
          >
            Process All Frames
          </Button>
        </div>
      </div>
      
      {gpsData.length === 0 && frames.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No GPS Data Available</AlertTitle>
          <AlertDescription>
            Please upload a GPS log file to match with frames before processing.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFrames.map((frame) => {
          const frameId = frame.name;
          const gpsEntry = findGpsDataForFrame(frameId);
          const imageUrl = URL.createObjectURL(frame);
          const noGpsMatch = hasNoGpsData(frameId);
          
          return (
            <Card key={frameId} className="overflow-hidden">
              <div className="aspect-video bg-black relative">
                <img
                  src={imageUrl}
                  alt={`Frame ${frameId}`}
                  className="object-contain w-full h-full"
                />
                {gpsEntry && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
                    Frame {frameId} • {gpsEntry.latitude.toFixed(6)}, {gpsEntry.longitude.toFixed(6)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <Button 
                  className="w-full"
                  onClick={() => processFrame(frame)}
                  disabled={isProcessing || isFrameProcessing(frameId) || !gpsEntry || noGpsMatch}
                >
                  {isFrameProcessing(frameId) ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Run Inference"
                  )}
                </Button>
                {!gpsEntry && (
                  <p className="text-destructive text-xs mt-2 text-center">
                    No matching GPS data found
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FrameList;
