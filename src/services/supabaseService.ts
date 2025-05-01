
import { supabase } from "@/integrations/supabase/client";
import { ProcessedFrame, GpsLogEntry, Prediction, ScanSession } from "@/types";
import { v4 as uuidv4 } from 'uuid';

// Sessions
export const createScanSession = async (name: string, description?: string): Promise<ScanSession | null> => {
  const { data, error } = await supabase
    .from('scan_sessions')
    .insert({
      name,
      description,
      status: 'in_progress' as 'in_progress', // Type assertion to match ScanSession type
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating scan session:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: data.status as 'in_progress' | 'completed' | 'failed',
    totalFrames: data.total_frames,
    processedFrames: data.processed_frames,
    totalCracks: data.total_cracks,
    createdAt: data.created_at
  };
};

export const updateSessionStats = async (
  sessionId: string, 
  totalFrames: number, 
  processedFrames: number, 
  totalCracks: number
): Promise<void> => {
  const { error } = await supabase
    .from('scan_sessions')
    .update({
      total_frames: totalFrames,
      processed_frames: processedFrames,
      total_cracks: totalCracks
    })
    .eq('id', sessionId);
  
  if (error) {
    console.error('Error updating session stats:', error);
  }
};

export const completeSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('scan_sessions')
    .update({
      status: 'completed' as 'completed'
    })
    .eq('id', sessionId);
  
  if (error) {
    console.error('Error completing session:', error);
  }
};

// Frames
export const saveProcessedFrame = async (
  frame: ProcessedFrame, 
  sessionId: string
): Promise<string | null> => {
  // First, upload images to storage if they exist
  let imagePath = frame.imagePath;
  let processedImagePath = frame.processedImageUrl;
  
  // If the image is a Blob URL, we need to fetch it and upload to Supabase storage
  if (frame.imagePath && !frame.imagePath.startsWith('https://')) {
    try {
      const response = await fetch(frame.imagePath);
      const blob = await response.blob();
      const fileName = `${sessionId}/${frame.frameId}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('frames')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('frames').getPublicUrl(fileName);
      imagePath = data.publicUrl;
      
    } catch (error) {
      console.error('Error uploading frame:', error);
    }
  }
  
  // Upload processed image if it exists
  if (frame.processedImageUrl && !frame.processedImageUrl.startsWith('https://')) {
    try {
      const response = await fetch(frame.processedImageUrl);
      const blob = await response.blob();
      const fileName = `${sessionId}/${frame.frameId}_processed`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('processed_frames')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('processed_frames').getPublicUrl(fileName);
      processedImagePath = data.publicUrl;
      
    } catch (error) {
      console.error('Error uploading processed frame:', error);
    }
  }
  
  // Insert frame data into the database
  const { data, error } = await supabase
    .from('processed_frames')
    .insert({
      session_id: sessionId,
      frame_id: frame.frameId,
      image_path: imagePath,
      processed_image_path: processedImagePath,
      latitude: frame.latitude,
      longitude: frame.longitude,
      confidence: frame.confidence || null,
      has_crack: frame.hasCrack
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving processed frame:', error);
    return null;
  }
  
  // If there are predictions, save them as well
  if (frame.hasCrack && frame.predictions && frame.predictions.length > 0) {
    const predictionsToInsert = frame.predictions.map(prediction => ({
      frame_id: data.id,
      x: prediction.x,
      y: prediction.y,
      width: prediction.width,
      height: prediction.height,
      confidence: prediction.confidence,
      class: prediction.class
    }));
    
    const { error: predictionsError } = await supabase
      .from('crack_predictions')
      .insert(predictionsToInsert);
    
    if (predictionsError) {
      console.error('Error saving predictions:', predictionsError);
    }
  }
  
  return data.id;
};

// GPS Logs
export const saveGpsLogs = async (
  gpsLogs: GpsLogEntry[], 
  sessionId: string
): Promise<void> => {
  const logsToInsert = gpsLogs.map(log => ({
    session_id: sessionId,
    second: log.second,
    latitude: log.latitude,
    longitude: log.longitude,
    accuracy: log.accuracy
  }));
  
  const { error } = await supabase
    .from('gps_logs')
    .insert(logsToInsert);
  
  if (error) {
    console.error('Error saving GPS logs:', error);
  }
};

export const getSessions = async (): Promise<ScanSession[]> => {
  const { data, error } = await supabase
    .from('scan_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  
  return data.map(session => ({
    id: session.id,
    name: session.name,
    description: session.description,
    status: session.status as 'in_progress' | 'completed' | 'failed',
    totalFrames: session.total_frames,
    processedFrames: session.processed_frames,
    totalCracks: session.total_cracks,
    createdAt: session.created_at
  }));
};

export const getSessionFrames = async (sessionId: string): Promise<ProcessedFrame[]> => {
  const { data, error } = await supabase
    .from('processed_frames')
    .select(`
      *,
      crack_predictions (*)
    `)
    .eq('session_id', sessionId);
  
  if (error) {
    console.error('Error fetching session frames:', error);
    return [];
  }
  
  return data.map(frame => ({
    id: frame.id,
    frameId: frame.frame_id,
    imagePath: frame.image_path,
    processedImageUrl: frame.processed_image_path,
    latitude: frame.latitude,
    longitude: frame.longitude,
    confidence: frame.confidence,
    hasCrack: frame.has_crack,
    predictions: frame.crack_predictions,
    sessionId: frame.session_id
  }));
};
