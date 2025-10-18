import { Calendar, Edit, Plus, Trash2, Clock, AlertCircle } from "lucide-react";
import { VisaTrackerWidget } from "../VisaTrackerWidget";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function VisaTrackerPage() {
  const importantDates = [
    {
      id: 1,
      title: "H1B Cap Registration",
      date: "2026-03-15",
      type: "Deadline",
      daysUntil: 150,
      status: "upcoming",
    },
    {
      id: 2,
      title: "OPT Extension Application",
      date: "2026-05-01",
      type: "Deadline",
      daysUntil: 197,
      status: "upcoming",
    },
    {
      id: 3,
      title: "I-20 Renewal",
      date: "2026-08-15",
      type: "Action Required",
      daysUntil: 303,
      status: "planned",
    },
  ];

  const visaHistory = [
    {
      type: "F-1 Student Visa",
      startDate: "2020-08-01",
      endDate: "2024-05-31",
      status: "Completed",
    },
    {
      type: "OPT",
      startDate: "2024-06-01",
      endDate: "2025-05-31",
      status: "Completed",
    },
    {
      type: "STEM OPT Extension",
      startDate: "2024-06-01",
      endDate: "2027-06-01",
      status: "Active",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Visa Tracker</h1>
          <p className="text-muted-foreground">
            Monitor your visa status and important deadlines
          </p>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Update Visa Info
        </Button>
      </div>

      {/* Main Visa Status Widget */}
      <VisaTrackerWidget />

      {/* Important Dates */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Important Dates & Deadlines</CardTitle>
              <CardDescription>Stay on top of critical immigration dates</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Date
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {importantDates.map((date) => (
              <div
                key={date.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-[#00B4D8]/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-[#00B4D8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="mb-1">{date.title}</h4>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(date.date).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {date.daysUntil} days away
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:ml-auto">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visa Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Current Visa Information</CardTitle>
          <CardDescription>Update your visa details to get accurate tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="visa-type">Visa Type</Label>
              <Select defaultValue="stem-opt">
                <SelectTrigger id="visa-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="f1">F-1 Student</SelectItem>
                  <SelectItem value="opt">OPT</SelectItem>
                  <SelectItem value="stem-opt">STEM OPT</SelectItem>
                  <SelectItem value="h1b">H1B</SelectItem>
                  <SelectItem value="h4">H4</SelectItem>
                  <SelectItem value="l1">L1</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Current Status</Label>
              <Select defaultValue="active">
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" defaultValue="2024-06-01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" defaultValue="2027-06-01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grace-period">Grace Period (days)</Label>
              <Input id="grace-period" type="number" defaultValue="60" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="i20-number">I-20 Number (Optional)</Label>
              <Input id="i20-number" placeholder="Enter I-20 number" />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button>Save Changes</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </CardContent>
      </Card>

      {/* Visa History */}
      <Card>
        <CardHeader>
          <CardTitle>Visa History</CardTitle>
          <CardDescription>Your immigration status timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {visaHistory.map((visa, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center text-white flex-shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h4>{visa.type}</h4>
                    <Badge
                      variant={visa.status === "Active" ? "default" : "secondary"}
                      className={visa.status === "Active" ? "bg-green-500" : ""}
                    >
                      {visa.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(visa.startDate).toLocaleDateString()} -{" "}
                    {new Date(visa.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="bg-gradient-to-br from-[#00B4D8]/5 to-[#0077B6]/5 border-2 border-[#00B4D8]/20">
        <CardHeader>
          <CardTitle>Helpful Resources</CardTitle>
          <CardDescription>Important links and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="https://www.uscis.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors"
            >
              <AlertCircle className="h-5 w-5 text-[#00B4D8]" />
              <div>
                <p className="text-sm">USCIS Official Website</p>
                <p className="text-xs text-muted-foreground">Check case status & forms</p>
              </div>
            </a>
            <a
              href="https://www.ice.gov/sevis"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors"
            >
              <AlertCircle className="h-5 w-5 text-[#00B4D8]" />
              <div>
                <p className="text-sm">SEVIS Information</p>
                <p className="text-xs text-muted-foreground">F-1 & OPT guidance</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
