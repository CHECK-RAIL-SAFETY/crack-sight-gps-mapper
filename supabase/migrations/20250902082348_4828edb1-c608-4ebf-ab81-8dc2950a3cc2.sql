-- Create scan_sessions table
CREATE TABLE public.scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  total_frames INTEGER DEFAULT 0,
  processed_frames INTEGER DEFAULT 0,
  total_cracks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create processed_frames table
CREATE TABLE public.processed_frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  frame_id TEXT NOT NULL,
  image_path TEXT,
  processed_image_path TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  confidence DOUBLE PRECISION,
  has_crack BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crack_predictions table
CREATE TABLE public.crack_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  frame_id UUID NOT NULL REFERENCES public.processed_frames(id) ON DELETE CASCADE,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  width DOUBLE PRECISION NOT NULL,
  height DOUBLE PRECISION NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gps_logs table
CREATE TABLE public.gps_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  second INTEGER NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets for frame images
INSERT INTO storage.buckets (id, name, public) VALUES ('frames', 'frames', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('processed_frames', 'processed_frames', false);

-- Enable Row Level Security
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crack_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now since auth isn't implemented yet)
CREATE POLICY "Allow all operations on scan_sessions" ON public.scan_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on processed_frames" ON public.processed_frames FOR ALL USING (true);
CREATE POLICY "Allow all operations on crack_predictions" ON public.crack_predictions FOR ALL USING (true);
CREATE POLICY "Allow all operations on gps_logs" ON public.gps_logs FOR ALL USING (true);

-- Create storage policies
CREATE POLICY "Allow all operations on frames bucket" ON storage.objects FOR ALL USING (bucket_id = 'frames');
CREATE POLICY "Allow all operations on processed_frames bucket" ON storage.objects FOR ALL USING (bucket_id = 'processed_frames');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scan_sessions_updated_at
  BEFORE UPDATE ON public.scan_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();