"use client";

import React, { useState, useEffect } from "react";
import { AdminInventoryItemDTO } from "@/modules/admin/types";
import { formatCurrency } from "@/lib/utils";
import {
  Boxes,
  Search,
  AlertTriangle,
  RefreshCw,
  Edit2,
  CheckCircle2,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<AdminInventoryItemDTO[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string; city: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<AdminInventoryItemDTO | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStoreId !== "ALL") params.set("storeId", selectedStoreId);
      if (lowStockOnly) params.set("lowStock", "true");

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInventory(data.data);

        // Derive unique stores for filter
        const storeMap = new Map<string, { id: string; name: string; city: string }>();
        data.data.forEach((item: AdminInventoryItemDTO) => {
          if (!storeMap.has(item.storeId)) {
            storeMap.set(item.storeId, {
              id: item.storeId,
              name: item.storeName,
              city: item.storeCity,
            });
          }
        });
        setStores(Array.from(storeMap.values()));
      }
    } catch (err) {
      console.error("Fetch inventory error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedStoreId, lowStockOnly]);

  const handleOpenEdit = (item: AdminInventoryItemDTO) => {
    setEditingItem(item);
    setNewQuantity(item.quantity);
    setAdjustmentReason("Restock shipment received");
    setModalError(null);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (newQuantity < 0) {
      setModalError("Quantity cannot be negative.");
      return;
    }

    if (newQuantity < editingItem.reservedQuantity) {
      setModalError(
        `Cannot reduce stock below ${editingItem.reservedQuantity} active reserved units.`
      );
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: editingItem.storeId,
          variantId: editingItem.variantId,
          newQuantity,
          reason: adjustmentReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        fetchInventory();
      } else {
        setModalError(data.error?.message || "Failed to adjust inventory.");
      }
    } catch (err) {
      console.error("Save adjustment error:", err);
      setModalError("Network error during inventory adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.productName.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.storeName.toLowerCase().includes(term) ||
      item.storeCity.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Stock Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Store Inventory Matrix
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchInventory}
          className="text-xs bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Stock
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white border border-neutral-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Store Selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-neutral-500 text-[10px]">
              Store:
            </span>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 py-1.5 px-3 font-medium text-xs focus:outline-none focus:border-black"
            >
              <option value="ALL">All Retail Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-neutral-50 border border-neutral-200 py-1.5 px-3 hover:border-black">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="text-black focus:ring-black"
            />
            <span className="font-bold uppercase text-[11px] text-black">
              Low Stock Only (&le; 3)
            </span>
          </label>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by product, SKU, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-300 py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-black"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500 space-y-2">
            <Boxes className="h-8 w-8 text-neutral-400 mx-auto" />
            <p className="font-bold uppercase text-black">No Inventory Items Found</p>
            <p>Try resetting the store filter or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Store Location</th>
                  <th className="py-3 px-4">Product & Variant</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Physical Qty</th>
                  <th className="py-3 px-4 text-center">Reserved Hold</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredInventory.map((item) => (
                  <tr key={item.inventoryId} className="hover:bg-neutral-50/60">
                    <td className="py-3 px-4">
                      <strong className="text-black uppercase block">{item.storeName}</strong>
                      <span className="text-[10px] text-neutral-400">{item.storeCity}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold uppercase text-black block">{item.productName}</span>
                      <span className="text-neutral-500 text-[11px]">
                        Size: {item.sizeName} · Color: {item.colorName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-black text-sm">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700 font-semibold">
                      {item.reservedQuantity > 0 ? `${item.reservedQuantity} held` : "—"}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-sm text-black">
                      {item.availableQuantity}
                    </td>
                    <td className="py-3 px-4">
                      {item.availableQuantity === 0 ? (
                        <Badge variant="danger" className="text-[9px]">Out of Stock</Badge>
                      ) : item.isLowStock ? (
                        <Badge variant="warning" className="text-[9px]">Low Stock</Badge>
                      ) : (
                        <Badge variant="success" className="text-[9px]">In Stock</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="text-[10px] py-0.5 px-2.5"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingItem(null)} />

          <div className="relative w-full max-w-md bg-white border border-neutral-200 p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-black uppercase tracking-wider text-black">
                Adjust Physical Stock
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-neutral-50 p-3 border border-neutral-200">
              <p className="font-bold text-black uppercase">{editingItem.productName}</p>
              <p className="text-neutral-600">
                Store: <strong>{editingItem.storeName} ({editingItem.storeCity})</strong>
              </p>
              <p className="text-neutral-500 font-mono text-[11px]">
                SKU: {editingItem.sku} · Current Physical: <strong>{editingItem.quantity}</strong> · Reserved Holds: <strong>{editingItem.reservedQuantity}</strong>
              </p>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  New Physical Quantity *
                </label>
                <input
                  type="number"
                  min={editingItem.reservedQuantity}
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 text-sm font-mono font-bold focus:outline-none focus:border-black"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Invariant rule: Must be &ge; {editingItem.reservedQuantity} (active reservation holds).
                </span>
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Audit Justification Reason *
                </label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Restock shipment, physical inventory audit, damaged write-off"
                  className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Save & Log Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
