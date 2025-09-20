import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { useCustomerMergeRequests } from '@/hooks/useCustomers';
import { Customer } from '@/types';

interface MergeToolProps {
  customerId: string;
  onMergeComplete?: () => void;
}

interface MergeCandidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  score: number; // similarity score
}

interface MergeField {
  key: string;
  label: string;
  primaryValue: any;
  duplicateValue: any;
  selectedValue: 'primary' | 'duplicate';
}

export function MergeTool({ customerId, onMergeComplete }: MergeToolProps) {
  const [step, setStep] = useState<'search' | 'review' | 'confirm'>('search');
  const [mergeCandidates, setMergeCandidates] = useState<MergeCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<MergeCandidate | null>(null);
  const [mergeFields, setMergeFields] = useState<MergeField[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const { data: mergeRequests } = useCustomerMergeRequests(customerId);

  // Mock function to find duplicate customers
  const findDuplicates = () => {
    // In a real implementation, this would call an API to find potential duplicates
    // For now, we'll use mock data
    const mockCandidates: MergeCandidate[] = [
      {
        id: 'cust-dup-1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        score: 95
      },
      {
        id: 'cust-dup-2',
        name: 'Jon Smith',
        email: 'jon.smith@email.com',
        phone: '(555) 123-4567',
        score: 87
      }
    ];
    
    setMergeCandidates(mockCandidates);
    setStep('review');
  };

  // Prepare merge fields when a candidate is selected
  const prepareMergeFields = (candidate: MergeCandidate) => {
    setSelectedCandidate(candidate);
    
    // Mock primary customer data
    const primaryCustomer: Partial<Customer> = {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      notes: 'Preferred customer'
    };
    
    // Mock duplicate customer data
    const duplicateCustomer: Partial<Customer> = {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      notes: 'New customer record'
    };
    
    // Create merge fields
    const fields: MergeField[] = [
      {
        key: 'name',
        label: 'Name',
        primaryValue: primaryCustomer.name,
        duplicateValue: duplicateCustomer.name,
        selectedValue: 'primary'
      },
      {
        key: 'email',
        label: 'Email',
        primaryValue: primaryCustomer.email,
        duplicateValue: duplicateCustomer.email,
        selectedValue: 'primary'
      },
      {
        key: 'phone',
        label: 'Phone',
        primaryValue: primaryCustomer.phone,
        duplicateValue: duplicateCustomer.phone,
        selectedValue: 'primary'
      },
      {
        key: 'notes',
        label: 'Notes',
        primaryValue: primaryCustomer.notes,
        duplicateValue: duplicateCustomer.notes,
        selectedValue: 'primary'
      }
    ];
    
    setMergeFields(fields);
    setStep('confirm');
  };

  const handleFieldSelection = (fieldKey: string, selection: 'primary' | 'duplicate') => {
    setMergeFields(prev => 
      prev.map(field => 
        field.key === fieldKey 
          ? { ...field, selectedValue: selection } 
          : field
      )
    );
  };

  const handleMerge = async () => {
    if (!selectedCandidate) return;
    
    setIsMerging(true);
    
    try {
      // In a real implementation, this would:
      // 1. Create a merge request record
      // 2. Perform the actual merge in the backend
      // 3. Update related records (orders, documents, etc.)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset and notify
      setStep('search');
      setSelectedCandidate(null);
      setMergeFields([]);
      onMergeComplete?.();
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Merge Duplicate Customers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'search' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Find Duplicate Customers</h3>
              <p className="text-muted-foreground mb-6">
                Search for potential duplicate customer records to merge
              </p>
              <Button onClick={findDuplicates}>
                <Users className="w-4 h-4 mr-2" />
                Find Duplicates
              </Button>
            </div>
            
            {mergeRequests?.data && mergeRequests.data.length > 0 && (
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Pending Merge Requests</h4>
                <div className="space-y-3">
                  {mergeRequests.data.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Merge Request #{request.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {step === 'review' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-4">Potential Duplicates Found</h3>
              <div className="space-y-3">
                {mergeCandidates.map((candidate) => (
                  <div 
                    key={candidate.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => prepareMergeFields(candidate)}
                  >
                    <div>
                      <p className="font-medium">{candidate.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">{candidate.email}</span>
                        <span className="text-sm text-muted-foreground">{candidate.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-yellow-600">
                        {candidate.score}% match
                      </span>
                      <Button variant="outline" size="sm">
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('search')}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {step === 'confirm' && selectedCandidate && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Merge Customers</h3>
              <p className="text-muted-foreground text-sm">
                Select which values to keep when merging these customer records
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
                <div className="col-span-4">Field</div>
                <div className="col-span-4">Current Record</div>
                <div className="col-span-4">Duplicate Record</div>
              </div>
              
              {mergeFields.map((field) => (
                <div key={field.key} className="grid grid-cols-12 border-b p-3 text-sm">
                  <div className="col-span-4 font-medium flex items-center">
                    {field.label}
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.selectedValue === 'primary'}
                        onCheckedChange={() => handleFieldSelection(field.key, 'primary')}
                      />
                      <span className={field.selectedValue === 'primary' ? 'font-medium' : 'text-muted-foreground'}>
                        {String(field.primaryValue || '—')}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.selectedValue === 'duplicate'}
                        onCheckedChange={() => handleFieldSelection(field.key, 'duplicate')}
                      />
                      <span className={field.selectedValue === 'duplicate' ? 'font-medium' : 'text-muted-foreground'}>
                        {String(field.duplicateValue || '—')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500">
                Merging cannot be undone. All data from the duplicate record will be combined with the current record.
              </span>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep('review')}
                disabled={isMerging}
              >
                <X className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleMerge}
                disabled={isMerging}
              >
                {isMerging ? (
                  <>
                    <Users className="w-4 h-4 mr-2 animate-pulse" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Merge
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}