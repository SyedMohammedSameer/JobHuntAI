import { Bookmark, MapPin, DollarSign, Briefcase, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    matchScore: number;
    postedDate: string;
    visaSponsorship: boolean;
    logo?: string;
  };
  onSave?: () => void;
  onApply?: () => void;
  onClick?: () => void;
}

export function JobCard({ job, onSave, onApply, onClick }: JobCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Company Logo */}
          <div className="flex-shrink-0 hidden sm:block">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
              <span className="text-base sm:text-lg">{job.company[0]}</span>
            </div>
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg truncate">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.company}</p>
              </div>
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-[#00B4D8]/10 to-[#0077B6]/10 text-[#0077B6] border-0 text-xs sm:text-sm whitespace-nowrap"
              >
                {job.matchScore}% Match
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mt-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{job.salary}</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{job.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{job.postedDate}</span>
              </div>
            </div>

            {job.visaSponsorship && (
              <Badge variant="outline" className="mt-3 text-xs">
                H1B Sponsorship
              </Badge>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none text-xs sm:text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.();
                }}
              >
                <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none text-xs sm:text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply?.();
                }}
              >
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
