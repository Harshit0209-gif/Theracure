import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image,
  Activity,
  TrendingUp,
  Calendar,
  HardDrive,
} from "lucide-react";

interface EMRStats {
  totalRecords: number;
  recentUploads: number;
  storageUsageMB: number;
  documentTypeBreakdown: Record<string, number>;
}

interface EMRStatsProps {
  patientId: string;
  refreshTrigger?: number;
}

export function EMRStats({ patientId, refreshTrigger }: EMRStatsProps) {
  const [stats, setStats] = useState<EMRStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [patientId, refreshTrigger]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/emr/stats?patientId=${patientId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching EMR stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    const icons = {
      PRESCRIPTION: <FileText className="h-4 w-4 text-blue-600" />,
      DIAGNOSTIC: <Activity className="h-4 w-4 text-green-600" />,
      NOTES: <FileText className="h-4 w-4 text-yellow-600" />,
      THERAPY_SUMMARY: <Activity className="h-4 w-4 text-purple-600" />,
      LAB_REPORT: <FileText className="h-4 w-4 text-red-600" />,
      XRAY: <Image className="h-4 w-4 text-gray-600" />,
      MRI: <Image className="h-4 w-4 text-indigo-600" />,
      CT_SCAN: <Image className="h-4 w-4 text-cyan-600" />,
      ULTRASOUND: <Image className="h-4 w-4 text-teal-600" />,
      OTHER: <FileText className="h-4 w-4 text-gray-600" />,
    };
    return (
      icons[type as keyof typeof icons] || (
        <FileText className="h-4 w-4 text-gray-600" />
      )
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRecords}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent (7 days)</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.recentUploads}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.storageUsageMB} MB
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Document Types</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Object.keys(stats.documentTypeBreakdown).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Type Breakdown */}
      {Object.keys(stats.documentTypeBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Document Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(stats.documentTypeBreakdown).map(
                ([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    {getDocumentTypeIcon(type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-gray-600">{count} files</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
