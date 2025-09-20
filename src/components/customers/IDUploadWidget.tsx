import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileImage, 
  Camera, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCreateCustomerDocument } from '@/hooks/useCustomers';

interface IDUploadWidgetProps {
  customerId: string;
  onUploadComplete?: () => void;
}

export function IDUploadWidget({ customerId, onUploadComplete }: IDUploadWidgetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: createDocument } = useCreateCustomerDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // In a real implementation, you would upload the file to Supabase Storage
      // For now, we'll simulate the upload process
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(interval);
      setUploadProgress(100);

      // Create document record
      createDocument({
        customer_id: customerId,
        bucket: 'id_photos',
        storage_path: `id_photos/${customerId}/${file.name}`,
        purpose: 'id_photo',
        content_type: file.type,
        metadata: {
          original_name: file.name,
          size: file.size
        }
      }, {
        onSuccess: () => {
          setUploadStatus('success');
          setIsUploading(false);
          onUploadComplete?.();
        },
        onError: (error) => {
          setUploadStatus('error');
          setIsUploading(false);
          setError(error.message || 'Failed to upload document');
        }
      });
    } catch (err) {
      setUploadStatus('error');
      setIsUploading(false);
      setError('Failed to upload file');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          Upload ID Photo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!file ? (
            <div 
              className="border-2 border-dashed border-muted-foreground rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={triggerFileSelect}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-1">Drag and drop or click to upload</h3>
              <p className="text-sm text-muted-foreground">
                Upload a clear photo of the customer's ID (max 10MB)
              </p>
              <Button variant="outline" className="mt-4">
                <Upload className="w-4 h-4 mr-2" />
                Select File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {previewUrl && (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-contain rounded-lg border"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 bg-background"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-500">ID uploaded successfully!</span>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500">{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || uploadStatus === 'success'}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-pulse" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload ID
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && !isUploading && uploadStatus !== 'success' && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500">{error}</span>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Clear, well-lit photo of government-issued ID</li>
              <li>File format: JPEG, PNG, or PDF</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}