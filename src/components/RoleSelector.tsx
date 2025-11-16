import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AppRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/types/roles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface RoleSelectorProps {
  onComplete: () => void;
}

export const RoleSelector = ({ onComplete }: RoleSelectorProps) => {
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [fullName, setFullName] = useState('');
  const [unitId, setUnitId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole || !fullName) {
      toast({
        title: 'שדות חובה חסרים',
        description: 'יש למלא שם מלא ולבחור תפקיד',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          full_name: fullName,
          unit_id: unitId || null,
          onboarding_completed: true
        });

      if (profileError) throw profileError;

      // Insert role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: selectedRole
        });

      if (roleError) throw roleError;

      toast({
        title: 'הפרופיל נוצר בהצלחה',
        description: 'ברוך הבא לצ\'אט פק"ל'
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'שגיאה ביצירת פרופיל',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const roles: AppRole[] = [
    'mentor',
    'cohesion_officer',
    'rear_officer',
    'company_commander',
    'platoon_commander',
    'platoon_cohesion_leader'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Card className="w-full max-w-2xl p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">ברוך הבא לצ'אט פק"ל</h1>
            <p className="text-muted-foreground">
              בכדי להתאים את החוויה שלך, נשמח לדעת מי אתה
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">שם מלא *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="הזן שם מלא"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitId">יחידה (אופציונלי)</Label>
              <Input
                id="unitId"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                placeholder="למשל: גדוד 8108"
              />
            </div>

            <div className="space-y-3">
              <Label>תפקיד *</Label>
              <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                {roles.map((role) => (
                  <div key={role} className="flex items-start space-x-3 space-x-reverse border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value={role} id={role} className="mt-1" />
                    <Label htmlFor={role} className="flex-1 cursor-pointer space-y-1">
                      <div className="font-semibold">{ROLE_LABELS[role]}</div>
                      <div className="text-sm text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role]}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  יוצר פרופיל...
                </>
              ) : (
                'התחל להשתמש'
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
