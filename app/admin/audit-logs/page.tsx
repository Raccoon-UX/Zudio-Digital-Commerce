"use client";

import React, { useState, useEffect } from "react";
import { AdminAuditLogDTO } from "@/modules/admin/types";
import { formatDate } from "@/lib/utils";
import {
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  FileText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLogDTO[]>([]);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (entityFilter !== "ALL") params.set("entityType", entityFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Compliance & Security
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Immutable Activity Audit Logs
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Append-only record of administrative mutations, inventory adjustments, and status transitions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          className="text-xs bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Logs
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white border border-neutral-200 p-4 sm:p-6 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase text-neutral-500 text-[10px]">
            Action:
          </span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-300 py-1.5 px-3 font-medium text-xs focus:outline-none focus:border-black"
          >
            <option value="ALL">All Actions</option>
            <option value="INVENTORY_ADJUSTED">INVENTORY_ADJUSTED</option>
            <option value="ORDER_STATUS_UPDATED">ORDER_STATUS_UPDATED</option>
            <option value="ORDER_CANCELLED_WITH_INVENTORY_RESTORE">ORDER_CANCELLED_WITH_INVENTORY_RESTORE</option>
            <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold uppercase text-neutral-500 text-[10px]">
            Entity Type:
          </span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-300 py-1.5 px-3 font-medium text-xs focus:outline-none focus:border-black"
          >
            <option value="ALL">All Entities</option>
            <option value="Inventory">Inventory</option>
            <option value="Order">Order</option>
            <option value="User">User</option>
            <option value="Store">Store</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500 space-y-2">
            <History className="h-8 w-8 text-neutral-400 mx-auto" />
            <p className="font-bold uppercase text-black">No Audit Logs Found</p>
            <p>No activity has been recorded matching the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details / Context Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/60">
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <strong className="text-black font-sans block">{log.userName}</strong>
                      <span className="text-[10px] text-neutral-400">{log.userEmail || "System"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default" className="text-[9px] font-mono">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-neutral-700 font-sans font-semibold">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono text-[10px]">
                      {log.details ? (
                        <pre className="bg-neutral-50 p-2 border border-neutral-200 max-w-md overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
