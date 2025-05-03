
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GpsLogEntry, ProcessedFrame } from "@/types";
import { toast } from "sonner";
import { saveProcessedFrame, updateSessionStats } from "@/services/supabaseService";
import FrameCard from "./FrameCard";
import GpsAlert from "./GpsAlert";
import { findGpsDataForFrame } from "@/utils/gpsUtils";
import { drawBoundingBoxes } from "@/utils/imageProcessing";
import { detectCracks } from "@/services/crackDetectionService";

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

  const processFrame = async (frame: File) => {
    try {
      const frameId = frame.name;
      const gpsEntry = findGpsDataForFrame(frameId, gpsData);
      
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
        <GpsAlert type="no-data" />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFrames.map((frame) => {
          const frameId = frame.name;
          const gpsEntry = findGpsDataForFrame(frameId, gpsData);
          const noGpsMatch = hasNoGpsData(frameId);
          
          return (
            <FrameCard
              key={frameId}
              frame={frame}
              frameId={frameId}
              gpsEntry={gpsEntry}
              isProcessing={isProcessing}
              isFrameProcessing={isFrameProcessing(frameId)}
              noGpsMatch={noGpsMatch}
              onProcess={processFrame}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FrameList;
