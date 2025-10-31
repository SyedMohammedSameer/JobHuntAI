import { useState, useEffect } from "react";
import { Briefcase, BookmarkCheck, Calendar, TrendingUp, Clock, Eye, Loader2 } from "lucide-react";
import { StatCard } from "../StatCard";
import { VisaTrackerWidget } from "../VisaTrackerWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardService } from "../../services/dashboardService";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import visaService, { VisaStatus } from "../../services/visaService";

interface DashboardData {
  overview: {
    totalApplications: number;
    inReview: number;
    interviews: number;
    offers: number;
    rejected: number;
    savedJobs: number;
    responseRate: number;
    resumesUploaded: number;
    coverLettersGenerated: number;
  };
  visaStatus: {
    daysRemaining: number;
    urgency: 'critical' | 'warning' | 'safe';
    expiryDate: string | null;
    visaType: string;
  } | null;
  recentActivity: Array<{
    type: string;
    action: string;
    jobTitle?: string;
    companyName?: string;
    timestamp: string;
  }>;
  trends: {
    weeklyApplications: number;
    monthlyApplications: number;
    interviewConversionRate: number;
    averageResponseTime: number;
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<Array<{ name: string; applications: number }>>([]);
  const [visaStatus, setVisaStatus] = useState<VisaStatus | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch dashboard stats
        const data = await dashboardService.getDashboardData();
        setDashboardData(data as any);

        // Fetch weekly activity for chart
        const weeklyActivity = await dashboardService.getWeeklyActivity();
        setChartData(weeklyActivity.map(item => ({
          name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          applications: item.applications
        })));

        // Fetch visa status
        try {
          const visa = await visaService.getVisaStatus();
          setVisaStatus(visa);
        } catch (visaError) {
          // Visa status is optional, so just log the error
          console.log('No visa status found:', visaError);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');

        // Set default empty data on error
        setDashboardData({
          overview: {
            totalApplications: 0,
            inReview: 0,
            interviews: 0,
            offers: 0,
            rejected: 0,
            savedJobs: 0,
            responseRate: 0,
            resumesUploaded: 0,
            coverLettersGenerated: 0,
          },
          visaStatus: null,
          recentActivity: [],
          trends: {
            weeklyApplications: 0,
            monthlyApplications: 0,
            interviewConversionRate: 0,
            averageResponseTime: 0,
          },
        });
        setChartData([
          { name: "Mon", applications: 0 },
          { name: "Tue", applications: 0 },
          { name: "Wed", applications: 0 },
          { name: "Thu", applications: 0 },
          { name: "Fri", applications: 0 },
          { name: "Sat", applications: 0 },
          { name: "Sun", applications: 0 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#10b981] mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If no data, show error state
  if (!dashboardData) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const { overview, recentActivity } = dashboardData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Offer": return "bg-green-500/10 text-green-600 border-green-200";
      case "Interview": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "Applied": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  // Calculate success rate
  const successRate = overview.totalApplications > 0
    ? Math.round((overview.offers / overview.totalApplications) * 100)
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl mb-2">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">Here's your job search overview</p>
      </div>

      {/* Visa Tracker Widget - Compact */}
      {visaStatus?.visaDetails && (
        <div className="lg:hidden">
          <VisaTrackerWidget
            compact
            visaDetails={visaStatus.visaDetails}
            daysRemaining={visaStatus.daysRemaining}
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Saved Jobs"
          value={overview.savedJobs.toString()}
          icon={BookmarkCheck}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Applications"
          value={overview.totalApplications.toString()}
          icon={Briefcase}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Interviews"
          value={overview.interviews.toString()}
          icon={Calendar}
          trend={{ value: overview.interviews > 0 ? 25 : 0, isPositive: true }}
        />
        <StatCard
          title="Offers"
          value={overview.offers.toString()}
          icon={TrendingUp}
          gradient
        />
      </div>

      {/* Charts and Visa Tracker */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Visa Tracker - Desktop */}
        {visaStatus?.visaDetails && (
          <div className="hidden lg:block">
            <VisaTrackerWidget
              visaDetails={visaStatus.visaDetails}
              daysRemaining={visaStatus.daysRemaining}
            />
          </div>
        )}
        {/* Charts */}
        <div className={`${visaStatus?.visaDetails ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4 sm:space-y-6`}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Application Activity</CardTitle>
              <CardDescription className="text-sm">Your application activity this week</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p>No activity data yet. Start applying to jobs!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Weekly Overview</CardTitle>
              <CardDescription className="text-sm">Applications submitted per day</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="applications" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p>No activity data yet. Start applying to jobs!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
          <CardDescription className="text-sm">Your latest job search activities</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 flex items-center justify-center flex-shrink-0">
                      {activity.type === 'application' && <Briefcase className="h-5 w-5 text-[#10b981]" />}
                      {activity.type === 'saved_job' && <BookmarkCheck className="h-5 w-5 text-[#10b981]" />}
                      {activity.type === 'interview' && <Calendar className="h-5 w-5 text-[#10b981]" />}
                      {activity.type === 'offer' && <TrendingUp className="h-5 w-5 text-[#10b981]" />}
                      {activity.type === 'resume_upload' && <Eye className="h-5 w-5 text-[#10b981]" />}
                      {activity.type === 'cover_letter' && <Eye className="h-5 w-5 text-[#10b981]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base truncate">{activity.action}</h4>
                      {activity.jobTitle && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {activity.jobTitle} {activity.companyName && `at ${activity.companyName}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-end">
                    <p className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No activity yet</p>
              <p className="text-sm">Start applying to jobs to see your activity here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
