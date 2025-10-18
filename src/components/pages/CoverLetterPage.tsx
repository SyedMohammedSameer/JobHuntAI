import { useState } from "react";
import { Sparkles, Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner@2.0.3";

export function CoverLetterPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
      toast.success("Cover letter generated successfully!");
    }, 2000);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Cover letter regenerated!");
    }, 2000);
  };

  const handleCopy = () => {
    toast.success("Copied to clipboard!");
  };

  const handleDownload = () => {
    toast.success("Cover letter downloaded!");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl mb-2">AI Cover Letter Generator</h1>
        <p className="text-muted-foreground">
          Create personalized cover letters that match job requirements
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Provide information about the job you're applying for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                placeholder="e.g. Senior Software Engineer"
                defaultValue="Senior Full Stack Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="e.g. Google"
                defaultValue="Google"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Writing Tone</Label>
              <Select defaultValue="professional">
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <Select defaultValue="medium">
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (~200 words)</SelectItem>
                  <SelectItem value="medium">Medium (~350 words)</SelectItem>
                  <SelectItem value="long">Long (~500 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlights">Key Highlights (Optional)</Label>
            <Input
              id="highlights"
              placeholder="e.g. 5 years React experience, AWS certified"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
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

      {/* Output Section */}
      {hasGenerated && !isGenerating && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Cover Letter</CardTitle>
                <CardDescription>
                  AI-generated cover letter tailored for this position
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRegenerate}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
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
            <div className="p-6 bg-gradient-to-br from-[#00B4D8]/5 to-[#0077B6]/5 rounded-lg border-2 border-[#00B4D8]/20 space-y-4">
              <div>
                <p>John Doe</p>
                <p className="text-muted-foreground">john.doe@email.com</p>
                <p className="text-muted-foreground">San Francisco, CA</p>
              </div>

              <div>
                <p>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              <div>
                <p>Hiring Manager</p>
                <p className="text-muted-foreground">Google</p>
                <p className="text-muted-foreground">Mountain View, CA</p>
              </div>

              <div>
                <p>Dear Hiring Manager,</p>
              </div>

              <div className="space-y-4 text-muted-foreground">
                <p>
                  I am writing to express my strong interest in the Senior Full Stack Engineer position at Google. With over five years of experience in full-stack development and a proven track record of building scalable applications, I am excited about the opportunity to contribute to your innovative team.
                </p>

                <p>
                  In my current role as Senior Software Engineer at Tech Corp, I have successfully led the development of microservices architecture using React and Node.js, technologies that align perfectly with your requirements. My work has resulted in a 40% improvement in system performance and has directly impacted user experience for millions of customers. Additionally, my AWS cloud expertise has enabled me to design and implement robust, scalable solutions that meet enterprise-level demands.
                </p>

                <p>
                  What particularly excites me about Google is your commitment to pushing the boundaries of technology while maintaining a focus on user-centric design. Your work in cloud computing and distributed systems aligns perfectly with my technical interests and career aspirations. I am especially drawn to the collaborative culture and the opportunity to work on products that impact billions of users globally.
                </p>

                <p>
                  Beyond my technical skills, I have demonstrated strong leadership abilities by mentoring junior engineers and collaborating effectively with cross-functional teams. I believe that great software is built through clear communication, continuous learning, and a commitment to excellence—values that I see reflected in Google's engineering culture.
                </p>

                <p>
                  I am particularly interested in contributing to Google's mission of organizing the world's information and making it universally accessible. As an international student on OPT, I am authorized to work in the United States and am seeking H1B sponsorship for long-term growth with your organization.
                </p>

                <p>
                  Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experiences align with Google's needs. I am available for an interview at your convenience and would be thrilled to learn more about this exciting opportunity.
                </p>
              </div>

              <div>
                <p>Sincerely,</p>
                <p>John Doe</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[#00B4D8] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm">
                    <strong>AI Tips:</strong> This cover letter highlights your relevant experience and aligns with the job requirements. Consider customizing the opening paragraph to reference a specific project or achievement from Google that resonates with you.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
