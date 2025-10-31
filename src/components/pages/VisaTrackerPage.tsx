import { useState, useEffect } from "react";
import { Calendar, Edit, Plus, Trash2, Clock, AlertCircle, Save, X, ExternalLink } from "lucide-react";
import { VisaTrackerWidget } from "../VisaTrackerWidget";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import visaService, {
  VisaStatus,
  ImportantDate,
  VisaTimelineItem,
  VisaRecommendation,
} from "../../services/visaService";

export function VisaTrackerPage() {

  // State
  const [loading, setLoading] = useState(true);
  const [visaStatus, setVisaStatus] = useState<VisaStatus | null>(null);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [visaTimeline, setVisaTimeline] = useState<VisaTimelineItem[]>([]);
  const [recommendations, setRecommendations] = useState<VisaRecommendation[]>([]);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    currentType: "",
    startDate: "",
    endDate: "",
    gracePeriodDays: 60,
    i20Number: "",
    eadNumber: "",
    sevisId: "",
  });

  // Important date form state
  const [showDateForm, setShowDateForm] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [dateForm, setDateForm] = useState({
    type: "",
    title: "",
    date: "",
    reminder: false,
    reminderDays: 30,
    notes: "",
  });

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [status, dates, timeline, recs] = await Promise.all([
        visaService.getVisaStatus(),
        visaService.getImportantDates(),
        visaService.getVisaTimeline(),
        visaService.getRecommendations(),
      ]);

      setVisaStatus(status);
      setImportantDates(dates);
      setVisaTimeline(timeline);
      setRecommendations(recs);

      // Initialize edit form with current data
      if (status.visaDetails) {
        setEditForm({
          currentType: status.visaDetails.currentType || "",
          startDate: status.visaDetails.startDate
            ? new Date(status.visaDetails.startDate).toISOString().split("T")[0]
            : "",
          endDate: status.visaDetails.endDate
            ? new Date(status.visaDetails.endDate).toISOString().split("T")[0]
            : "",
          gracePeriodDays: status.visaDetails.gracePeriodDays || 60,
          i20Number: status.visaDetails.i20Number || "",
          eadNumber: status.visaDetails.eadNumber || "",
          sevisId: status.visaDetails.sevisId || "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load visa data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisaInfo = async () => {
    try {
      await visaService.updateVisaInfo({
        currentType: editForm.currentType,
        startDate: editForm.startDate ? new Date(editForm.startDate) : undefined,
        endDate: editForm.endDate ? new Date(editForm.endDate) : undefined,
        gracePeriodDays: editForm.gracePeriodDays,
        i20Number: editForm.i20Number,
        eadNumber: editForm.eadNumber,
        sevisId: editForm.sevisId,
      });

      toast.success("Visa information updated successfully");

      setIsEditing(false);
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update visa information");
    }
  };

  const handleAddImportantDate = async () => {
    try {
      if (!dateForm.title || !dateForm.date) {
        toast.error("Title and date are required");
        return;
      }

      if (editingDateId) {
        await visaService.updateImportantDate(editingDateId, {
          ...dateForm,
          date: new Date(dateForm.date),
        });
        toast.success("Important date updated successfully");
      } else {
        await visaService.addImportantDate({
          ...dateForm,
          date: new Date(dateForm.date),
        });
        toast.success("Important date added successfully");
      }

      setShowDateForm(false);
      setEditingDateId(null);
      setDateForm({
        type: "",
        title: "",
        date: "",
        reminder: false,
        reminderDays: 30,
        notes: "",
      });
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save important date");
    }
  };

  const handleDeleteImportantDate = async (id: string) => {
    try {
      await visaService.deleteImportantDate(id);
      toast.success("Important date deleted successfully");
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete important date");
    }
  };

  const handleEditImportantDate = (date: ImportantDate) => {
    setEditingDateId(date._id || null);
    setDateForm({
      type: date.type || "",
      title: date.title || "",
      date: date.date ? new Date(date.date).toISOString().split("T")[0] : "",
      reminder: date.reminder || false,
      reminderDays: date.reminderDays || 30,
      notes: date.notes || "",
    });
    setShowDateForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B4D8] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading visa data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl mb-1 sm:mb-2">Visa Tracker</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor your visa status and important deadlines
          </p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)} className="w-full sm:w-auto">
          <Edit className="h-4 w-4 mr-2" />
          {isEditing ? "Cancel Edit" : "Update Visa Info"}
        </Button>
      </div>

      {/* Main Visa Status Widget */}
      <VisaTrackerWidget
        visaDetails={visaStatus?.visaDetails || null}
        daysRemaining={visaStatus?.daysRemaining || null}
      />

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Smart Recommendations</CardTitle>
            <CardDescription>Actions based on your visa status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-l-4 ${
                    rec.type === "urgent"
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : rec.type === "warning"
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                      : "border-[#00B4D8] bg-[#00B4D8]/5"
                  }`}
                >
                  <h4 className="mb-1">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{rec.message}</p>
                  {rec.action.startsWith('http') ? (
                    <a
                      href={rec.action}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#00B4D8] hover:underline"
                    >
                      Learn More
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <Badge variant="outline">{rec.action}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Dates */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Important Dates & Deadlines</CardTitle>
              <CardDescription className="text-sm">Stay on top of critical immigration dates</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingDateId(null);
                setDateForm({
                  type: "",
                  title: "",
                  date: "",
                  reminder: false,
                  reminderDays: 30,
                  notes: "",
                });
                setShowDateForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Date
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showDateForm && (
            <div className="mb-4 p-3 sm:p-4 border rounded-xl bg-muted/50">
              <h4 className="text-base sm:text-lg mb-3 sm:mb-4">{editingDateId ? "Edit" : "Add"} Important Date</h4>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date-title">Title</Label>
                  <Input
                    id="date-title"
                    value={dateForm.title}
                    onChange={(e) => setDateForm({ ...dateForm, title: e.target.value })}
                    placeholder="e.g., H1B Registration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-type">Type</Label>
                  <Input
                    id="date-type"
                    value={dateForm.type}
                    onChange={(e) => setDateForm({ ...dateForm, type: e.target.value })}
                    placeholder="e.g., Deadline"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-date">Date</Label>
                  <Input
                    id="date-date"
                    type="date"
                    value={dateForm.date}
                    onChange={(e) => setDateForm({ ...dateForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-reminder">Reminder (days before)</Label>
                  <Input
                    id="date-reminder"
                    type="number"
                    value={dateForm.reminderDays}
                    onChange={(e) =>
                      setDateForm({ ...dateForm, reminderDays: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="date-notes">Notes (Optional)</Label>
                  <Input
                    id="date-notes"
                    value={dateForm.notes}
                    onChange={(e) => setDateForm({ ...dateForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button onClick={handleAddImportantDate} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setShowDateForm(false)} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {importantDates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No important dates added yet. Click "Add Date" to get started.
              </p>
            ) : (
              importantDates.map((date) => (
                <div
                  key={date._id}
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
                        {date.daysUntil !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {date.daysUntil > 0
                              ? `${date.daysUntil} days away`
                              : date.daysUntil === 0
                              ? "Today"
                              : `${Math.abs(date.daysUntil)} days ago`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditImportantDate(date)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => date._id && handleDeleteImportantDate(date._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visa Information Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Update Visa Information</CardTitle>
            <CardDescription className="text-sm">Update your visa details to get accurate tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visa-type">Visa Type</Label>
                <Select
                  value={editForm.currentType}
                  onValueChange={(value) => setEditForm({ ...editForm, currentType: value })}
                >
                  <SelectTrigger id="visa-type">
                    <SelectValue placeholder="Select visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F1">F-1 Student</SelectItem>
                    <SelectItem value="OPT">OPT</SelectItem>
                    <SelectItem value="STEM_OPT">STEM OPT</SelectItem>
                    <SelectItem value="H1B">H1B</SelectItem>
                    <SelectItem value="H4">H4</SelectItem>
                    <SelectItem value="L1">L1</SelectItem>
                    <SelectItem value="GREEN_CARD">Green Card</SelectItem>
                    <SelectItem value="CITIZEN">US Citizen</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grace-period">Grace Period (days)</Label>
                <Input
                  id="grace-period"
                  type="number"
                  value={editForm.gracePeriodDays}
                  onChange={(e) =>
                    setEditForm({ ...editForm, gracePeriodDays: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="i20-number">I-20 Number (Optional)</Label>
                <Input
                  id="i20-number"
                  value={editForm.i20Number}
                  onChange={(e) => setEditForm({ ...editForm, i20Number: e.target.value })}
                  placeholder="Enter I-20 number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ead-number">EAD Number (Optional)</Label>
                <Input
                  id="ead-number"
                  value={editForm.eadNumber}
                  onChange={(e) => setEditForm({ ...editForm, eadNumber: e.target.value })}
                  placeholder="Enter EAD number"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="sevis-id">SEVIS ID (Optional)</Label>
                <Input
                  id="sevis-id"
                  value={editForm.sevisId}
                  onChange={(e) => setEditForm({ ...editForm, sevisId: e.target.value })}
                  placeholder="Enter SEVIS ID"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <Button onClick={handleUpdateVisaInfo} className="w-full sm:w-auto">Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visa History */}
      {visaTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Visa History</CardTitle>
            <CardDescription>Your immigration status timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visaTimeline.map((visa, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center text-white flex-shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h4>{visa.type}</h4>
                      <Badge
                        variant={visa.isCurrent ? "default" : "secondary"}
                        className={visa.isCurrent ? "bg-green-500" : ""}
                      >
                        {visa.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {visa.startDate && new Date(visa.startDate).toLocaleDateString()} -{" "}
                      {visa.endDate && new Date(visa.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
