
export interface GpsLogEntry {
  second: number;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ProcessedFrame {
  id?: string;
  frameId: string;
  imagePath: string;
  processedImageUrl?: string;
  latitude: number;
  longitude: number;
  confidence?: number;
  class?: string;
  predictions?: Prediction[];
  hasCrack: boolean;
  sessionId?: string;
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

export interface ScanSession {
  id: string;
  name: string;
  description?: string;
  status: 'in_progress' | 'completed' | 'failed';
  totalFrames: number;
  processedFrames: number;
  totalCracks: number;
  createdAt: string;
}
