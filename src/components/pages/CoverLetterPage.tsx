import { useState, useEffect } from "react";
import { Sparkles, Copy, Download, RefreshCw, FileText, Trash2, Edit2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { coverLetterService, CoverLetter, CoverLetterTone } from "../../services/coverLetterService";
import { jobService, Job } from "../../services/jobService";
import { resumeService, Resume } from "../../services/resumeService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

export function CoverLetterPage() {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [selectedResume, setSelectedResume] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<CoverLetterTone>('professional');
  const [viewingCoverLetter, setViewingCoverLetter] = useState<CoverLetter | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoverLetters();
    fetchJobs();
    fetchResumes();
  }, []);

  const fetchCoverLetters = async () => {
    try {
      setLoading(true);
      const data = await coverLetterService.getCoverLetters();
      setCoverLetters(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch cover letters');
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

  const fetchResumes = async () => {
    try {
      const data = await resumeService.getResumes();
      setResumes(data.filter(r => r.type === 'BASE'));
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedJob) {
      toast.error('Please select a job');
      return;
    }

    try {
      setGenerating(true);
      const response = await coverLetterService.generateCoverLetter({
        jobId: selectedJob,
        resumeId: selectedResume && selectedResume !== 'none' ? selectedResume : undefined,
        tone: selectedTone,
      });
      toast.success(`Cover letter generated! Tokens used: ${response.tokensUsed}`);
      fetchCoverLetters();
      setSelectedJob('');
      setSelectedResume('none');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate cover letter');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (coverLetterId: string, tone: CoverLetterTone) => {
    try {
      setGenerating(true);
      const response = await coverLetterService.regenerateCoverLetter(coverLetterId, tone);
      toast.success(`Cover letter regenerated! Tokens used: ${response.tokensUsed}`);
      fetchCoverLetters();
      if (viewingCoverLetter?._id === coverLetterId) {
        setViewingCoverLetter(response.coverLetter);
        setEditingContent(response.coverLetter.content);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate cover letter');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!viewingCoverLetter) return;

    try {
      setSaving(true);
      const updated = await coverLetterService.updateCoverLetter(
        viewingCoverLetter._id,
        editingContent
      );
      toast.success('Cover letter updated successfully');
      setCoverLetters(coverLetters.map(cl =>
        cl._id === updated._id ? updated : cl
      ));
      setViewingCoverLetter(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save cover letter');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = async (coverLetterId: string, fileName: string) => {
    try {
      const blob = await coverLetterService.downloadCoverLetter(coverLetterId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Cover letter downloaded!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download cover letter');
    }
  };

  const handleDelete = async (coverLetterId: string) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return;

    try {
      await coverLetterService.deleteCoverLetter(coverLetterId);
      toast.success('Cover letter deleted successfully');
      fetchCoverLetters();
      if (viewingCoverLetter?._id === coverLetterId) {
        setViewingCoverLetter(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete cover letter');
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
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl mb-2">Cover Letter Generator</h1>
        <p className="text-muted-foreground">
          Create AI-powered cover letters tailored to specific jobs
        </p>
      </div>

      {/* Generate Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Cover Letter</CardTitle>
          <CardDescription>
            Select a job and customize the tone to generate a cover letter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Job</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
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

            <div className="space-y-2">
              <Label>Select Resume (Optional)</Label>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {resumes.map((resume) => (
                    <SelectItem key={resume._id} value={resume._id}>
                      {resume.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Writing Tone</Label>
            <Select
              value={selectedTone}
              onValueChange={(value) => setSelectedTone(value as CoverLetterTone)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!selectedJob || generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Cover Letter
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Cover Letters List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Cover Letters</CardTitle>
          <CardDescription>
            View, edit, and manage your generated cover letters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00B4D8]" />
            </div>
          ) : coverLetters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No cover letters generated yet. Create your first one above!
            </div>
          ) : (
            <div className="space-y-3">
              {coverLetters.map((cl) => (
                <div
                  key={cl._id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setViewingCoverLetter(cl);
                    setEditingContent(cl.content);
                  }}
                >
                  <div className="h-12 w-12 rounded-lg bg-[#00B4D8]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-[#00B4D8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {cl.jobTitle} at {cl.company}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="capitalize">{cl.tone}</span>
                      <span>•</span>
                      <span>{formatDate(cl.createdAt)}</span>
                      {cl.metadata?.qualityScore && (
                        <>
                          <span>•</span>
                          <span>Quality: {cl.metadata.qualityScore}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(cl.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(cl._id, `${cl.jobTitle}_${cl.company}`)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cl._id)}
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

      {/* View/Edit Dialog */}
      <Dialog
        open={!!viewingCoverLetter}
        onOpenChange={() => setViewingCoverLetter(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {viewingCoverLetter && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {viewingCoverLetter.jobTitle} at {viewingCoverLetter.company}
                </DialogTitle>
                <DialogDescription>
                  Generated on {formatDate(viewingCoverLetter.createdAt)} • {' '}
                  {viewingCoverLetter.tone} tone
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select
                    value={viewingCoverLetter.tone}
                    onValueChange={(value) =>
                      handleRegenerate(viewingCoverLetter._id, value as CoverLetterTone)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleRegenerate(viewingCoverLetter._id, viewingCoverLetter.tone)
                    }
                    disabled={generating}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>

                <Textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="min-h-[400px] font-serif"
                />

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopy(editingContent)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDownload(
                        viewingCoverLetter._id,
                        `${viewingCoverLetter.jobTitle}_${viewingCoverLetter.company}`
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                {viewingCoverLetter.metadata?.tokensUsed && (
                  <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                    Tokens used: {viewingCoverLetter.metadata.tokensUsed} •
                    Word count: {viewingCoverLetter.metadata.wordCount || 'N/A'}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
