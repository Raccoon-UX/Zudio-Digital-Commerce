"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/admin/MetricCard";
import { DashboardMetricsDTO } from "@/modules/admin/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  IndianRupee,
  ShoppingBag,
  Store,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetricsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard/metrics");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error("Fetch metrics error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Operations & Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Executive Operations Dashboard
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMetrics}
          className="text-xs bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Metrics
        </Button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Gross Paid Revenue"
          value={formatCurrency(metrics.grossPaidRevenue)}
          subtitle="Sum of orders verified with Payment = PAID"
          icon={IndianRupee}
          variant="success"
        />
        <MetricCard
          title="Paid Orders Count"
          value={metrics.totalPaidOrders}
          subtitle={`Out of ${metrics.totalOrders} total lifetime orders`}
          icon={ShoppingBag}
          variant="default"
        />
        <MetricCard
          title="Active Store Holds"
          value={metrics.activeReservationsCount}
          subtitle="2-hour in-store reservations active"
          icon={Store}
          variant="default"
        />
        <MetricCard
          title="Low Stock SKU Alerts"
          value={metrics.lowStockItemsCount}
          subtitle="Items with <= 3 available units"
          icon={AlertTriangle}
          variant={metrics.lowStockItemsCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Order Status Distribution Funnel */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-black">
          Order Fulfillment Status Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {Object.entries(metrics.orderStatusCounts).map(([st, count]) => (
            <div key={st} className="p-3 bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                {st.replace(/_/g, " ")}
              </span>
              <strong className="text-xl font-black font-mono text-black">
                {count}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Top Selling Products & Category Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Selling Products */}
        <div className="lg:col-span-6 bg-white border border-neutral-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              Top Selling Fashion Styles
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">By Units Sold</span>
          </div>

          {metrics.topSellingProducts.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">
              No sales data recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100 space-y-3">
              {metrics.topSellingProducts.map((p, idx) => (
                <div key={p.productId} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neutral-400 font-bold">#{idx + 1}</span>
                    <span className="font-bold uppercase text-black">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-black">{p.totalQuantitySold} units</span>
                    <p className="text-[10px] text-neutral-400">{formatCurrency(p.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Revenue Breakdown */}
        <div className="lg:col-span-6 bg-white border border-neutral-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              Revenue by Category
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">Gross Paid</span>
          </div>

          {metrics.revenueByCategory.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">
              No category revenue data recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.revenueByCategory.map((c) => (
                <div key={c.categoryName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase text-black">{c.categoryName}</span>
                    <span className="font-black text-black">{formatCurrency(c.revenue)}</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 overflow-hidden">
                    <div
                      className="bg-black h-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (c.revenue / (metrics.grossPaidRevenue || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Live Table */}
      <div className="bg-white border border-neutral-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black">
            Recent Orders Feed
          </h3>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="text-xs">
              View All Orders
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Fulfillment Store</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {metrics.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50/50">
                  <td className="py-3 px-3 font-mono font-bold text-black">{o.orderNumber}</td>
                  <td className="py-3 px-3">{o.customerName}</td>
                  <td className="py-3 px-3">
                    <Badge variant="default" className="text-[9px]">
                      {o.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={o.paymentStatus === "PAID" ? "success" : "warning"}
                      className="text-[9px]"
                    >
                      {o.paymentStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-neutral-600">{o.fulfillmentStore}</td>
                  <td className="py-3 px-3 text-right font-black text-black">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link href={`/admin/orders`}>
                      <Button variant="outline" size="sm" className="text-[10px] py-0.5 px-2">
                        Manage
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
