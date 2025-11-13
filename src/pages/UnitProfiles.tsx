import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Plus, 
  Edit,
  Trash2,
  Award,
  Shield,
  Target,
  History,
  Heart,
  Trophy,
  AlertTriangle
} from "lucide-react";

interface UnitProfile {
  id: string;
  org_id: string;
  unit_id: string;
  unit_name: string;
  leadership: any;
  demographics: any;
  capabilities: any;
  preferences: any;
  sensitivities: any;
  history: any;
  goals: any;
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
    leadership: {
      commander: '',
      deputy: '',
      sergeant_major: '',
      contact_details: ''
    },
    demographics: {
      total_soldiers: '',
      age_range: '',
      marital_status: '',
      geographic_distribution: ''
    },
    capabilities: {
      professional_skills: '',
      military_experience: '',
      special_training: '',
      strengths: ''
    },
    preferences: {
      activity_types: '',
      group_dynamics: '',
      learning_styles: ''
    },
    sensitivities: {
      topics_to_avoid: '',
      cultural_considerations: '',
      past_incidents: ''
    },
    history: {
      previous_activities: '',
      success_stories: '',
      lessons_learned: ''
    },
    goals: {
      short_term: '',
      long_term: '',
      focus_areas: ''
    }
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
      const profileData = {
        org_id: "temp-org-id", // In production, get from auth
        unit_id: `unit-${Date.now()}`,
        unit_name: formData.unit_name,
        leadership: formData.leadership,
        demographics: formData.demographics,
        capabilities: formData.capabilities,
        preferences: formData.preferences,
        sensitivities: formData.sensitivities,
        history: formData.history,
        goals: formData.goals,
        created_by: "temp-user-id", // In production, get from auth
        updated_by: "temp-user-id"
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
      capabilities: profile.capabilities || {},
      preferences: profile.preferences || {},
      sensitivities: profile.sensitivities || {},
      history: profile.history || {},
      goals: profile.goals || {}
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
      capabilities: { professional_skills: '', military_experience: '', special_training: '', strengths: '' },
      preferences: { activity_types: '', group_dynamics: '', learning_styles: '' },
      sensitivities: { topics_to_avoid: '', cultural_considerations: '', past_incidents: '' },
      history: { previous_activities: '', success_stories: '', lessons_learned: '' },
      goals: { short_term: '', long_term: '', focus_areas: '' }
    });
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6" dir="rtl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">מסמכי מיפוי פלוגתי</h1>
            </div>
            <p className="text-muted-foreground">ניהול פרופילי יחידות ופלוגות</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => { setEditingProfile(null); resetForm(); }}>
                <Plus className="h-4 w-4" />
                יצירת מיפוי חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingProfile ? 'עריכת' : 'יצירת'} מיפוי פלוגתי</DialogTitle>
                <DialogDescription>מלא את הפרטים הרלוונטיים ליחידה</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unit-name">שם היחידה</Label>
                  <Input
                    id="unit-name"
                    placeholder="פלוגה א', פלוגה ב' וכו'"
                    value={formData.unit_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_name: e.target.value }))}
                  />
                </div>

                <Tabs defaultValue="leadership" className="w-full">
                  <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="leadership">הנהגה</TabsTrigger>
                    <TabsTrigger value="demographics">דמוגרפיה</TabsTrigger>
                    <TabsTrigger value="capabilities">יכולות</TabsTrigger>
                    <TabsTrigger value="preferences">העדפות</TabsTrigger>
                    <TabsTrigger value="sensitivities">רגישויות</TabsTrigger>
                    <TabsTrigger value="history">היסטוריה</TabsTrigger>
                    <TabsTrigger value="goals">יעדים</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="leadership" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>מפקד</Label>
                        <Input
                          placeholder="שם המפקד"
                          value={formData.leadership.commander}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            leadership: { ...prev.leadership, commander: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>סגן מפקד</Label>
                        <Input
                          placeholder="שם סגן המפקד"
                          value={formData.leadership.deputy}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            leadership: { ...prev.leadership, deputy: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>סמל מפקד</Label>
                      <Input
                        placeholder="שם סמל המפקד"
                        value={formData.leadership.sergeant_major}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          leadership: { ...prev.leadership, sergeant_major: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>פרטי יצירת קשר</Label>
                      <Textarea
                        placeholder="טלפונים, מיילים, קבוצת ווטסאפ"
                        value={formData.leadership.contact_details}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          leadership: { ...prev.leadership, contact_details: e.target.value }
                        }))}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="demographics" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>מספר חיילים</Label>
                        <Input
                          placeholder="40-50 חיילים"
                          value={formData.demographics.total_soldiers}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            demographics: { ...prev.demographics, total_soldiers: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>טווח גילאים</Label>
                        <Input
                          placeholder="20-35"
                          value={formData.demographics.age_range}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            demographics: { ...prev.demographics, age_range: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>מצב משפחתי</Label>
                      <Textarea
                        placeholder="60% רווקים, 40% נשואים, רוב הורים צעירים"
                        value={formData.demographics.marital_status}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          demographics: { ...prev.demographics, marital_status: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>פיזור גיאוגרפי</Label>
                      <Textarea
                        placeholder="מרכז הארץ, שפלה, ירושלים"
                        value={formData.demographics.geographic_distribution}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          demographics: { ...prev.demographics, geographic_distribution: e.target.value }
                        }))}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="capabilities" className="space-y-4">
                    <div>
                      <Label>כישורים מקצועיים</Label>
                      <Textarea
                        placeholder="הנדסה, רפואה, חינוך, טכנולוגיה"
                        value={formData.capabilities.professional_skills}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          capabilities: { ...prev.capabilities, professional_skills: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>ניסיון צבאי</Label>
                      <Textarea
                        placeholder="קורסים, פיקוד, לחימה"
                        value={formData.capabilities.military_experience}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          capabilities: { ...prev.capabilities, military_experience: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>הדרכות מיוחדות</Label>
                      <Textarea
                        placeholder="קורסי הדרכה, הכשרות מיוחדות"
                        value={formData.capabilities.special_training}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          capabilities: { ...prev.capabilities, special_training: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>חוזקות קבוצתיות</Label>
                      <Textarea
                        placeholder="לכידות גבוהה, מנהיגות טבעית, רוח צוות"
                        value={formData.capabilities.strengths}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          capabilities: { ...prev.capabilities, strengths: e.target.value }
                        }))}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preferences" className="space-y-4">
                    <div>
                      <Label>סוגי פעילויות מועדפות</Label>
                      <Textarea
                        placeholder="סדנאות, פעילויות חוץ, דיונים קבוצתיים"
                        value={formData.preferences.activity_types}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, activity_types: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>דינמיקה קבוצתית</Label>
                      <Textarea
                        placeholder="קבוצות קטנות 8-12, דיונים פתוחים"
                        value={formData.preferences.group_dynamics}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, group_dynamics: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>סגנונות למידה</Label>
                      <Textarea
                        placeholder="למידה חווייתית, דוגמאות מעשיות"
                        value={formData.preferences.learning_styles}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, learning_styles: e.target.value }
                        }))}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sensitivities" className="space-y-4">
                    <div>
                      <Label>נושאים להימנעות</Label>
                      <Textarea
                        placeholder="נושאים רגישים, אירועים שליליים"
                        value={formData.sensitivities.topics_to_avoid}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sensitivities: { ...prev.sensitivities, topics_to_avoid: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>שיקולים תרבותיים/דתיים</Label>
                      <Textarea
                        placeholder="רקע דתי/חילוני, מסורות מיוחדות"
                        value={formData.sensitivities.cultural_considerations}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sensitivities: { ...prev.sensitivities, cultural_considerations: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>אירועי עבר פלוגתיים</Label>
                      <Textarea
                        placeholder="אירועים קשים, אבדות, קונפליקטים"
                        value={formData.sensitivities.past_incidents}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sensitivities: { ...prev.sensitivities, past_incidents: e.target.value }
                        }))}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="space-y-4">
                    <div>
                      <Label>פעילויות קודמות</Label>
                      <Textarea
                        placeholder="סדנאות, ערבי פלוגה, פעילויות גיבוש"
                        value={formData.history.previous_activities}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          history: { ...prev.history, previous_activities: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>סיפורי הצלחה</Label>
                      <Textarea
                        placeholder="הישגים, פריצות דרך, שיפורים"
                        value={formData.history.success_stories}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          history: { ...prev.history, success_stories: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>לקחים שנלמדו</Label>
                      <Textarea
                        placeholder="מה עבד טוב, מה פחות, המלצות לעתיד"
                        value={formData.history.lessons_learned}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          history: { ...prev.history, lessons_learned: e.target.value }
                        }))}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="goals" className="space-y-4">
                    <div>
                      <Label>יעדים קצרי טווח</Label>
                      <Textarea
                        placeholder="3-6 חודשים הקרובים"
                        value={formData.goals.short_term}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          goals: { ...prev.goals, short_term: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>יעדים ארוכי טווח</Label>
                      <Textarea
                        placeholder="שנה-שנתיים"
                        value={formData.goals.long_term}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          goals: { ...prev.goals, long_term: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>תחומי התמקדות</Label>
                      <Textarea
                        placeholder="לכידות, מנהיגות, משמעת, רווחה"
                        value={formData.goals.focus_areas}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          goals: { ...prev.goals, focus_areas: e.target.value }
                        }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex gap-2 pt-4" dir="rtl">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleSaveProfile} className="flex-1">
                    {editingProfile ? 'עדכן מיפוי' : 'צור מיפוי'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                מיפויי היחידות
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="חיפוש יחידות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">טוען מיפויי יחידות...</div>
            ) : filteredProfiles.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium mb-2">אין מיפויי יחידות</h3>
                            <p className="text-sm">התחל על ידי יצירת המיפוי הראשון</p>
                          </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">יחידה</TableHead>
                      <TableHead className="text-right">מפקד</TableHead>
                      <TableHead className="text-right">מספר חיילים</TableHead>
                      <TableHead className="text-right">עדכון אחרון</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary-foreground">
                                {profile.unit_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{profile.unit_name}</div>
                              <Badge variant="outline" className="text-xs">מיפוי פלוגתי</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm">
                            {profile.leadership?.commander || 'לא צוין'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm">
                            {profile.demographics?.total_soldiers || 'לא צוין'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-muted-foreground">
                            {new Date(profile.updated_at).toLocaleDateString('he-IL')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditProfile(profile)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteProfile(profile.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnitProfiles;