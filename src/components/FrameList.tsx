
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GpsLogEntry, ProcessedFrame, Prediction } from "@/types";
import { toast } from "sonner";

interface FrameListProps {
  frames: File[];
  gpsData: GpsLogEntry[];
  onFrameProcess: (processedFrame: ProcessedFrame) => void;
  isProcessing: boolean;
}

const FrameList = ({ frames, gpsData, onFrameProcess, isProcessing }: FrameListProps) => {
  const [processingFrames, setProcessingFrames] = useState<Set<string>>(new Set());

  const findGpsDataForFrame = (frameId: string): GpsLogEntry | null => {
    const second = parseInt(frameId.split(".")[0]);
    return gpsData.find((entry) => entry.second === second) || null;
  };

  const processFrame = async (frame: File) => {
    try {
      const frameId = frame.name;
      const gpsEntry = findGpsDataForFrame(frameId);
      
      if (!gpsEntry) {
        toast.error(`No GPS data found for frame ${frameId}`);
        return;
      }

      setProcessingFrames((prev) => new Set(prev).add(frameId));
      
      // Create form data to send to Roboflow
      const formData = new FormData();
      formData.append("image", frame);
      
      // Make API call to Roboflow endpoint
      const response = await fetch(
        "https://detect.roboflow.com/railway-crack-detection/15",
        {
          method: "POST",
          body: formData,
          headers: {
            "X-API-Key": "FYe8IvPwEEQ19V0hf0jr"
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create object URL for the image
      const imageUrl = URL.createObjectURL(frame);
      
      const predictions = data.predictions || [];
      const hasCrack = predictions.length > 0;
      
      // Create a processed frame object
      const processedFrame: ProcessedFrame = {
        frameId,
        imagePath: imageUrl,
        latitude: gpsEntry.latitude,
        longitude: gpsEntry.longitude,
        predictions: predictions,
        hasCrack,
        confidence: predictions.length > 0 ? predictions[0].confidence : 0,
        class: predictions.length > 0 ? predictions[0].class : ""
      };
      
      // Process the image with bounding boxes if predictions exist
      if (hasCrack) {
        const processedImageUrl = await drawBoundingBoxes(frame, predictions, data.image);
        processedFrame.processedImageUrl = processedImageUrl;
      }
      
      onFrameProcess(processedFrame);
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
          resolve(URL.createObjectURL(imageFile));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
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
          }
        });
        
        // Convert canvas to URL
        const processedImageUrl = canvas.toDataURL("image/jpeg");
        resolve(processedImageUrl);
      };
    });
  };

  const isFrameProcessing = (frameId: string) => {
    return processingFrames.has(frameId);
  };

  const sortedFrames = [...frames].sort((a, b) => {
    const aName = parseInt(a.name.split(".")[0]);
    const bName = parseInt(b.name.split(".")[0]);
    return aName - bName;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Uploaded Frames</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFrames.map((frame) => {
          const frameId = frame.name;
          const gpsEntry = findGpsDataForFrame(frameId);
          const imageUrl = URL.createObjectURL(frame);
          
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
                  disabled={isProcessing || isFrameProcessing(frameId) || !gpsEntry}
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
