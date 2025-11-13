import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Edit,
  Trash2,
  UserPlus,
  Crown,
  User,
  Search,
  Shield
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  unit: string;
  profession: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive';
}

const users: UserData[] = [];

const professionOptions = [
  'מטה',
  'מנחה', 
  'קצין לכידות',
  'קצינת עורף',
  'מפקד',
  'מוביל לכידות פלוגותי',
  'אחר'
];

const Units = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const handleAddUser = () => {
    toast({
      title: "משתמש נוסף בהצלחה",
      description: "המשתמש החדש נוסף למערכת",
    });
    setIsAddUserOpen(false);
  };

  const handleEditUser = (userName: string) => {
    toast({
      title: "עריכת משתמש",
      description: `נפתח עורך המשתמש עבור ${userName}`,
    });
  };

  const handleRemoveUser = (userName: string) => {
    toast({
      title: "משתמש הוסר",
      description: `${userName} הוסר מהמערכת`, 
      variant: "destructive",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-warning" />;
      case 'member': return <User className="h-4 w-4 text-primary" />;
      default: return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'אדמין';
      case 'member': return 'חבר';
      default: return 'צופה';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = selectedUnit === 'all' || user.unit === selectedUnit;
    const matchesProfession = selectedProfession === 'all' || user.profession === selectedProfession;
    return matchesSearch && matchesUnit && matchesProfession;
  });

  const uniqueUnits = Array.from(new Set(users.map(user => user.unit)));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
         <div className="flex justify-between items-center mb-6" dir="rtl">
           <div>
             <div className="flex items-center gap-3 mb-2">
               <Users className="h-8 w-8 text-primary" />
               <h1 className="text-3xl font-bold text-foreground">ניהול משתמשים</h1>
             </div>
           </div>
           
           <div className="flex gap-2">
             <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
               <DialogTrigger asChild>
                 <Button className="gap-2">
                   <UserPlus className="h-4 w-4" />
                   הוסף משתמש חדש
                 </Button>
               </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>הוספת משתמש חדש</DialogTitle>
                    <DialogDescription>הוסף משתמש חדש למערכת</DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                   <div>
                     <Label htmlFor="user-name">שם מלא</Label>
                     <Input id="user-name" placeholder="שם המשתמש" />
                   </div>
                   
                   <div>
                     <Label htmlFor="user-email">כתובת מייל</Label>
                     <Input id="user-email" placeholder="user@example.com" />
                   </div>
                   
                   <div>
                     <Label htmlFor="user-unit">יחידה</Label>
                     <Select>
                       <SelectTrigger>
                         <SelectValue placeholder="בחר יחידה" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="unit-a">פלוגה א׳</SelectItem>
                         <SelectItem value="unit-b">פלוגה ב׳</SelectItem>
                         <SelectItem value="unit-c">פלוגה ג׳</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div>
                     <Label htmlFor="user-profession">מקצוע</Label>
                     <Select>
                       <SelectTrigger>
                         <SelectValue placeholder="בחר מקצוע" />
                       </SelectTrigger>
                       <SelectContent>
                         {professionOptions.map((profession) => (
                           <SelectItem key={profession} value={profession}>
                             {profession}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div>
                     <Label htmlFor="user-role">תפקיד</Label>
                     <Select>
                       <SelectTrigger>
                         <SelectValue placeholder="בחר תפקיד" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="admin">אדמין</SelectItem>
                         <SelectItem value="member">חבר</SelectItem>
                         <SelectItem value="viewer">צופה</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                    <div className="flex gap-2" dir="rtl">
                      <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                        ביטול
                      </Button>
                      <Button className="flex-1" onClick={handleAddUser}>הוסף משתמש</Button>
                    </div>
                 </div>
               </DialogContent>
             </Dialog>
           </div>
         </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6" dir="rtl">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="חיפוש משתמשים..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                  />
                </div>
              </div>
              
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="כל היחידות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל היחידות</SelectItem>
                  {uniqueUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedProfession} onValueChange={setSelectedProfession}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="כל המקצועות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המקצועות</SelectItem>
                  {professionOptions.map((profession) => (
                    <SelectItem key={profession} value={profession}>{profession}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">משתמש</TableHead>
                    <TableHead className="text-right">יחידה</TableHead>
                    <TableHead className="text-right">מקצוע</TableHead>
                    <TableHead className="text-right">תפקיד</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right">פעיל לאחרונה</TableHead>
                    <TableHead className="text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-foreground">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{user.unit}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">{user.profession}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="text-sm">{getRoleText(user.role)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">
                          {user.lastActive.toLocaleDateString('he-IL')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUser(user.name)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveUser(user.name)}
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
            
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">אין משתמשים במערכת</h3>
                <p className="text-sm">התחל על ידי הוספת המשתמש הראשון</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Units;