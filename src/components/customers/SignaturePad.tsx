import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Pen, 
  Eraser, 
  Save, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SignaturePadProps {
  customerId: string;
  onSave?: (signatureData: string) => void;
  onCancel?: () => void;
}

export function SignaturePad({ customerId, onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing styles
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ffffff';
    
    // Fill background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSaveStatus('idle');
    setError(null);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setSaveStatus('saving');
    setError(null);
    
    try {
      // Get data URL of the signature
      const dataUrl = canvas.toDataURL('image/png');
      
      // In a real implementation, you would upload this to Supabase Storage
      // For now, we'll simulate the save process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create document record for the signature
      // This would be done through the useCreateCustomerDocument hook
      console.log('Saving signature for customer:', customerId);
      
      setSaveStatus('success');
      onSave?.(dataUrl);
    } catch (err) {
      setSaveStatus('error');
      setError('Failed to save signature');
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="w-5 h-5" />
          Capture Signature
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-64 cursor-crosshair bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
            >
              <Eraser className="w-4 h-4 mr-2" />
              Clear
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              className="ml-auto"
              size="sm"
              onClick={saveSignature}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Signature
                </>
              )}
            </Button>
          </div>
          
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500">Signature saved successfully!</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500">{error}</span>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sign in the box above using your mouse or touch screen</li>
              <li>Click "Clear" to start over</li>
              <li>Click "Save Signature" when finished</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}