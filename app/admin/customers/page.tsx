"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AdminCustomerDTO } from "@/modules/admin/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  Store,
  UserCheck,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminCustomersPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  const [customers, setCustomers] = useState<AdminCustomerDTO[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string; city: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Role Edit Modal
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomerDTO | null>(null);
  const [targetRole, setTargetRole] = useState<"CUSTOMER" | "STORE_STAFF" | "ADMIN">("CUSTOMER");
  const [targetStoreId, setTargetStoreId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCustomersAndStores = async () => {
    setIsLoading(true);
    try {
      const [custRes, storeRes] = await Promise.all([
        fetch("/api/admin/customers"),
        fetch("/api/stores"),
      ]);

      const [custData, storeData] = await Promise.all([
        custRes.json(),
        storeRes.json(),
      ]);

      if (custData.success) {
        setCustomers(custData.data);
      }
      if (storeData.success) {
        setStores(storeData.data.stores || []);
      }
    } catch (err) {
      console.error("Fetch customers error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersAndStores();
  }, []);

  const handleOpenRoleModal = (c: AdminCustomerDTO) => {
    setEditingCustomer(c);
    setTargetRole(c.role);
    setTargetStoreId(c.storeId || (stores[0]?.id || ""));
    setModalError(null);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    if (targetRole === "STORE_STAFF" && !targetStoreId) {
      setModalError("Store assignment is mandatory for STORE_STAFF role.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch(`/api/admin/customers/${editingCustomer.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: targetRole,
          storeId: targetRole === "STORE_STAFF" ? targetStoreId : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingCustomer(null);
        fetchCustomersAndStores();
      } else {
        setModalError(data.error?.message || "Failed to update role.");
      }
    } catch (err) {
      console.error("Role update error:", err);
      setModalError("Network error during role update.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      c.role.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            User Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Customer & Staff Roles
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchCustomersAndStores}
          className="text-xs bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Users
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-neutral-200 p-4 sm:p-6 shadow-sm flex items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, email, phone, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-300 py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-black"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500 space-y-2">
            <Users className="h-8 w-8 text-neutral-400 mx-auto" />
            <p className="font-bold uppercase text-black">No Users Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role & Store</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3 px-4 text-center">Store Holds</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/60">
                    <td className="py-3 px-4 font-bold text-black uppercase">{c.name}</td>
                    <td className="py-3 px-4 text-neutral-600">{c.email}</td>
                    <td className="py-3 px-4">
                      {c.role === "ADMIN" && (
                        <Badge variant="default" className="text-[9px] bg-black text-white">
                          Administrator
                        </Badge>
                      )}
                      {c.role === "STORE_STAFF" && (
                        <div>
                          <Badge variant="warning" className="text-[9px]">
                            Store Staff
                          </Badge>
                          <span className="block text-[10px] text-neutral-500 mt-0.5">
                            {c.storeName || "Unassigned"}
                          </span>
                        </div>
                      )}
                      {c.role === "CUSTOMER" && (
                        <Badge variant="secondary" className="text-[9px]">
                          Customer
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-black">
                      {c.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-black">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-600">
                      {c.totalReservations}
                    </td>
                    <td className="py-3 px-4 text-[10px] text-neutral-500">{formatDate(c.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRoleModal(c)}
                        className="text-[10px] py-0.5 px-2.5"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Change Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Management Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingCustomer(null)} />

          <div className="relative w-full max-w-md bg-white border border-neutral-200 p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-black uppercase tracking-wider text-black">
                Manage User Role & Store Scope
              </h3>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-neutral-50 p-3 border border-neutral-200">
              <p className="font-bold text-black uppercase">{editingCustomer.name}</p>
              <p className="text-neutral-600">{editingCustomer.email}</p>
              <p className="text-neutral-500 font-mono text-[11px]">
                Current Role: <strong>{editingCustomer.role}</strong>
              </p>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Assign New Role *
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 text-xs focus:outline-none focus:border-black font-semibold"
                >
                  <option value="CUSTOMER">CUSTOMER (Standard Consumer)</option>
                  <option value="STORE_STAFF">STORE_STAFF (POS Store Access)</option>
                  <option value="ADMIN">ADMIN (Full Console Administrator)</option>
                </select>
              </div>

              {targetRole === "STORE_STAFF" && (
                <div>
                  <label className="block font-bold uppercase text-black mb-1">
                    Assigned Retail Store (Mandatory) *
                  </label>
                  <select
                    required
                    value={targetStoreId}
                    onChange={(e) => setTargetStoreId(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 text-xs focus:outline-none focus:border-black font-semibold"
                  >
                    <option value="">-- Select Store Location --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Staff user will only have access to manage reservations and POS fulfillment for this designated store.
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingCustomer(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Save Role Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
