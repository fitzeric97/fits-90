import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, ZoomIn, ZoomOut, Move, Crop } from "lucide-react";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageBlob: Blob) => void;
  onCancel: () => void;
}

export function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState([100]);
  const [originalImage, setOriginalImage] = useState<FabricImage | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 400,
      backgroundColor: "#f8f9fa",
    });

    setFabricCanvas(canvas);

    // Load the image
    FabricImage.fromURL(imageUrl).then((img) => {
      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = img.width!;
      const imgHeight = img.height!;

      const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
      
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: 'center',
        originY: 'center',
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      setOriginalImage(img);
    });

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  useEffect(() => {
    if (fabricCanvas && originalImage) {
      const zoomValue = zoom[0] / 100;
      originalImage.set({
        scaleX: zoomValue,
        scaleY: zoomValue,
      });
      fabricCanvas.renderAll();
    }
  }, [zoom, fabricCanvas, originalImage]);

  const handleReset = () => {
    if (fabricCanvas && originalImage) {
      const canvasWidth = fabricCanvas.getWidth();
      const canvasHeight = fabricCanvas.getHeight();
      
      originalImage.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
      });
      
      setZoom([100]);
      fabricCanvas.renderAll();
    }
  };

  const handleCenter = () => {
    if (fabricCanvas && originalImage) {
      const canvasWidth = fabricCanvas.getWidth();
      const canvasHeight = fabricCanvas.getHeight();
      
      originalImage.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
      });
      
      fabricCanvas.renderAll();
    }
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;

    // Create a temporary canvas for the final crop
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 400;
    const ctx = tempCanvas.getContext('2d');
    
    if (!ctx) return;

    // Get the canvas as image data
    const dataURL = fabricCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      multiplier: 1,
    });

    // Convert to blob
    const response = await fetch(dataURL);
    const blob = await response.blob();
    
    onSave(blob);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crop className="w-5 h-5" />
          Edit Your Fit Image
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Position and zoom your image to showcase the best angle of your outfit
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas */}
        <div className="flex justify-center">
          <div className="border-2 border-dashed border-border rounded-lg p-2">
            <canvas 
              ref={canvasRef} 
              className="border border-border rounded"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1">
                <ZoomIn className="w-4 h-4" />
                Zoom: {zoom[0]}%
              </label>
            </div>
            <Slider
              value={zoom}
              onValueChange={setZoom}
              min={50}
              max={300}
              step={10}
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCenter}
              className="flex items-center gap-1"
            >
              <Move className="w-4 h-4" />
              Center
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <p className="font-medium mb-1">How to edit:</p>
            <ul className="space-y-1">
              <li>• Drag the image to reposition it</li>
              <li>• Use the zoom slider to resize</li>
              <li>• The final image will be 400x400px square</li>
            </ul>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Save Edited Image
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}