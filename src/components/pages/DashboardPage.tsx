import { Briefcase, BookmarkCheck, Calendar, TrendingUp, Clock, Eye } from "lucide-react";
import { StatCard } from "../StatCard";
import { VisaTrackerWidget } from "../VisaTrackerWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function DashboardPage() {
  const chartData = [
    { name: "Mon", matches: 12 },
    { name: "Tue", matches: 19 },
    { name: "Wed", matches: 15 },
    { name: "Thu", matches: 22 },
    { name: "Fri", matches: 28 },
    { name: "Sat", matches: 24 },
    { name: "Sun", matches: 18 },
  ];

  const applications = [
    {
      id: 1,
      title: "Senior Software Engineer",
      company: "Google",
      status: "Interview",
      appliedDate: "2025-10-10",
      salary: "$150k-$200k"
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "Meta",
      status: "Applied",
      appliedDate: "2025-10-12",
      salary: "$140k-$180k"
    },
    {
      id: 3,
      title: "Frontend Engineer",
      company: "Amazon",
      status: "Saved",
      appliedDate: "2025-10-14",
      salary: "$130k-$170k"
    },
    {
      id: 4,
      title: "Backend Engineer",
      company: "Microsoft",
      status: "Offer",
      appliedDate: "2025-10-08",
      salary: "$145k-$185k"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Offer": return "bg-green-500/10 text-green-600 border-green-200";
      case "Interview": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "Applied": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl mb-2">Welcome back, John!</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Here's your job search overview</p>
      </div>

      {/* Visa Tracker Widget - Compact */}
      <div className="lg:hidden">
        <VisaTrackerWidget compact />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Saved Jobs"
          value="24"
          icon={BookmarkCheck}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Applications"
          value="18"
          icon={Briefcase}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Interviews"
          value="5"
          icon={Calendar}
          trend={{ value: 25, isPositive: true }}
        />
        <StatCard
          title="Success Rate"
          value="72%"
          icon={TrendingUp}
          gradient
        />
      </div>

      {/* Charts and Visa Tracker */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Visa Tracker - Desktop */}
        <div className="hidden lg:block">
          <VisaTrackerWidget />
        </div>
        {/* Charts */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Job Match Trends</CardTitle>
              <CardDescription className="text-sm">Your daily job matches this week</CardDescription>
            </CardHeader>
            <CardContent>
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
                    dataKey="matches"
                    stroke="#00B4D8"
                    strokeWidth={2}
                    dot={{ fill: "#00B4D8", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Application Activity</CardTitle>
              <CardDescription className="text-sm">Applications per day this week</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <Bar dataKey="matches" fill="#0077B6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Job Application Tracker</CardTitle>
          <CardDescription className="text-sm">Track all your job applications in one place</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="saved" className="text-xs sm:text-sm">Saved</TabsTrigger>
              <TabsTrigger value="applied" className="text-xs sm:text-sm">Applied</TabsTrigger>
              <TabsTrigger value="interview" className="text-xs sm:text-sm">Interview</TabsTrigger>
              <TabsTrigger value="offer" className="text-xs sm:text-sm">Offer</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-3 sm:space-y-4 mt-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm sm:text-base">{app.company[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base truncate">{app.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">{app.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-end">
                    <div className="text-left sm:text-right flex-1 sm:flex-none">
                      <p className="text-xs sm:text-sm">{app.salary}</p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {app.appliedDate}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(app.status)} text-xs whitespace-nowrap`}>
                      {app.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      <Eye className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
