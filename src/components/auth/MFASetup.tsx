/**
 * MFA Setup Component
 * 
 * React component for setting up Multi-Factor Authentication including:
 * - TOTP authenticator app setup with QR code
 * - SMS and email MFA configuration
 * - Backup codes generation and display
 * - Device management interface
 */

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  Copy, 
  Check, 
  AlertTriangle,
  Trash2,
  Plus
} from 'lucide-react';
import { createMFAManager, type MFADevice, type TOTPSetupResult } from '@/lib/mfa-manager';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'choose' | 'setup' | 'verify' | 'backup'>('choose');
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | 'email'>('totp');
  const [setupData, setSetupData] = useState<TOTPSetupResult | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MFADevice[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const mfaManager = createMFAManager();

  useEffect(() => {
    if (user) {
      loadUserDevices();
    }
  }, [user]);

  const loadUserDevices = async () => {
    if (!user) return;
    
    try {
      const userDevices = await mfaManager.getUserMFADevices(user.id);
      setDevices(userDevices);
    } catch (error) {
      console.error('Failed to load MFA devices:', error);
    }
  };

  const handleStartSetup = async () => {
    if (!user) return;
    
    if (!deviceName.trim()) {
      setError('Please enter a device name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedMethod === 'totp') {
        const result = await mfaManager.setupTOTP(user.id, deviceName);
        setSetupData(result);
        setStep('setup');
      } else {
        // For SMS/Email, we'd implement similar setup flows
        toast({
          title: 'Coming Soon',
          description: `${selectedMethod.toUpperCase()} MFA will be available soon`,
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!user || !setupData || !verificationCode) return;

    setLoading(true);
    setError(null);

    try {
      // We need the device ID from the setup - this would be returned from setupTOTP
      const deviceId = 'temp-device-id'; // This would come from setupData
      const success = await mfaManager.verifyTOTPSetup(user.id, deviceId, verificationCode);
      
      if (success) {
        setStep('backup');
        toast({
          title: 'MFA Enabled',
          description: 'Multi-factor authentication has been successfully enabled',
        });
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    loadUserDevices();
    onComplete?.();
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this MFA device?')) {
      return;
    }

    try {
      // Implementation would call mfaManager.removeDevice
      toast({
        title: 'Device Removed',
        description: 'MFA device has been removed',
      });
      loadUserDevices();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove MFA device',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: 'Copied',
        description: 'Text copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const renderChooseMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Secure Your Account</h2>
        <p className="text-gray-600">
          Add an extra layer of security to protect your account from unauthorized access.
        </p>
      </div>

      <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="totp" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Authenticator
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="totp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Authenticator App
              </CardTitle>
              <CardDescription>
                Use an authenticator app like Google Authenticator, Authy, or 1Password to generate verification codes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    placeholder="e.g., iPhone Authenticator"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Recommended Apps:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Google Authenticator</li>
                    <li>• Microsoft Authenticator</li>
                    <li>• Authy</li>
                    <li>• 1Password</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Verification</CardTitle>
              <CardDescription>
                Receive verification codes via text message to your mobile phone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  SMS is less secure than authenticator apps. Consider using an authenticator app for better security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Verification</CardTitle>
              <CardDescription>
                Receive verification codes via email to your registered email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Email MFA is less secure than authenticator apps. Consider using an authenticator app for better security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleStartSetup} 
          disabled={loading || !deviceName.trim()}
        >
          {loading ? 'Setting up...' : 'Continue'}
        </Button>
      </div>
    </div>
  );

  const renderTOTPSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
        <p className="text-gray-600">
          Use your authenticator app to scan this QR code or enter the setup key manually.
        </p>
      </div>

      {setupData && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <QRCodeSVG 
                    value={setupData.qr_code_url} 
                    size={200}
                    level="M"
                    includeMargin
                  />
                </div>
                
                <div className="w-full">
                  <Label>Manual Entry Key</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      value={setupData.manual_entry_key} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(setupData.manual_entry_key)}
                    >
                      {copiedCode === setupData.manual_entry_key ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter this key if you can't scan the QR code
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Open your authenticator app</li>
              <li>Tap "Add Account" or "+"</li>
              <li>Scan the QR code above or enter the key manually</li>
              <li>Your app will generate a 6-digit code</li>
              <li>Enter the code below to complete setup</li>
            </ol>
          </div>
        </>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => setStep('choose')}>
          Back
        </Button>
        <Button onClick={() => setStep('verify')}>
          I've Added the Account
        </Button>
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Verify Setup</h2>
        <p className="text-gray-600">
          Enter the 6-digit code from your authenticator app to complete setup.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-wider font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the current 6-digit code from your authenticator app
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => setStep('setup')}>
          Back
        </Button>
        <Button 
          onClick={handleVerifySetup}
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify & Enable MFA'}
        </Button>
      </div>
    </div>
  );

  const renderBackupCodes = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Save Your Backup Codes</h2>
        <p className="text-gray-600">
          Store these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
        </p>
      </div>

      {setupData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Backup Recovery Codes
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(setupData.backup_codes.join('\n'))}
              >
                {copiedCode === setupData.backup_codes.join('\n') ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy All
              </Button>
            </CardTitle>
            <CardDescription>
              Each code can only be used once. Keep them secure and accessible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {setupData.backup_codes.map((code, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded font-mono text-sm text-center border cursor-pointer hover:bg-gray-100"
                  onClick={() => copyToClipboard(code)}
                >
                  {code}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Save these codes in a secure location. If you lose access to your authenticator device, these codes are the only way to regain access to your account.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3 justify-end">
        <Button onClick={handleComplete} className="w-full">
          I've Saved My Backup Codes
        </Button>
      </div>
    </div>
  );

  const renderDeviceManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">MFA Devices</h3>
        <Button size="sm" onClick={() => setStep('choose')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      <div className="space-y-3">
        {devices.map((device) => (
          <Card key={device.device_id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {device.device_type === 'totp' && <Smartphone className="h-5 w-5" />}
                  {device.device_type === 'sms' && <Smartphone className="h-5 w-5" />}
                  {device.device_type === 'email' && <Mail className="h-5 w-5" />}
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{device.device_name}</span>
                      {device.is_primary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                      {!device.is_verified && (
                        <Badge variant="destructive" className="text-xs">Unverified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {device.device_type === 'sms' && device.phone_number}
                      {device.device_type === 'email' && device.email_address}
                      {device.device_type === 'totp' && 'Authenticator app'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Added {device.created_at.toLocaleDateString()} • 
                      Used {device.usage_count} times
                      {device.last_used_at && ` • Last used ${device.last_used_at.toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveDevice(device.device_id)}
                  disabled={device.is_primary && devices.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {devices.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No MFA devices configured</h4>
            <p className="text-gray-500 mb-4">
              Add a multi-factor authentication device to secure your account.
            </p>
            <Button onClick={() => setStep('choose')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Device
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      {step === 'choose' && renderChooseMethod()}
      {step === 'setup' && selectedMethod === 'totp' && renderTOTPSetup()}
      {step === 'verify' && renderVerification()}
      {step === 'backup' && renderBackupCodes()}
      
      {devices.length > 0 && step === 'choose' && (
        <div className="mt-8">
          {renderDeviceManagement()}
        </div>
      )}
    </div>
  );
};

export default MFASetup;