import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  Upload,
  Download,
  Trash2
} from 'lucide-react';

interface ContractManagerProps {
  retailerId: string;
  contractUrl?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export default function ContractManager({ retailerId, contractUrl, onUpload, onRemove }: ContractManagerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      onUpload(file);
      // Reset the input
      e.target.value = '';
      setIsUploading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Contract Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contractUrl ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Current Contract</p>
                <p className="text-sm text-muted-foreground">
                  {contractUrl.split('/').pop()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(contractUrl, '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={onRemove}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Upload a new contract:</p>
              <label className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 hover:bg-muted transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Click to upload new contract'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No contract uploaded</h3>
            <p className="text-muted-foreground mb-4">
              Upload a contract for this retailer.
            </p>
            <label className="cursor-pointer">
              <Button disabled={isUploading}>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Contract'}
              </Button>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}