import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { AppSidebar } from "./components/AppSidebar";
import { LandingPage } from "./components/pages/LandingPage";
import { LoginPage } from "./components/pages/LoginPage";
import { SignupPage } from "./components/pages/SignupPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { JobsPage } from "./components/pages/JobsPage";
import { ResumePage } from "./components/pages/ResumePage";
import { CoverLetterPage } from "./components/pages/CoverLetterPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { UniversityJobsPage } from "./components/pages/UniversityJobsPage";
import { PremiumPage } from "./components/pages/PremiumPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { VisaTrackerPage } from "./components/pages/VisaTrackerPage";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("landing");
  const [isDark, setIsDark] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if page is authenticated route
  const authenticatedPages = [
    "dashboard",
    "jobs",
    "resume",
    "cover-letter",
    "profile",
    "visa-tracker",
    "university-jobs",
    "premium",
    "settings",
  ];

  useEffect(() => {
    // Update authentication state based on page
    if (authenticatedPages.includes(currentPage)) {
      setIsAuthenticated(true);
    } else if (currentPage === "landing") {
      setIsAuthenticated(false);
    }
  }, [currentPage]);

  useEffect(() => {
    // Apply dark mode class to document
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on mobile when page changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={handleNavigate} />;
      case "login":
        return <LoginPage onNavigate={handleNavigate} />;
      case "signup":
        return <SignupPage onNavigate={handleNavigate} />;
      case "dashboard":
        return <DashboardPage />;
      case "jobs":
        return <JobsPage />;
      case "resume":
        return <ResumePage />;
      case "cover-letter":
        return <CoverLetterPage />;
      case "profile":
        return <ProfilePage />;
      case "visa-tracker":
        return <VisaTrackerPage />;
      case "university-jobs":
        return <UniversityJobsPage />;
      case "premium":
        return <PremiumPage />;
      case "settings":
        return <SettingsPage isDark={isDark} onThemeToggle={handleThemeToggle} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const showSidebar = isAuthenticated && !["login", "signup", "landing"].includes(currentPage);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onThemeToggle={handleThemeToggle}
        isDark={isDark}
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
        onSidebarToggle={handleSidebarToggle}
        showSidebarToggle={showSidebar}
      />
      
      <div className="flex relative">
        {showSidebar && (
          <AppSidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        
        <main className={`
          flex-1 w-full
          ${showSidebar ? "p-4 sm:p-6" : ""}
          ${!showSidebar && currentPage !== "landing" ? "p-4 sm:p-6" : ""}
          ${showSidebar && sidebarOpen ? "lg:ml-0" : ""}
        `}>
          <div className="max-w-[1600px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}
