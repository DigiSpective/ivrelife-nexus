import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  BarChart, 
  Cloud,
  Headphones,
  Globe,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    users: number | 'unlimited';
    storage: string;
    apiCalls: number | 'unlimited';
    support: string;
  };
  popular?: boolean;
  enterprise?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    price: { monthly: 29, yearly: 290 },
    features: [
      'Basic dashboard and analytics',
      'Customer management',
      'Order processing',
      'Email support',
      'Basic reporting',
      'Mobile app access'
    ],
    limits: {
      users: 5,
      storage: '10 GB',
      apiCalls: 10000,
      support: 'Email'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced features for growing businesses',
    price: { monthly: 79, yearly: 790 },
    features: [
      'Everything in Starter',
      'Advanced analytics and reporting',
      'Multi-location support',
      'Inventory management',
      'Payment processing',
      'Priority support',
      'Custom integrations',
      'Bulk operations',
      'Advanced user roles'
    ],
    limits: {
      users: 25,
      storage: '100 GB',
      apiCalls: 100000,
      support: 'Priority Email + Chat'
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large organizations',
    price: { monthly: 199, yearly: 1990 },
    features: [
      'Everything in Professional',
      'Unlimited users and locations',
      'White-label solution',
      'Advanced security and compliance',
      'Custom workflows',
      'Dedicated account manager',
      'Phone support',
      'Custom development',
      'SLA guarantees',
      'Data export and migration'
    ],
    limits: {
      users: 'unlimited',
      storage: 'Unlimited',
      apiCalls: 'unlimited',
      support: '24/7 Phone + Dedicated Manager'
    },
    enterprise: true
  }
];

interface PlansTabProps {
  user: any;
}

export function PlansTab({ user }: PlansTabProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();

  const currentPlan = 'starter'; // This would come from user data

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true);
    try {
      // API call to upgrade plan
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast({
        title: "Plan Updated!",
        description: `Successfully upgraded to ${plans.find(p => p.id === planId)?.name} plan.`,
      });
      
      setSelectedPlan(planId);
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "There was an error upgrading your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const calculateSavings = (plan: Plan) => {
    const monthlyTotal = plan.price.monthly * 12;
    const yearlySavings = monthlyTotal - plan.price.yearly;
    const percentage = Math.round((yearlySavings / monthlyTotal) * 100);
    return { amount: yearlySavings, percentage };
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {plans.find(p => p.id === currentPlan)?.name} Plan
              </h3>
              <p className="text-muted-foreground">
                {plans.find(p => p.id === currentPlan)?.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                ${plans.find(p => p.id === currentPlan)?.price.monthly}/mo
              </p>
              <p className="text-sm text-muted-foreground">Billed monthly</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-4 p-4 bg-muted/30 rounded-lg">
        <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
          Yearly
        </span>
        {isYearly && (
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="w-3 h-3 mr-1" />
            Save up to 25%
          </Badge>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const savings = calculateSavings(plan);
          const price = isYearly ? plan.price.yearly : plan.price.monthly;
          const isCurrentPlan = plan.id === currentPlan;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-primary shadow-lg' : ''
              } ${isCurrentPlan ? 'bg-muted/30' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {plan.enterprise && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary">
                    <Shield className="w-3 h-3 mr-1" />
                    Enterprise
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    ${isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly}
                    <span className="text-lg font-normal text-muted-foreground">/mo</span>
                  </div>
                  
                  {isYearly && (
                    <div className="text-sm text-muted-foreground mt-1">
                      ${plan.price.yearly}/year • Save ${savings.amount} ({savings.percentage}%)
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Limits */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{plan.limits.users} users</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Cloud className="w-4 h-4 text-muted-foreground" />
                    <span>{plan.limits.storage} storage</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart className="w-4 h-4 text-muted-foreground" />
                    <span>{plan.limits.apiCalls} API calls/mo</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Headphones className="w-4 h-4 text-muted-foreground" />
                    <span>{plan.limits.support}</span>
                  </div>
                </div>

                <Separator />

                {/* Action Button */}
                <div className="pt-2">
                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        "Upgrading..."
                      ) : plan.id === 'enterprise' ? (
                        <>
                          Contact Sales
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Upgrade to {plan.name}
                          <Zap className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enterprise Contact */}
      <Card className="border-dashed">
        <CardContent className="text-center py-8">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Need a Custom Solution?</h3>
          <p className="text-muted-foreground mb-4">
            Contact our sales team for enterprise pricing, custom integrations, and volume discounts.
          </p>
          <Button variant="outline">
            <Headphones className="w-4 h-4 mr-2" />
            Contact Sales Team
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}