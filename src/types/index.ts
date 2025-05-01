
export interface GpsLogEntry {
  second: number;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ProcessedFrame {
  frameId: string;
  imagePath: string;
  processedImageUrl?: string;
  latitude: number;
  longitude: number;
  confidence?: number;
  class?: string;
  predictions?: Prediction[];
  hasCrack: boolean;
}

export interface Prediction {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  confidence: number;
  class: string;
}

export interface RoboflowResponse {
  time: number;
  image: {
    width: number;
    height: number;
  };
  predictions: Prediction[];
}
