import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DetailField {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface DetailViewProps {
  title: string;
  fields: DetailField[];
  onBack?: () => void;
  backTo?: string;
  actions?: React.ReactNode;
}

export function DetailView({ 
  title, 
  fields, 
  onBack, 
  backTo,
  actions 
}: DetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {backTo ? (
          <Link to={backTo}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        ) : onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        ) : null}
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <div className="flex-1" />
        {actions}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{title} Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field, index) => (
              <div key={index} className={field.fullWidth ? "md:col-span-2" : ""}>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {field.label}
                </div>
                <div className="text-foreground">
                  {field.value || '-'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}