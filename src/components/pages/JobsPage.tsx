import { useState } from "react";
import { Filter, MapPin, Briefcase, DollarSign } from "lucide-react";
import { JobCard } from "../JobCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

export function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(true);

  const jobs = [
    {
      id: "1",
      title: "Senior Software Engineer",
      company: "Google",
      location: "Mountain View, CA",
      salary: "$150k-$200k",
      type: "Full-time",
      matchScore: 95,
      postedDate: "2 days ago",
      visaSponsorship: true,
    },
    {
      id: "2",
      title: "Full Stack Developer",
      company: "Meta",
      location: "Menlo Park, CA",
      salary: "$140k-$180k",
      type: "Full-time",
      matchScore: 92,
      postedDate: "3 days ago",
      visaSponsorship: true,
    },
    {
      id: "3",
      title: "Frontend Engineer",
      company: "Amazon",
      location: "Seattle, WA",
      salary: "$130k-$170k",
      type: "Full-time",
      matchScore: 88,
      postedDate: "1 week ago",
      visaSponsorship: true,
    },
    {
      id: "4",
      title: "Backend Engineer",
      company: "Microsoft",
      location: "Redmond, WA",
      salary: "$145k-$185k",
      type: "Full-time",
      matchScore: 90,
      postedDate: "4 days ago",
      visaSponsorship: true,
    },
    {
      id: "5",
      title: "React Developer",
      company: "Netflix",
      location: "Los Gatos, CA",
      salary: "$135k-$175k",
      type: "Full-time",
      matchScore: 86,
      postedDate: "5 days ago",
      visaSponsorship: false,
    },
    {
      id: "6",
      title: "DevOps Engineer",
      company: "Salesforce",
      location: "San Francisco, CA",
      salary: "$140k-$180k",
      type: "Full-time",
      matchScore: 84,
      postedDate: "1 week ago",
      visaSponsorship: true,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
      {/* Filters Sidebar */}
      {showFilters && (
        <aside className="w-full lg:w-80 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="mb-3">Filters</h3>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Input placeholder="e.g. Software Engineer" />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="ca">California</SelectItem>
                    <SelectItem value="ny">New York</SelectItem>
                    <SelectItem value="tx">Texas</SelectItem>
                    <SelectItem value="wa">Washington</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visa Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="opt">OPT</SelectItem>
                    <SelectItem value="stem-opt">STEM OPT</SelectItem>
                    <SelectItem value="h1b">H1B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="remote">Remote Only</Label>
                <Switch id="remote" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="visa-sponsor">H1B Sponsorship</Label>
                <Switch id="visa-sponsor" defaultChecked />
              </div>

              <Button className="w-full" variant="outline">
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        </aside>
      )}

      {/* Job Listings */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl mb-1 sm:mb-2">Job Listings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{jobs.length} jobs matching your profile</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => setSelectedJob(job)}
              onSave={() => console.log("Saved", job.id)}
              onApply={() => console.log("Applied", job.id)}
            />
          ))}
        </div>
      </div>

      {/* Job Detail Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{selectedJob.company[0]}</span>
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                    <DialogDescription className="text-lg mt-1">
                      {selectedJob.company}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedJob.salary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedJob.type}</span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2">About the Role</h3>
                  <p className="text-muted-foreground">
                    We are looking for a talented {selectedJob.title} to join our team. This role involves
                    working on cutting-edge technologies and solving complex problems at scale. You'll be
                    part of a dynamic team that values innovation and collaboration.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2">Requirements</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>5+ years of experience in software development</li>
                    <li>Strong proficiency in React, TypeScript, and modern web technologies</li>
                    <li>Experience with cloud platforms (AWS, GCP, or Azure)</li>
                    <li>Excellent problem-solving and communication skills</li>
                    <li>Bachelor's degree in Computer Science or related field</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2">Benefits</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Competitive salary and equity package</li>
                    <li>Comprehensive health, dental, and vision insurance</li>
                    <li>401(k) with company match</li>
                    <li>Flexible work arrangements</li>
                    <li>Professional development opportunities</li>
                    <li>H1B visa sponsorship available</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1">Apply Now</Button>
                  <Button variant="outline">Save for Later</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
