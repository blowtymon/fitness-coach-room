import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import {
  Calendar,
  Filter,
  BarChart3,
  FileText,
  Download,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JSONModal } from "./JSONModal";

export interface Log_s {
  id: string;
  log_text: string;
  metadata?: any;
  type: string;
  timestamp: string | Date;
  attachments?: {
    fileName: string;
    fileSize: number;
    content: string;
  }[];
}

interface LogHistoryProps {
  logs: Log_s[];
}

const parseMetadata = (meta: string | object): any => {
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch (e) {
      console.error("Invalid JSON metadata:", e);
      return {};
    }
  }
  return meta;
};

const isNonEmptyValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;

  if (typeof value === "string") return value.trim().length > 0;

  if (Array.isArray(value)) {
    return value.length > 0 && value.some((v) => isNonEmptyValue(v));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    return entries.length > 0 && entries.some(([_, v]) => isNonEmptyValue(v));
  }
  return true;
};

const renderStructuredData = (data: any, parentKey = ""): JSX.Element[] => {
  if (typeof data !== "object" || data === null) return [];

  return Object.entries(data).flatMap(([key, value]) => {
    const label = parentKey ? `${parentKey}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return renderStructuredData(value, label);
    }

    return (
      typeof value !== "object" && (
        <Badge
          key={label}
          variant="secondary"
          className="text-xs"
        >
          {label}: {String(value)}
        </Badge>
      )
    );
  });
};

// Utility to check if search term exists in structured JSON
const structuredIncludes = (data: any, term: string): boolean => {
  if (typeof data === "string") return data.toLowerCase().includes(term);
  if (typeof data === "number") return String(data).includes(term);
  if (typeof data === "object" && data !== null) {
    return Object.values(data).some((v) => structuredIncludes(v, term));
  }
  return false;
};

export const LogHistory = ({ logs }: LogHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [jsonModalData, setJsonModalData] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "workout" | "nutrition" | "recovery" | "body"
  >("all");
  const [dateFilter, setDateFilter] = useState("");

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      (log.log_text?.toLowerCase().includes(term) ?? false) ||
      (log.metadata && structuredIncludes(parseMetadata(log.metadata), term));

    // ✅ fixed filterType check
    let matchesType = true;
    if (filterType !== "all") {
      const metadata = parseMetadata(log.metadata);
      matchesType = isNonEmptyValue(metadata[filterType]);
    }

    let matchesDate = true;
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const logDate = new Date(log.timestamp);
      matchesDate =
        logDate >= startOfDay(filterDate) && logDate <= endOfDay(filterDate);
    }

    return matchesSearch && matchesType && matchesDate;
  });

  console.log(logs);

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case "workout":
        return <BarChart3 className="h-4 w-4" />;
      case "recovery":
        return <Calendar className="h-4 w-4" />;
      case "nutrition":
        return "🍎";
      case "body":
        return "📊";
      case "strength":
        return "💪";
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div
      className="space-y-6"
    >
      {/* Filters */}
      <Card className="bg-gradient-to-br from-card via-card to-card/90">
        <CardHeader>
          <CardTitle className="text-lg">Training History</CardTitle>
          <p className="text-sm text-muted-foreground">
            {logs.length} total logs • Search and filter your training data
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border/50"
              />
            </div>

            <Select
              value={filterType}
              onValueChange={(value: any) => setFilterType(value)}
            >
              <SelectTrigger className="bg-input border-border/50">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="workout">Workout</SelectItem>
                <SelectItem value="recovery">Recovery</SelectItem>
                <SelectItem value="nutrition">Nutrition</SelectItem>
                <SelectItem value="body">Body</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-input border-border/50"
            />
          </div>
        </CardContent>
      </Card>
      {/* Log List */}
      <Card className="bg-gradient-to-br from-card via-card to-card/90">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Logs</CardTitle>
            <Badge
              variant="outline"
              className="text-xs"
            >
              {filteredLogs.length}{" "}
              {filteredLogs.length === 1 ? "entry" : "entries"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No logs found matching your filters.</p>
                <p className="text-sm">Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      const parsed = parseMetadata(log?.metadata);
                      console.log("Double-click detected:", parsed);
                      setJsonModalData(parsed);
                    }}
                    className="border border-border/50 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getLogTypeIcon(log.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {log.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(log.timestamp, "MMM dd, HH:mm")}
                            </span>
                          </div>
                          <div className="cursor-pointer">
                            <p
                              className={`text-sm whitespace-pre-line ${
                                expandedLogIds.has(log.id) ? "" : "line-clamp-3"
                              }`}
                            >
                              {log.log_text}
                            </p>

                            {/* Expand/Collapse toggle */}
                            {log.log_text.split("\n").length > 3 && (
                              <button
                                onClick={() => {
                                  setExpandedLogIds((prev) => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(log.id)) {
                                      newSet.delete(log.id);
                                    } else {
                                      newSet.add(log.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="text-xs text-accent mt-1 underline"
                              >
                                {expandedLogIds.has(log.id)
                                  ? "Show less"
                                  : "Show more"}
                              </button>
                            )}
                          </div>

                          {log.metadata && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {renderStructuredData(
                                parseMetadata(log.metadata)
                              )}
                            </div>
                          )}

                          {/* Display file attachments */}
                          {log.attachments && log.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Attachments ({log.attachments.length}):
                              </p>
                              <div className="space-y-1">
                                {log.attachments.map((attachment, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2 p-2 bg-muted/50 rounded border"
                                  >
                                    <FileText className="h-3 w-3 text-accent" />
                                    <span className="text-xs font-medium">
                                      {attachment.fileName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      (
                                      {(
                                        attachment.fileSize /
                                        1024 /
                                        1024
                                      ).toFixed(2)}{" "}
                                      MB)
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 ml-auto"
                                      onClick={() => {
                                        const link =
                                          document.createElement("a");
                                        link.href = attachment.content;
                                        link.download = attachment.fileName;
                                        link.click();
                                      }}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      {jsonModalData && (
        <JSONModal
          open={true}
          data={jsonModalData}
          onClose={() => setJsonModalData(null)}
        />
      )}
    </div>
  );
};
