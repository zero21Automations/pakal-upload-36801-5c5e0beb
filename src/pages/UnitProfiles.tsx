import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";

interface UnitProfile {
  id: string;
  org_id: string;
  unit_id: string;
  unit_name: string;
  leadership: any;
  demographics: any;
  operational_capability: any;
  training_education: any;
  welfare_morale: any;
  discipline_culture: any;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

const UnitProfiles = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UnitProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UnitProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    unit_name: '',
    leadership: { commander: '', deputy: '', sergeant_major: '', contact_details: '' },
    demographics: { total_soldiers: '', age_range: '', marital_status: '', geographic_distribution: '' },
    operational_capability: { current_level: '', training_status: '', equipment_status: '' },
    training_education: { completed_courses: '', upcoming_training: '', certifications: '' },
    welfare_morale: { satisfaction_level: '', concerns: '', support_programs: '' },
    discipline_culture: { incidents: '', commendations: '', culture_notes: '' }
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת מיפויי היחידות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const {data: {user}} = await supabase.auth.getUser();
      const profileData = {
        org_id: "temp-org-id",
        unit_id: editingProfile?.unit_id || `unit-${Date.now()}`,
        unit_name: formData.unit_name,
        leadership: formData.leadership,
        demographics: formData.demographics,
        operational_capability: formData.operational_capability,
        training_education: formData.training_education,
        welfare_morale: formData.welfare_morale,
        discipline_culture: formData.discipline_culture,
        updated_by: user?.id || "temp-user-id"
      };

      let result;
      if (editingProfile) {
        result = await supabase
          .from('document_mappings')
          .update(profileData)
          .eq('id', editingProfile.id);
      } else {
        result = await supabase
          .from('document_mappings')
          .insert([profileData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "הצלחה",
        description: editingProfile ? "מיפוי היחידה עודכן בהצלחה" : "מיפוי היחידה נוצר בהצלחה",
      });

      setIsDialogOpen(false);
      setEditingProfile(null);
      resetForm();
      fetchProfiles();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בשמירת מיפוי היחידה",
        variant: "destructive",
      });
    }
  };

  const handleEditProfile = (profile: UnitProfile) => {
    setEditingProfile(profile);
    setFormData({
      unit_name: profile.unit_name,
      leadership: profile.leadership || {},
      demographics: profile.demographics || {},
      operational_capability: profile.operational_capability || {},
      training_education: profile.training_education || {},
      welfare_morale: profile.welfare_morale || {},
      discipline_culture: profile.discipline_culture || {}
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('document_mappings')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "מיפוי היחידה נמחק בהצלחה",
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת מיפוי היחידה",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      unit_name: '',
      leadership: { commander: '', deputy: '', sergeant_major: '', contact_details: '' },
      demographics: { total_soldiers: '', age_range: '', marital_status: '', geographic_distribution: '' },
      operational_capability: { current_level: '', training_status: '', equipment_status: '' },
      training_education: { completed_courses: '', upcoming_training: '', certifications: '' },
      welfare_morale: { satisfaction_level: '', concerns: '', support_programs: '' },
      discipline_culture: { incidents: '', commendations: '', culture_notes: '' }
    });
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">מיפוי יחידות</h1>
            <p className="text-muted-foreground mt-2">נהל מידע מפורט על יחידות המילואים</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingProfile(null); resetForm(); }}>
                <Plus className="ml-2 h-4 w-4" />
                יצירת מיפוי יחידה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProfile ? 'עריכת מיפוי יחידה' : 'יצירת מיפוי יחידה חדש'}</DialogTitle>
                <DialogDescription>הזן את המידע המפורט על היחידה</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="unit_name">שם היחידה</Label>
                  <Input
                    id="unit_name"
                    value={formData.unit_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_name: e.target.value }))}
                  />
                </div>

                <Tabs defaultValue="leadership" dir="rtl">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="leadership">מנהיגות</TabsTrigger>
                    <TabsTrigger value="demographics">דמוגרפיה</TabsTrigger>
                    <TabsTrigger value="operational">יכולת</TabsTrigger>
                    <TabsTrigger value="training">הכשרה</TabsTrigger>
                    <TabsTrigger value="welfare">רווחה</TabsTrigger>
                    <TabsTrigger value="discipline">משמעת</TabsTrigger>
                  </TabsList>

                  <TabsContent value="leadership" className="space-y-4">
                    <div><Label>מפקד</Label><Input value={formData.leadership.commander} onChange={(e) => setFormData(prev => ({ ...prev, leadership: { ...prev.leadership, commander: e.target.value }}))} /></div>
                    <div><Label>סגן מפקד</Label><Input value={formData.leadership.deputy} onChange={(e) => setFormData(prev => ({ ...prev, leadership: { ...prev.leadership, deputy: e.target.value }}))} /></div>
                    <div><Label>רב סמל</Label><Input value={formData.leadership.sergeant_major} onChange={(e) => setFormData(prev => ({ ...prev, leadership: { ...prev.leadership, sergeant_major: e.target.value }}))} /></div>
                    <div><Label>פרטי קשר</Label><Textarea value={formData.leadership.contact_details} onChange={(e) => setFormData(prev => ({ ...prev, leadership: { ...prev.leadership, contact_details: e.target.value }}))} /></div>
                  </TabsContent>

                  <TabsContent value="demographics" className="space-y-4">
                    <div><Label>סה״כ חיילים</Label><Input value={formData.demographics.total_soldiers} onChange={(e) => setFormData(prev => ({ ...prev, demographics: { ...prev.demographics, total_soldiers: e.target.value }}))} /></div>
                    <div><Label>טווח גילאים</Label><Input value={formData.demographics.age_range} onChange={(e) => setFormData(prev => ({ ...prev, demographics: { ...prev.demographics, age_range: e.target.value }}))} /></div>
                    <div><Label>מצב משפחתי</Label><Textarea value={formData.demographics.marital_status} onChange={(e) => setFormData(prev => ({ ...prev, demographics: { ...prev.demographics, marital_status: e.target.value }}))} /></div>
                    <div><Label>התפלגות גיאוגרפית</Label><Textarea value={formData.demographics.geographic_distribution} onChange={(e) => setFormData(prev => ({ ...prev, demographics: { ...prev.demographics, geographic_distribution: e.target.value }}))} /></div>
                  </TabsContent>

                  <TabsContent value="operational" className="space-y-4">
                    <div><Label>רמה נוכחית</Label><Input value={formData.operational_capability.current_level} onChange={(e) => setFormData(prev => ({ ...prev, operational_capability: { ...prev.operational_capability, current_level: e.target.value }}))} /></div>
                    <div><Label>סטטוס אימון</Label><Textarea value={formData.operational_capability.training_status} onChange={(e) => setFormData(prev => ({ ...prev, operational_capability: { ...prev.operational_capability, training_status: e.target.value }}))} /></div>
                    <div><Label>סטטוס ציוד</Label><Textarea value={formData.operational_capability.equipment_status} onChange={(e) => setFormData(prev => ({ ...prev, operational_capability: { ...prev.operational_capability, equipment_status: e.target.value }}))} /></div>
                  </TabsContent>

                  <TabsContent value="training" className="space-y-4">
                    <div><Label>קורסים שהושלמו</Label><Textarea value={formData.training_education.completed_courses} onChange={(e) => setFormData(prev => ({ ...prev, training_education: { ...prev.training_education, completed_courses: e.target.value }}))} /></div>
                    <div><Label>הכשרות עתידיות</Label><Textarea value={formData.training_education.upcoming_training} onChange={(e) => setFormData(prev => ({ ...prev, training_education: { ...prev.training_education, upcoming_training: e.target.value }}))} /></div>
                    <div><Label>הסמכות</Label><Textarea value={formData.training_education.certifications} onChange={(e) => setFormData(prev => ({ ...prev, training_education: { ...prev.training_education, certifications: e.target.value }}))} /></div>
                  </TabsContent>

                  <TabsContent value="welfare" className="space-y-4">
                    <div><Label>רמת שביעות רצון</Label><Input value={formData.welfare_morale.satisfaction_level} onChange={(e) => setFormData(prev => ({ ...prev, welfare_morale: { ...prev.welfare_morale, satisfaction_level: e.target.value }}))} /></div>
                    <div><Label>דאגות</Label><Textarea value={formData.welfare_morale.concerns} onChange={(e) => setFormData(prev => ({ ...prev, welfare_morale: { ...prev.welfare_morale, concerns: e.target.value }}))} /></div>
                    <div><Label>תוכניות תמיכה</Label><Textarea value={formData.welfare_morale.support_programs} onChange={(e) => setFormData(prev => ({ ...prev, welfare_morale: { ...prev.welfare_morale, support_programs: e.target.value }}))} /></div>
                  </TabsContent>

                  <TabsContent value="discipline" className="space-y-4">
                    <div><Label>אירועים</Label><Textarea value={formData.discipline_culture.incidents} onChange={(e) => setFormData(prev => ({ ...prev, discipline_culture: { ...prev.discipline_culture, incidents: e.target.value }}))} /></div>
                    <div><Label>ציונים לשבח</Label><Textarea value={formData.discipline_culture.commendations} onChange={(e) => setFormData(prev => ({ ...prev, discipline_culture: { ...prev.discipline_culture, commendations: e.target.value }}))} /></div>
                    <div><Label>הערות תרבות ארגונית</Label><Textarea value={formData.discipline_culture.culture_notes} onChange={(e) => setFormData(prev => ({ ...prev, discipline_culture: { ...prev.discipline_culture, culture_notes: e.target.value }}))} /></div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
                  <Button onClick={handleSaveProfile}>{editingProfile ? 'עדכן' : 'צור'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>יחידות ממופות</CardTitle>
              <Input placeholder="חיפוש יחידה..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">טוען...</p>
            ) : filteredProfiles.length === 0 ? (
              <p className="text-center text-muted-foreground">אין מיפויי יחידות</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שם היחידה</TableHead>
                    <TableHead className="text-right">מפקד</TableHead>
                    <TableHead className="text-right">סה״כ חיילים</TableHead>
                    <TableHead className="text-right">תאריך עדכון</TableHead>
                    <TableHead className="text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.unit_name}</TableCell>
                      <TableCell>{profile.leadership?.commander || 'לא צוין'}</TableCell>
                      <TableCell>{profile.demographics?.total_soldiers || 'לא צוין'}</TableCell>
                      <TableCell>{new Date(profile.updated_at).toLocaleDateString('he-IL')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditProfile(profile)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteProfile(profile.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnitProfiles;
