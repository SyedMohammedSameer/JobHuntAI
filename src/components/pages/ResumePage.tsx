import { useState } from "react";
import { Upload, FileText, Download, Copy, Sparkles, ArrowRightLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner@2.0.3";

export function ResumePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Resume tailored successfully!");
    }, 2000);
  };

  const handleCopy = () => {
    toast.success("Copied to clipboard!");
  };

  const handleDownload = () => {
    toast.success("Resume downloaded!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">AI Resume Tailor</h1>
        <p className="text-muted-foreground">
          Customize your resume for each job application using AI
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Upload Resume */}
        <Card>
          <CardHeader>
            <CardTitle>Your Resume</CardTitle>
            <CardDescription>Upload or paste your current resume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-[#00B4D8] transition-colors cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="mb-2">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX (max 5MB)</p>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or paste text</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-text">Resume Text</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste your resume here..."
                className="min-h-[300px] font-mono text-sm"
                defaultValue="John Doe&#10;Software Engineer&#10;&#10;EXPERIENCE&#10;Senior Software Engineer at Tech Corp (2022-Present)&#10;• Led development of microservices architecture&#10;• Improved system performance by 40%&#10;• Mentored team of 5 junior engineers&#10;&#10;Software Engineer at StartupXYZ (2020-2022)&#10;• Built React-based dashboard&#10;• Implemented CI/CD pipeline&#10;&#10;EDUCATION&#10;B.S. Computer Science, Stanford University (2020)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Job Description */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>Paste the job posting you're applying for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <input
                id="job-title"
                className="w-full px-3 py-2 rounded-lg border bg-input-background"
                placeholder="e.g. Senior Software Engineer"
                defaultValue="Senior Full Stack Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <input
                id="company-name"
                className="w-full px-3 py-2 rounded-lg border bg-input-background"
                placeholder="e.g. Google"
                defaultValue="Google"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the full job description here..."
                className="min-h-[300px] font-mono text-sm"
                defaultValue="We are seeking a Senior Full Stack Engineer to join our team...&#10;&#10;Requirements:&#10;• 5+ years of experience with React and Node.js&#10;• Strong understanding of microservices architecture&#10;• Experience with AWS cloud services&#10;• Excellent communication and leadership skills&#10;• B.S. in Computer Science or equivalent&#10;&#10;Responsibilities:&#10;• Design and implement scalable web applications&#10;• Lead technical architecture decisions&#10;• Mentor junior developers&#10;• Collaborate with product and design teams"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Tailor Resume with AI
            </>
          )}
        </Button>
      </div>

      {/* Output Section */}
      {!isGenerating && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tailored Resume</CardTitle>
                <CardDescription>
                  Your resume optimized for the job description
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  {showComparison ? "Hide" : "Show"} Comparison
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showComparison ? (
              <Tabs defaultValue="tailored" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="original">Original</TabsTrigger>
                  <TabsTrigger value="tailored">Tailored</TabsTrigger>
                </TabsList>
                <TabsContent value="original" className="mt-4">
                  <div className="p-6 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap">
                    John Doe
                    Software Engineer

                    EXPERIENCE
                    Senior Software Engineer at Tech Corp (2022-Present)
                    • Led development of microservices architecture
                    • Improved system performance by 40%
                    • Mentored team of 5 junior engineers

                    Software Engineer at StartupXYZ (2020-2022)
                    • Built React-based dashboard
                    • Implemented CI/CD pipeline

                    EDUCATION
                    B.S. Computer Science, Stanford University (2020)
                  </div>
                </TabsContent>
                <TabsContent value="tailored" className="mt-4">
                  <div className="p-6 bg-gradient-to-br from-[#00B4D8]/5 to-[#0077B6]/5 rounded-lg border-2 border-[#00B4D8]/20 font-mono text-sm whitespace-pre-wrap">
                    John Doe
                    Senior Full Stack Engineer

                    EXPERIENCE
                    Senior Software Engineer at Tech Corp (2022-Present)
                    • Led development of microservices architecture using Node.js and React, aligning with modern full-stack practices
                    • Improved system performance by 40% through optimization of AWS cloud infrastructure
                    • Mentored and provided technical leadership to team of 5 junior engineers, fostering collaborative development culture

                    Software Engineer at StartupXYZ (2020-2022)
                    • Built scalable React-based dashboard with Node.js backend, demonstrating full-stack capabilities
                    • Implemented CI/CD pipeline using AWS services, ensuring reliable deployment processes
                    • Collaborated effectively with product and design teams to deliver user-centric solutions

                    EDUCATION
                    B.S. Computer Science, Stanford University (2020)

                    TECHNICAL SKILLS
                    Languages & Frameworks: React, Node.js, JavaScript, TypeScript
                    Cloud & Infrastructure: AWS (EC2, S3, Lambda), Microservices Architecture
                    Leadership: Technical mentorship, architectural decision-making, cross-functional collaboration
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="p-6 bg-gradient-to-br from-[#00B4D8]/5 to-[#0077B6]/5 rounded-lg border-2 border-[#00B4D8]/20 font-mono text-sm whitespace-pre-wrap">
                John Doe
                Senior Full Stack Engineer

                EXPERIENCE
                Senior Software Engineer at Tech Corp (2022-Present)
                • Led development of microservices architecture using Node.js and React, aligning with modern full-stack practices
                • Improved system performance by 40% through optimization of AWS cloud infrastructure
                • Mentored and provided technical leadership to team of 5 junior engineers, fostering collaborative development culture

                Software Engineer at StartupXYZ (2020-2022)
                • Built scalable React-based dashboard with Node.js backend, demonstrating full-stack capabilities
                • Implemented CI/CD pipeline using AWS services, ensuring reliable deployment processes
                • Collaborated effectively with product and design teams to deliver user-centric solutions

                EDUCATION
                B.S. Computer Science, Stanford University (2020)

                TECHNICAL SKILLS
                Languages & Frameworks: React, Node.js, JavaScript, TypeScript
                Cloud & Infrastructure: AWS (EC2, S3, Lambda), Microservices Architecture
                Leadership: Technical mentorship, architectural decision-making, cross-functional collaboration
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
