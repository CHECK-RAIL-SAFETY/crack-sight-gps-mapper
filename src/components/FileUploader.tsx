
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FileUploaderProps {
  onFramesUploaded: (frames: FileList) => void;
  onGpsLogUploaded: (gpsLog: File) => void;
  isUploading: boolean;
}

const FileUploader = ({ onFramesUploaded, onGpsLogUploaded, isUploading }: FileUploaderProps) => {
  const [framesSelected, setFramesSelected] = useState(false);
  const [gpsLogSelected, setGpsLogSelected] = useState(false);

  const handleFramesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFramesSelected(true);
      onFramesUploaded(e.target.files);
      toast.success(`${e.target.files.length} frames selected`);
    }
  };

  const handleGpsLogChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setGpsLogSelected(true);
      onGpsLogUploaded(e.target.files[0]);
      toast.success("GPS log file selected");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 bg-secondary">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
              <line x1="16" y1="5" x2="22" y2="5"></line>
              <line x1="19" y1="2" x2="19" y2="8"></line>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Upload Frames</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a folder of images named as &lt;second&gt;.jpg
            </p>
          </div>
          <div className="w-full">
            <Label htmlFor="frames" className="cursor-pointer">
              <div className={`border-2 border-dashed rounded-lg p-6 transition-colors hover:border-primary/50 ${framesSelected ? 'border-primary' : 'border-muted'}`}>
                <div className="text-sm text-center">
                  {framesSelected ? "Frames selected" : "Select frames folder"}
                </div>
              </div>
            </Label>
            <input
              id="frames"
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFramesChange}
              className="sr-only"
              disabled={isUploading}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-secondary">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Upload GPS Log</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload CSV with second, latitude, longitude, accuracy
            </p>
          </div>
          <div className="w-full">
            <Label htmlFor="gpsLog" className="cursor-pointer">
              <div className={`border-2 border-dashed rounded-lg p-6 transition-colors hover:border-primary/50 ${gpsLogSelected ? 'border-primary' : 'border-muted'}`}>
                <div className="text-sm text-center">
                  {gpsLogSelected ? "GPS log selected" : "Select GPS log file"}
                </div>
              </div>
            </Label>
            <input
              id="gpsLog"
              type="file"
              accept=".csv"
              onChange={handleGpsLogChange}
              className="sr-only"
              disabled={isUploading}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FileUploader;
