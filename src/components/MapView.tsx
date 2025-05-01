import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ProcessedFrame } from "@/types";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface MapViewProps {
  results: ProcessedFrame[];
}

const MapView = ({ results }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([0, 0], 2);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add markers for results with cracks
    const markersGroup = L.featureGroup();
    
    results.forEach((result) => {
      if (!result.latitude || !result.longitude) return;
      
      // Create custom icon based on whether a crack was detected
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div class="${
          result.hasCrack 
            ? "bg-destructive" 
            : "bg-green-500"
        } w-4 h-4 rounded-full border-2 border-white"></div>`,
        iconSize: [16, 16],
      });
      
      const marker = L.marker([result.latitude, result.longitude], { icon })
        .addTo(mapRef.current!);
      
      marker.bindPopup(`
        <div class="text-center">
          <img src="${result.hasCrack ? result.processedImageUrl : result.imagePath}" 
               alt="Frame ${result.frameId}" 
               class="w-48 h-auto mb-2" />
          <div class="font-bold">Frame: ${result.frameId}</div>
          <div class="text-sm">
            ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}
          </div>
          ${
            result.hasCrack 
              ? `<div class="text-red-500 font-bold mt-1">Crack Detected (${(result.confidence! * 100).toFixed(1)}%)</div>` 
              : '<div class="text-green-500 font-bold mt-1">No Crack</div>'
          }
        </div>
      `);
      
      markersGroup.addLayer(marker);
    });
    
    // Fit map to markers if there are any
    if (markersGroup.getLayers().length > 0) {
      mapRef.current.fitBounds(markersGroup.getBounds(), {
        padding: [50, 50],
        maxZoom: 16,
      });
    }
    
    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        // Keep the map reference but clean up the markers
      }
    };
  }, [results]);
  
  return (
    <Card className="overflow-hidden">
      <div 
        ref={mapContainerRef} 
        className="h-[400px] w-full"
      ></div>
    </Card>
  );
};

export default MapView;
