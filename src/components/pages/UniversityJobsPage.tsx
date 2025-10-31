import { GraduationCap, ExternalLink, Plus, AlertCircle, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function UniversityJobsPage() {
  const universityJobs = [
    {
      id: 1,
      title: "Software Engineer Intern",
      department: "Computer Science",
      university: "Stanford University",
      type: "Internship",
      posted: "2 days ago",
    },
    {
      id: 2,
      title: "Research Assistant - AI Lab",
      department: "Artificial Intelligence",
      university: "Stanford University",
      type: "Part-time",
      posted: "1 week ago",
    },
    {
      id: 3,
      title: "Teaching Assistant - Web Development",
      department: "Computer Science",
      university: "Stanford University",
      type: "Part-time",
      posted: "3 days ago",
    },
    {
      id: 4,
      title: "Graduate Research Assistant",
      department: "Machine Learning",
      university: "Stanford University",
      type: "Full-time",
      posted: "5 days ago",
    },
  ];

  const universityPortals = [
    {
      name: "Stanford University",
      logo: "S",
      jobsCount: 45,
      lastSync: "2 hours ago",
    },
    {
      name: "MIT",
      logo: "M",
      jobsCount: 38,
      lastSync: "5 hours ago",
    },
    {
      name: "UC Berkeley",
      logo: "B",
      jobsCount: 52,
      lastSync: "1 hour ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl mb-2">
            University Job Listings
            <Badge variant="secondary" className="ml-3 text-xs">PREVIEW MODE</Badge>
          </h1>
          <p className="text-muted-foreground">
            Find on-campus opportunities and research positions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add University Portal
        </Button>
      </div>

      {/* Preview Mode Disclaimer */}
      <Alert className="border-[#00B4D8] bg-[#00B4D8]/5">
        <Info className="h-5 w-5 text-[#00B4D8]" />
        <AlertTitle className="text-[#00B4D8] mb-2">Preview Mode - Real Data Coming Soon!</AlertTitle>
        <AlertDescription className="text-sm">
          <p className="mb-2">
            University job listings are currently in <strong>preview mode</strong> with sample data. We're working on integrating real-time job feeds from 50+ top universities.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              ✅ UI/UX Complete
            </Badge>
            <Badge variant="outline" className="text-xs">
              🚧 Real-time Data: Coming Q1 2026
            </Badge>
            <Badge variant="outline" className="text-xs">
              📅 Target: 50+ Universities
            </Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <strong>Want to see your university added first?</strong> Contact us to request priority integration for your school.
          </p>
        </AlertDescription>
      </Alert>

      {/* University Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <GraduationCap className="h-8 w-8 text-[#00B4D8]" />
            <div className="flex-1">
              <Label className="mb-2 block">Select University</Label>
              <Select defaultValue="stanford">
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stanford">Stanford University</SelectItem>
                  <SelectItem value="mit">MIT</SelectItem>
                  <SelectItem value="berkeley">UC Berkeley</SelectItem>
                  <SelectItem value="harvard">Harvard University</SelectItem>
                  <SelectItem value="cmu">Carnegie Mellon University</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Portals */}
      <div>
        <h2 className="text-xl mb-4">Connected University Portals</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {universityPortals.map((portal, index) => (
            <Card key={index} className="hover:border-[#00B4D8] transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center text-white text-xl">
                    {portal.logo}
                  </div>
                  <Badge variant="secondary">{portal.jobsCount} jobs</Badge>
                </div>
                <h3 className="mb-1">{portal.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Synced {portal.lastSync}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  View Jobs
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Job Listings */}
      <div>
        <h2 className="text-xl mb-4">Recent Opportunities</h2>
        <div className="space-y-4">
          {universityJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#00B4D8]/10 to-[#0077B6]/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-6 w-6 text-[#00B4D8]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {job.department} • {job.university}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{job.type}</Badge>
                        <Badge variant="outline" className="text-muted-foreground">
                          {job.posted}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm">Apply</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-[#00B4D8]/5 to-[#0077B6]/5 border-2 border-[#00B4D8]/20">
        <CardHeader>
          <CardTitle>Why University Jobs?</CardTitle>
          <CardDescription>
            Benefits of on-campus employment for international students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-[#00B4D8] mt-1">•</span>
              <span>
                <strong>CPT/OPT Friendly:</strong> Many positions are eligible for Curricular Practical Training
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00B4D8] mt-1">•</span>
              <span>
                <strong>Flexible Hours:</strong> Work schedules designed around your academic commitments
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00B4D8] mt-1">•</span>
              <span>
                <strong>Research Experience:</strong> Gain valuable experience in your field of study
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00B4D8] mt-1">•</span>
              <span>
                <strong>Network Building:</strong> Connect with professors and industry professionals
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
