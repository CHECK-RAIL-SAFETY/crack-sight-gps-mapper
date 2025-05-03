
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, FileUp } from "lucide-react";

interface GpsAlertProps {
  type: "no-data" | "required";
}

const GpsAlert = ({ type }: GpsAlertProps) => {
  if (type === "no-data") {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No GPS Data Available</AlertTitle>
        <AlertDescription>
          Please upload a GPS log file to match with frames before processing.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default" className="bg-amber-50 border-amber-200">
      <FileUp className="h-4 w-4 text-amber-600" />
      <AlertTitle>GPS Data Required</AlertTitle>
      <AlertDescription>
        Please upload a GPS log file to match with the frames before processing.
      </AlertDescription>
    </Alert>
  );
};

export default GpsAlert;
