import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  FileText, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function ImportExport() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      setImportError('Please select a CSV file');
      return;
    }

    // Validate file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setImportError('File size must be less than 50MB');
      return;
    }

    setImportFile(selectedFile);
    setImportError(null);
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportStatus('uploading');
    setImportError(null);

    try {
      // Simulate file upload
      const uploadInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 1500));
      clearInterval(uploadInterval);
      setImportProgress(100);
      setImportStatus('processing');

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setImportStatus('success');
      setIsImporting(false);
    } catch (err) {
      setImportStatus('error');
      setIsImporting(false);
      setImportError('Failed to import customers');
    }
  };

  const handleRemoveImportFile = () => {
    setImportFile(null);
    setImportError(null);
    if (importFileInputRef.current) {
      importFileInputRef.current.value = '';
    }
  };

  const triggerImportFileSelect = () => {
    importFileInputRef.current?.click();
  };

  const handleExport = async () => {
    setExportStatus('exporting');
    setExportError(null);

    try {
      // In a real implementation, this would:
      // 1. Call an API endpoint to generate the export
      // 2. Download the CSV file
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setExportStatus('success');
    } catch (err) {
      setExportStatus('error');
      setExportError('Failed to export customers');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Import Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              ref={importFileInputRef}
              onChange={handleImportFileChange}
              accept=".csv"
              className="hidden"
            />

            {!importFile ? (
              <div 
                className="border-2 border-dashed border-muted-foreground rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={triggerImportFileSelect}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-1">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground">
                  Import multiple customers from a CSV file
                </p>
                <Button variant="outline" className="mt-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{importFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveImportFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={importProgress} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground">
                      {importStatus === 'uploading' ? 'Uploading...' : 'Processing...'} {importProgress}%
                    </p>
                  </div>
                )}

                {importStatus === 'success' && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-500">Customers imported successfully!</span>
                  </div>
                )}

                {importStatus === 'error' && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-500">{importError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRemoveImportFile}
                    disabled={isImporting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={isImporting || importStatus === 'success'}
                    className="flex-1"
                  >
                    {isImporting ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-pulse" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Customers
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {importError && !isImporting && importStatus !== 'success' && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-500">{importError}</span>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Columns: name, email, phone, address</li>
                <li>First row should contain headers</li>
                <li>Maximum file size: 50MB</li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Download template
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center py-4">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Export Customer Data</h3>
              <p className="text-muted-foreground mb-6">
                Download all customer records as a CSV file
              </p>
              
              {exportStatus === 'exporting' && (
                <div className="space-y-2 mb-4">
                  <Progress value={100} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    Generating export...
                  </p>
                </div>
              )}
              
              {exportStatus === 'success' && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-500">Export generated successfully!</span>
                </div>
              )}
              
              {exportStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500">{exportError}</span>
                </div>
              )}
              
              <Button 
                onClick={handleExport}
                disabled={exportStatus === 'exporting'}
                className="w-full"
              >
                {exportStatus === 'exporting' ? (
                  <>
                    <Download className="w-4 h-4 mr-2 animate-pulse" />
                    Generating Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export to CSV
                  </>
                )}
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Export Options</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>All customers</span>
                  <span className="text-muted-foreground">1,248 records</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>With email addresses</span>
                  <span className="text-muted-foreground">987 records</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>With phone numbers</span>
                  <span className="text-muted-foreground">1,123 records</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}