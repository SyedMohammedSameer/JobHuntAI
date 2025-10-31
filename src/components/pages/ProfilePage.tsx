import { useState, useEffect } from "react";
import { Upload, User, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { authService, User as UserType } from "../../services/authService";

export function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    university: '',
    major: '',
    visaType: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        university: userData.university || '',
        major: userData.major || '',
        visaType: userData.visaType || '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await authService.updateProfile(formData);
      toast.success('Profile updated successfully!');
      fetchProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Summary Card */}
      <Card className="border-2 border-[#00B4D8]/20 bg-gradient-to-br from-[#00B4D8]/5 to-[#0077B6]/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-[#00B4D8] to-[#0077B6] text-white">
                  JD
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#00B4D8] text-white flex items-center justify-center hover:bg-[#0077B6] transition-colors">
                <Upload className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl mb-1">John Doe</h2>
              <p className="text-muted-foreground mb-3">Software Engineer • Stanford University</p>
              <div className="flex gap-2">
                <Badge variant="outline">F-1 Student</Badge>
                <Badge variant="outline">STEM OPT</Badge>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-background">
                <div className="text-3xl bg-gradient-to-br from-[#00B4D8] to-[#0077B6] bg-clip-text text-transparent">
                  87
                </div>
                <p className="text-sm text-muted-foreground">Resume Score</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Strength */}
      <Card>
        <CardHeader>
          <CardTitle>Resume Strength</CardTitle>
          <CardDescription>Complete your profile to improve your job match score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span>Profile Completeness</span>
              <span>87%</span>
            </div>
            <Progress value={87} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Contact information added</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Work experience added</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Skills listed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span>Add certifications</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john.doe@email.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" defaultValue="San Francisco, CA" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Details</CardTitle>
          <CardDescription>Help us match you with relevant opportunities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-role">Current Role</Label>
            <Input id="current-role" defaultValue="Software Engineer" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visa-status">Visa Status</Label>
            <Select
              value={formData.visaType}
              onValueChange={(value) => setFormData({ ...formData, visaType: value })}
            >
              <SelectTrigger id="visa-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="F1">F-1 Student</SelectItem>
                <SelectItem value="OPT">OPT</SelectItem>
                <SelectItem value="STEM_OPT">STEM OPT</SelectItem>
                <SelectItem value="H1B">H1B</SelectItem>
                <SelectItem value="CITIZEN">US Citizen/Green Card</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred-roles">Preferred Roles</Label>
            <Input
              id="preferred-roles"
              defaultValue="Software Engineer, Full Stack Developer"
              placeholder="e.g. Software Engineer, Data Scientist"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Textarea
              id="skills"
              placeholder="e.g. React, TypeScript, Node.js, Python, AWS"
              defaultValue="React, TypeScript, Node.js, Python, AWS, Docker, Kubernetes, PostgreSQL"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Professional Summary</Label>
            <Textarea
              id="bio"
              placeholder="Write a brief summary about your professional background..."
              defaultValue="Experienced software engineer with 5+ years of expertise in full-stack development. Passionate about building scalable applications and leading technical teams."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>Upload your latest resume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-[#00B4D8] transition-colors cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="mb-2">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX (max 5MB)</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-10 w-10 rounded-lg bg-[#00B4D8]/10 flex items-center justify-center">
                <User className="h-5 w-5 text-[#00B4D8]" />
              </div>
              <div className="flex-1">
                <p className="text-sm">John_Doe_Resume.pdf</p>
                <p className="text-xs text-muted-foreground">Uploaded on Oct 10, 2025</p>
              </div>
              <Button variant="outline" size="sm">Replace</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#00B4D8]" />
        </div>
      ) : (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={fetchProfile}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
