import { useState, useEffect } from "react";
import { Filter, MapPin, Briefcase, DollarSign, Bookmark, ExternalLink, Loader2 } from "lucide-react";
import { JobCard } from "../JobCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";
import { jobService, Job, JobSearchFilters } from "../../services/jobService";

export function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookmarkingJobId, setBookmarkingJobId] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<JobSearchFilters>({
    query: '',
    location: '',
    remote: false,
    employmentType: '',
    visaSponsorship: undefined,
    experienceLevel: '',
    page: 1,
    limit: 20,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });

  // Fetch jobs on mount and when filters change
  useEffect(() => {
    fetchJobs();
  }, [filters.page]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.searchJobs(filters);
      setJobs(response.jobs);
      setPagination(response.pagination);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    fetchJobs();
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      location: '',
      remote: false,
      employmentType: '',
      visaSponsorship: undefined,
      experienceLevel: '',
      page: 1,
      limit: 20,
    });
    setTimeout(() => fetchJobs(), 0);
  };

  const handleBookmark = async (jobId: string) => {
    try {
      setBookmarkingJobId(jobId);
      const job = jobs.find(j => j._id === jobId);

      if (job?.isBookmarked) {
        await jobService.unbookmarkJob(jobId);
        toast.success('Job removed from bookmarks');
      } else {
        await jobService.bookmarkJob(jobId);
        toast.success('Job bookmarked successfully');
      }

      // Update local state
      setJobs(jobs.map(j =>
        j._id === jobId ? { ...j, isBookmarked: !j.isBookmarked } : j
      ));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to bookmark job');
    } finally {
      setBookmarkingJobId(null);
    }
  };

  const handleLoadMore = () => {
    setFilters({ ...filters, page: (filters.page || 1) + 1 });
  };

  const formatSalary = (job: Job) => {
    if (job.salaryMin && job.salaryMax) {
      return `$${(job.salaryMin / 1000).toFixed(0)}k-$${(job.salaryMax / 1000).toFixed(0)}k`;
    }
    return 'Salary not specified';
  };

  const formatPostedDate = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

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
                <Label>Search Keywords</Label>
                <Input
                  placeholder="e.g. Software Engineer"
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="e.g. San Francisco, CA"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Visa Sponsorship</Label>
                <Select
                  value={filters.visaSponsorship || 'all'}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      visaSponsorship: value === 'all' ? undefined : (value as any),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="opt">OPT</SelectItem>
                    <SelectItem value="stemOpt">STEM OPT</SelectItem>
                    <SelectItem value="h1b">H1B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select
                  value={filters.employmentType || 'all'}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      employmentType: value === 'all' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="FULL_TIME">Full-time</SelectItem>
                    <SelectItem value="PART_TIME">Part-time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="remote">Remote Only</Label>
                <Switch
                  id="remote"
                  checked={filters.remote}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, remote: checked })
                  }
                />
              </div>

              <Button className="w-full" variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>

              <Button className="w-full" onClick={handleSearch}>
                Apply Filters
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
            <p className="text-sm sm:text-base text-muted-foreground">
              {loading ? 'Loading...' : `${pagination.total} jobs found`}
            </p>
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00B4D8]" />
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No jobs found. Try adjusting your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={{
                    id: job._id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    salary: formatSalary(job),
                    type: job.employmentType.replace('_', ' '),
                    matchScore: job.matchScore || 0,
                    postedDate: formatPostedDate(job.postedDate),
                    visaSponsorship: job.visaSponsorship.h1b || job.visaSponsorship.opt || job.visaSponsorship.stemOpt,
                  }}
                  onClick={() => setSelectedJob(job)}
                  onSave={() => handleBookmark(job._id)}
                  onApply={() => {
                    setSelectedJob(job);
                    toast.info('Application feature coming soon!');
                  }}
                />
              ))}
            </div>

            {pagination.page < pagination.pages && (
              <div className="mt-6 flex justify-center">
                <Button onClick={handleLoadMore} variant="outline">
                  Load More Jobs
                </Button>
              </div>
            )}
          </>
        )}
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
                    <span>{formatSalary(selectedJob)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedJob.employmentType.replace('_', ' ')}</span>
                  </div>
                  {selectedJob.remote && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded-md text-xs font-medium">
                        Remote
                      </span>
                    </div>
                  )}
                </div>

                {(selectedJob.visaSponsorship.h1b ||
                  selectedJob.visaSponsorship.opt ||
                  selectedJob.visaSponsorship.stemOpt) && (
                  <div className="p-3 bg-[#00B4D8]/10 rounded-lg">
                    <p className="text-sm font-medium text-[#00B4D8]">
                      Visa Sponsorship Available:{' '}
                      {[
                        selectedJob.visaSponsorship.h1b && 'H1B',
                        selectedJob.visaSponsorship.opt && 'OPT',
                        selectedJob.visaSponsorship.stemOpt && 'STEM OPT',
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="mb-2">Job Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedJob.description}
                  </p>
                </div>

                {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
                  <div>
                    <h3 className="mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skillsRequired.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-muted rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {selectedJob.sourceUrl && (
                    <Button
                      className="flex-1"
                      onClick={() => window.open(selectedJob.sourceUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on {selectedJob.source}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleBookmark(selectedJob._id)}
                    disabled={bookmarkingJobId === selectedJob._id}
                  >
                    <Bookmark
                      className={`h-4 w-4 mr-2 ${
                        selectedJob.isBookmarked ? 'fill-current' : ''
                      }`}
                    />
                    {selectedJob.isBookmarked ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
