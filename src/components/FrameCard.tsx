
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GpsLogEntry } from "@/types";

interface FrameCardProps {
  frame: File;
  frameId: string;
  gpsEntry: GpsLogEntry | null;
  isProcessing: boolean;
  isFrameProcessing: boolean;
  noGpsMatch: boolean;
  onProcess: (frame: File) => void;
}

const FrameCard = ({
  frame,
  frameId,
  gpsEntry,
  isProcessing,
  isFrameProcessing,
  noGpsMatch,
  onProcess,
}: FrameCardProps) => {
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
          onClick={() => onProcess(frame)}
          disabled={isProcessing || isFrameProcessing || !gpsEntry || noGpsMatch}
        >
          {isFrameProcessing ? (
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
};

export default FrameCard;
