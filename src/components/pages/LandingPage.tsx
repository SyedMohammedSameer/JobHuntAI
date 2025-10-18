import { ArrowRight, CheckCircle, Sparkles, FileText, Mail, TrendingUp, Star } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      icon: Sparkles,
      title: "AI Resume Tailor",
      description: "Automatically customize your resume for each job application using advanced AI"
    },
    {
      icon: Mail,
      title: "Smart Cover Letters",
      description: "Generate personalized cover letters that match job requirements"
    },
    {
      icon: TrendingUp,
      title: "Job Match Score",
      description: "Get instant compatibility scores for every job listing"
    },
    {
      icon: FileText,
      title: "Application Tracker",
      description: "Track all your applications in one organized dashboard"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      university: "Stanford University",
      content: "AI Job Hunt helped me land my dream job with H1B sponsorship in just 2 months!",
      rating: 5
    },
    {
      name: "Raj Patel",
      role: "Data Scientist",
      university: "MIT",
      content: "The AI resume tailor is a game-changer. My interview rate increased by 300%.",
      rating: 5
    },
    {
      name: "Maria Garcia",
      role: "Product Manager",
      university: "UC Berkeley",
      content: "Finally, a platform that understands international students' visa challenges.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00B4D8]/10 via-background to-[#0077B6]/10" />
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-[#00B4D8]/10 to-[#0077B6]/10 border border-[#00B4D8]/20 mb-4 sm:mb-6">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-[#0077B6]" />
              <span className="text-xs sm:text-sm">Your AI-Powered Job Search Companion</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] bg-clip-text text-transparent px-2">
              Land Your Dream Job with AI
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Perfect for international students and professionals seeking OPT, STEM-OPT, and H1B opportunities
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button size="lg" onClick={() => onNavigate("signup")} className="group w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => onNavigate("dashboard")} className="w-full sm:w-auto">
                Try Demo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-8 sm:mt-12 text-xs sm:text-sm text-muted-foreground px-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#00B4D8]" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#00B4D8]" />
                Free forever plan
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">Powerful Features for Job Seekers</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4">Everything you need to succeed in your job search</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-[#00B4D8] transition-colors">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">Loved by Job Seekers</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4">Join thousands who found their dream jobs</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#00B4D8] text-[#00B4D8]" />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground">"{testimonial.content}"</p>
                  <div>
                    <p>{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.university}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">Simple, Transparent Pricing</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4">Start free, upgrade when you need more</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h3 className="mb-2">Free</h3>
                <div className="mb-4">
                  <span className="text-4xl">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#00B4D8]" />
                    5 AI resume tailors/month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#00B4D8]" />
                    3 cover letters/month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#00B4D8]" />
                    Job match scores
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#00B4D8]" />
                    Basic dashboard
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => onNavigate("signup")}>
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[#00B4D8] border-2 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6] text-white px-4 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              </div>
              <CardContent className="p-8">
                <h3 className="mb-2">Premium</h3>
                <div className="mb-4">
                  <span className="text-4xl">$19</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#00B4D8]" />
                    Unlimited AI tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#00B4D8]" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#00B4D8]" />
                    Job alerts & notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#00B4D8]" />
                    Priority support
                  </li>
                </ul>
                <Button className="w-full" onClick={() => onNavigate("premium")}>
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center">
                  <span className="text-white text-sm">AI</span>
                </div>
                <span>AI Job Hunt</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI-powered companion for landing your dream job
              </p>
            </div>
            <div>
              <h4 className="mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 AI Job Hunt. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
