
import { GpsLogEntry } from "@/types";

/**
 * Finds the appropriate GPS data for a frame
 */
export const findGpsDataForFrame = (frameId: string, gpsData: GpsLogEntry[]): GpsLogEntry | null => {
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
