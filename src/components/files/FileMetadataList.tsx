import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';
import { FileMetadata } from '@/types';

interface FileMetadataListProps {
  files: FileMetadata[];
  className?: string;
  onViewFile?: (file: FileMetadata) => void;
  onDownloadFile?: (file: FileMetadata) => void;
}

export function FileMetadataList({ 
  files, 
  className = "",
  onViewFile,
  onDownloadFile
}: FileMetadataListProps) {
  const formatFileSize = (bytes: number = 0) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPurposeIcon = (purpose: string) => {
    switch (purpose) {
      case 'contract':
        return '📝';
      case 'id_photo':
        return '📷';
      case 'signature':
        return '✍️';
      case 'repair_photo':
        return '🔧';
      default:
        return '📄';
    }
  };

  return (
    <Card className={`shadow-card ${className}`}>
      <CardHeader>
        <CardTitle>Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {getPurposeIcon(file.purpose)}
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {file.supabase_storage_path.split('/').pop()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatFileSize(file.size_bytes)} • {file.content_type}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {onViewFile && (
                  <Button variant="outline" size="sm" onClick={() => onViewFile(file)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                {onDownloadFile && (
                  <Button variant="outline" size="sm" onClick={() => onDownloadFile(file)}>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}