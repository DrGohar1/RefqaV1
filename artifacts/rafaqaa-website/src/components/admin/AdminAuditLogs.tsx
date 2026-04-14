import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<any[]>("/audit-logs")
      .then((data) => { setLogs(data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(
    (l) =>
      (l.action || "").includes(search) ||
      (l.table_name || "").includes(search) ||
      (l.record_id || "").includes(search)
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-primary" /> سجل العمليات
        </h2>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="pr-9 w-48"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card border border-border">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            لا توجد سجلات بعد
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.table_name && `الجدول: ${log.table_name}`}
                    {log.record_id && ` • ID: ${String(log.record_id).slice(0, 8)}...`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleDateString("ar-EG", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;
