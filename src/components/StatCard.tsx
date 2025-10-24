import { Card, CardContent } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, gradient }: StatCardProps) {
  return (
    <Card className={gradient ? "bg-gradient-to-br from-[#34d399] to-[#10b981] text-white border-0" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${gradient ? "text-white/80" : "text-muted-foreground"}`}>
              {title}
            </p>
            <h3 className="mt-2">{value}</h3>
            {trend && (
              <p className={`text-sm mt-1 ${gradient ? "text-white/80" : trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                {trend.isPositive ? "+" : ""}{trend.value}% from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${gradient ? "bg-white/20" : "bg-muted"}`}>
            <Icon className={`h-6 w-6 ${gradient ? "text-white" : "text-foreground"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
