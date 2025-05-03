
import { Prediction } from "@/types";

/**
 * Draws bounding boxes on an image based on prediction data
 */
export const drawBoundingBoxes = async (
  imageFile: File, 
  predictions: Prediction[], 
  dimensions: {width: number, height: number}
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        console.error("Could not get canvas context");
        resolve(URL.createObjectURL(imageFile));
        return;
      }
      
      // Use actual image dimensions from loaded image
      canvas.width = img.width;
      canvas.height = img.height;
      
      console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
      console.log("Drawing original image to canvas");
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Draw bounding boxes
      ctx.strokeStyle = "#00FFFF"; // Cyan color
      ctx.lineWidth = 3;
      ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
      
      predictions.forEach((pred) => {
        if (typeof pred.x === 'number' && 
            typeof pred.y === 'number' && 
            typeof pred.width === 'number' && 
            typeof pred.height === 'number') {
              
          // The API returns pixel values directly, so we use them as is
          // No need to multiply by canvas dimensions
          const x = pred.x;
          const y = pred.y;
          const width = pred.width;
          const height = pred.height;
          
          console.log("Drawing bounding box:", x, y, width, height);
          
          // Draw rectangle centered on x,y with given width and height
          ctx.strokeRect(x - width/2, y - height/2, width, height);
          ctx.fillRect(x - width/2, y - height/2, width, height);
          
          // Add confidence text
          ctx.font = "16px Arial";
          ctx.fillStyle = "white";
          ctx.strokeStyle = "black";
          ctx.lineWidth = 1;
          const text = `${pred.class} ${(pred.confidence * 100).toFixed(1)}%`;
          ctx.strokeText(text, x - width/2, y - height/2 - 5);
          ctx.fillText(text, x - width/2, y - height/2 - 5);
        } else {
          console.warn("Invalid prediction data:", pred);
        }
      });
      
      // Convert canvas to URL with high quality
      const processedImageUrl = canvas.toDataURL("image/jpeg", 0.95);
      console.log("Processed image URL created with length:", processedImageUrl.length);
      resolve(processedImageUrl);
    };
    
    img.onerror = () => {
      console.error("Error loading image for bounding box drawing");
      resolve(URL.createObjectURL(imageFile));
    };
  });
};
