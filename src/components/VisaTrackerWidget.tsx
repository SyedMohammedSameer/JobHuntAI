import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

interface VisaTrackerWidgetProps {
  compact?: boolean;
}

export function VisaTrackerWidget({ compact = false }: VisaTrackerWidgetProps) {
  // Mock visa data - in real app, this would come from user profile
  const visaData = {
    type: "STEM OPT",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2027-06-01"),
    gracePeriod: 60, // days
  };

  const today = new Date();
  const totalDays = Math.floor(
    (visaData.endDate.getTime() - visaData.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.floor(
    (today.getTime() - visaData.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.floor(
    (visaData.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const progressPercentage = (daysElapsed / totalDays) * 100;

  const getStatusColor = () => {
    if (daysRemaining < 90) return "destructive";
    if (daysRemaining < 180) return "default";
    return "secondary";
  };

  const getStatusIcon = () => {
    if (daysRemaining < 90) return AlertTriangle;
    if (daysRemaining < 180) return Clock;
    return CheckCircle2;
  };

  const StatusIcon = getStatusIcon();

  if (compact) {
    return (
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#00B4D8]" />
              <h4 className="text-sm">{visaData.type} Status</h4>
            </div>
            <Badge variant={getStatusColor()}>
              {daysRemaining} days left
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Expires: {visaData.endDate.toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#00B4D8]/20 bg-gradient-to-br from-[#00B4D8]/5 to-[#0077B6]/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#00B4D8]" />
            Visa Status Tracker
          </CardTitle>
          <Badge variant="outline" className="text-[#00B4D8] border-[#00B4D8]">
            {visaData.type}
          </Badge>
        </div>
        <CardDescription>Monitor your visa timeline and deadlines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Status */}
        <div className="flex items-center gap-4 p-4 bg-background rounded-xl">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center text-white flex-shrink-0">
            <StatusIcon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl mb-1">{daysRemaining}</h3>
            <p className="text-sm text-muted-foreground">Days Remaining</p>
          </div>
          <Badge
            variant={getStatusColor()}
            className="px-4 py-2 text-sm"
          >
            {daysRemaining < 90 ? "Action Required" : daysRemaining < 180 ? "Plan Ahead" : "On Track"}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span>Time Elapsed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Timeline Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-background rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Start Date</p>
            <p className="text-sm">{visaData.startDate.toLocaleDateString()}</p>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">End Date</p>
            <p className="text-sm">{visaData.endDate.toLocaleDateString()}</p>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Grace Period</p>
            <p className="text-sm">{visaData.gracePeriod} days</p>
          </div>
        </div>

        {/* Action Items */}
        {daysRemaining < 180 && (
          <div className="p-4 bg-background rounded-lg border-l-4 border-[#00B4D8]">
            <h4 className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Recommended Actions
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {daysRemaining < 90 && (
                <>
                  <li>• Start H1B application process immediately</li>
                  <li>• Contact your employer's immigration attorney</li>
                  <li>• Gather required documentation</li>
                </>
              )}
              {daysRemaining >= 90 && daysRemaining < 180 && (
                <>
                  <li>• Begin exploring H1B sponsorship opportunities</li>
                  <li>• Update resume and job applications</li>
                  <li>• Research companies that sponsor visas</li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground">
          <p>
            💡 <strong>Tip:</strong> Most H1B petitions should be filed at least 6 months before your OPT expires to ensure continuity of employment authorization.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
