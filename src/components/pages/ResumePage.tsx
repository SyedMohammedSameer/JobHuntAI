import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Download, Trash2, Sparkles, Loader2, Eye } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { resumeService, Resume } from "../../services/resumeService";
import { jobService, Job } from "../../services/jobService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [selectedJobForTailor, setSelectedJobForTailor] = useState<string>('');
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResumes();
    fetchJobs();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const data = await resumeService.getResumes();
      setResumes(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await jobService.searchJobs({ limit: 50 });
      setJobs(response.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      await resumeService.uploadResume(file);
      toast.success('Resume uploaded successfully!');
      fetchResumes();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleTailorResume = async () => {
    if (!selectedResume || !selectedJobForTailor) {
      toast.error('Please select a resume and a job');
      return;
    }

    try {
      setTailoring(true);
      const response = await resumeService.tailorResume(
        selectedResume._id,
        selectedJobForTailor
      );
      toast.success(
        `Resume tailored successfully! Tokens used: ${response.tokensUsed}`
      );
      fetchResumes();
      setSelectedResume(null);
      setSelectedJobForTailor('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to tailor resume');
    } finally {
      setTailoring(false);
    }
  };

  const handleDownloadResume = async (resumeId: string, fileName: string) => {
    try {
      const blob = await resumeService.downloadResume(resumeId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download resume');
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await resumeService.deleteResume(resumeId);
      toast.success('Resume deleted successfully');
      fetchResumes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete resume');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Resume Manager</h1>
        <p className="text-muted-foreground">
          Upload and tailor your resumes for specific job applications
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>Upload your resume in PDF or Word format</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center hover:border-[#00B4D8] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-[#00B4D8] animate-spin" />
            ) : (
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            )}
            <p className="mb-2">
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, DOC, or DOCX (max 5MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tailor Resume Section */}
      {resumes.filter((r) => r.type === 'BASE').length > 0 && jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tailor Resume for Job</CardTitle>
            <CardDescription>
              Use AI to customize your resume for a specific job
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Resume</Label>
                <Select
                  value={selectedResume?._id || ''}
                  onValueChange={(value) => {
                    const resume = resumes.find((r) => r._id === value);
                    setSelectedResume(resume || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes
                      .filter((r) => r.type === 'BASE')
                      .map((resume) => (
                        <SelectItem key={resume._id} value={resume._id}>
                          {resume.fileName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Job</Label>
                <Select
                  value={selectedJobForTailor}
                  onValueChange={setSelectedJobForTailor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.slice(0, 20).map((job) => (
                      <SelectItem key={job._id} value={job._id}>
                        {job.title} - {job.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleTailorResume}
              disabled={!selectedResume || !selectedJobForTailor || tailoring}
              className="w-full"
            >
              {tailoring ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Tailoring Resume...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Tailor Resume with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resumes List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
          <CardDescription>
            Manage your uploaded and tailored resumes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00B4D8]" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No resumes uploaded yet. Upload your first resume to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume._id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-[#00B4D8]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-[#00B4D8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{resume.fileName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="capitalize">
                        {resume.type === 'BASE' ? 'Original' : 'Tailored'}
                      </span>
                      <span>•</span>
                      <span>{formatDate(resume.createdAt)}</span>
                      {resume.metadata?.atsScore && (
                        <>
                          <span>•</span>
                          <span>ATS Score: {resume.metadata.atsScore}%</span>
                        </>
                      )}
                    </div>
                    {resume.metadata?.tailoredFor && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tailored for: {resume.metadata.tailoredFor.jobTitle} at{' '}
                        {resume.metadata.tailoredFor.company}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingResume(resume)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDownloadResume(resume._id, resume.fileName)
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteResume(resume._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Resume Dialog */}
      <Dialog
        open={!!viewingResume}
        onOpenChange={() => setViewingResume(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {viewingResume && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingResume.fileName}</DialogTitle>
                <DialogDescription>
                  {viewingResume.type === 'BASE' ? 'Original Resume' : 'Tailored Resume'}
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                {viewingResume.tailoredContent || viewingResume.originalText}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
