"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderDTO } from "@/modules/orders/types";

interface AddressItem {
  id: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  addresses: AddressItem[];
  _count: {
    orders: number;
    wishlist: number;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Profile modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Address modal state
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress1, setNewAddress1] = useState("");
  const [newAddress2, setNewAddress2] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Authoritative server data fetcher
  const fetchProfileAndOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/orders"),
      ]);

      const profileData = await profileRes.json();
      const ordersData = await ordersRes.json();

      if (profileData.success) {
        setProfile(profileData.data);
        setEditName(profileData.data.name || "");
        setEditPhone(profileData.data.phone || "");
      } else {
        setError(profileData.error?.message || "Failed to load profile.");
      }

      if (ordersData.success && Array.isArray(ordersData.data)) {
        setRecentOrders(ordersData.data.slice(0, 3));
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Unable to connect to user service.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    } else if (status === "authenticated") {
      fetchProfileAndOrders();
    }
  }, [status, router, fetchProfileAndOrders]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileError("Please enter your name.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditProfileOpen(false);
        // Explicit authoritative server re-fetch
        await fetchProfileAndOrders();
      } else {
        setProfileError(data.error?.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setProfileError("An unexpected error occurred while saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    setAddressError(null);

    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newFullName,
          phone: newPhone,
          addressLine1: newAddress1,
          addressLine2: newAddress2,
          city: newCity,
          state: newState,
          pincode: newPincode,
          isDefault: newIsDefault,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddAddressOpen(false);
        // Reset form
        setNewFullName("");
        setNewPhone("");
        setNewAddress1("");
        setNewAddress2("");
        setNewCity("");
        setNewState("");
        setNewPincode("");
        setNewIsDefault(false);
        // Explicit authoritative server re-fetch
        await fetchProfileAndOrders();
      } else {
        setAddressError(data.error?.message || "Failed to save address.");
      }
    } catch (err) {
      console.error("Address save error:", err);
      setAddressError("An unexpected error occurred.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to remove this delivery address?")) return;

    try {
      const res = await fetch(`/api/user/addresses/${addressId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        // Explicit authoritative server re-fetch
        await fetchProfileAndOrders();
      }
    } catch (err) {
      console.error("Address delete error:", err);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        // Explicit authoritative server re-fetch
        await fetchProfileAndOrders();
      }
    } catch (err) {
      console.error("Set default address error:", err);
    }
  };

  const getOrderStatusBadge = (orderStatus: string) => {
    switch (orderStatus) {
      case "ORDER_PLACED":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="schedule" size={12} className="text-amber-700" />
            <span>Order Placed</span>
          </span>
        );
      case "CONFIRMED":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 border border-neutral-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="inventory_2" size={12} className="text-neutral-700" />
            <span>Processing</span>
          </span>
        );
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return (
          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 border border-neutral-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="local_shipping" size={12} className="text-stitch-primary" />
            <span>In-Transit</span>
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="check_circle" size={12} className="text-emerald-700" />
            <span>Delivered</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="cancel" size={12} className="text-rose-700" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px]">
            {orderStatus}
          </Badge>
        );
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="py-12 bg-[#FAFAFA] min-h-screen">
        <Container size="md" className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </Container>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 bg-[#FAFAFA] min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <MaterialIcon name="error" size={40} className="text-rose-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold uppercase text-black mb-2">Profile Error</h2>
          <p className="text-xs text-neutral-500 mb-6">{error || "Unable to load user profile."}</p>
          <Button variant="primary" size="sm" onClick={() => fetchProfileAndOrders()}>
            Retry
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 bg-[#FAFAFA] min-h-screen">
      <Container size="md">
        {/* Stitch Profile Header */}
        <section className="mb-10 text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-black text-white flex items-center justify-center border-2 border-black shadow-sm">
            <span className="font-mono text-3xl font-black uppercase tracking-tight">
              {profile.name.charAt(0)}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stitch-primary">
              {profile.name}
            </h1>
            {profile.role !== "CUSTOMER" && (
              <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                {profile.role}
              </Badge>
            )}
          </div>
          <p className="text-xs text-stitch-secondaryText">{profile.email}</p>
          {profile.phone && (
            <p className="text-xs text-stitch-secondaryText mt-0.5">{profile.phone}</p>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              className="text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <MaterialIcon name="edit" size={14} />
              <span>Edit Profile</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 text-neutral-600 hover:text-black"
            >
              <MaterialIcon name="logout" size={14} />
              <span>Sign Out</span>
            </Button>
          </div>
        </section>

        {/* Stitch Account Action Grid (Tiles) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
          <Link
            href="/orders"
            className="bg-white border border-stitch-border rounded-lg p-5 flex flex-col items-center justify-center gap-2.5 transition-all hover:bg-stitch-surface hover:border-black active:scale-[0.98] shadow-sm text-center group"
          >
            <span className="p-3 bg-stitch-surface rounded-full group-hover:bg-black group-hover:text-white transition-colors">
              <MaterialIcon name="inventory_2" size={24} className="text-stitch-primary group-hover:text-white transition-colors" />
            </span>
            <div>
              <span className="text-sm font-bold tracking-wide text-black block">My Orders</span>
              <span className="text-[11px] text-stitch-secondaryText font-medium">
                {profile._count.orders} {profile._count.orders === 1 ? "order" : "orders"} placed
              </span>
            </div>
          </Link>

          <Link
            href="/wishlist"
            className="bg-white border border-stitch-border rounded-lg p-5 flex flex-col items-center justify-center gap-2.5 transition-all hover:bg-stitch-surface hover:border-black active:scale-[0.98] shadow-sm text-center group"
          >
            <span className="p-3 bg-stitch-surface rounded-full group-hover:bg-black group-hover:text-white transition-colors">
              <MaterialIcon name="favorite" size={24} className="text-stitch-primary group-hover:text-white transition-colors" />
            </span>
            <div>
              <span className="text-sm font-bold tracking-wide text-black block">Wishlist</span>
              <span className="text-[11px] text-stitch-secondaryText font-medium">
                {profile._count.wishlist} {profile._count.wishlist === 1 ? "item" : "items"} saved
              </span>
            </div>
          </Link>

          <a
            href="#addresses"
            className="bg-white border border-stitch-border rounded-lg p-5 flex flex-col items-center justify-center gap-2.5 transition-all hover:bg-stitch-surface hover:border-black active:scale-[0.98] shadow-sm text-center group"
          >
            <span className="p-3 bg-stitch-surface rounded-full group-hover:bg-black group-hover:text-white transition-colors">
              <MaterialIcon name="location_on" size={24} className="text-stitch-primary group-hover:text-white transition-colors" />
            </span>
            <div>
              <span className="text-sm font-bold tracking-wide text-black block">Addresses</span>
              <span className="text-[11px] text-stitch-secondaryText font-medium">
                {profile.addresses.length} {profile.addresses.length === 1 ? "address" : "addresses"} saved
              </span>
            </div>
          </a>

          <Link
            href="/reservations"
            className="bg-white border border-stitch-border rounded-lg p-5 flex flex-col items-center justify-center gap-2.5 transition-all hover:bg-stitch-surface hover:border-black active:scale-[0.98] shadow-sm text-center group col-span-2 sm:col-span-1"
          >
            <span className="p-3 bg-stitch-surface rounded-full group-hover:bg-black group-hover:text-white transition-colors">
              <MaterialIcon name="storefront" size={24} className="text-stitch-primary group-hover:text-white transition-colors" />
            </span>
            <div>
              <span className="text-sm font-bold tracking-wide text-black block">In-Store Holds</span>
              <span className="text-[11px] text-stitch-secondaryText font-medium">
                2-Hour Pickup Passes
              </span>
            </div>
          </Link>

          <Link
            href="/stores"
            className="bg-white border border-stitch-border rounded-lg p-5 flex flex-col items-center justify-center gap-2.5 transition-all hover:bg-stitch-surface hover:border-black active:scale-[0.98] shadow-sm text-center group col-span-2 sm:col-span-2"
          >
            <span className="p-3 bg-stitch-surface rounded-full group-hover:bg-black group-hover:text-white transition-colors">
              <MaterialIcon name="map" size={24} className="text-stitch-primary group-hover:text-white transition-colors" />
            </span>
            <div>
              <span className="text-sm font-bold tracking-wide text-black block">Store Locator</span>
              <span className="text-[11px] text-stitch-secondaryText font-medium">
                Find nearby physical retail outlets
              </span>
            </div>
          </Link>
        </section>

        {/* Stitch Recent Orders Section */}
        <section className="mb-12" id="recent-orders">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-stitch-border">
            <h2 className="text-base font-bold uppercase tracking-wider text-black">
              Recent Orders
            </h2>
            <Link
              href="/orders"
              className="text-xs font-bold uppercase tracking-wider text-stitch-secondaryText hover:text-black transition-colors inline-flex items-center gap-1"
            >
              <span>View All Orders ({profile._count.orders})</span>
              <MaterialIcon name="arrow_forward" size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-white border border-stitch-border rounded-lg p-8 text-center space-y-3">
              <MaterialIcon name="inventory_2" size={36} className="text-neutral-400 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-wider text-black">
                No orders placed yet
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Explore our fashion collections to place your first order.
              </p>
              <Link href="/products" className="inline-block pt-2">
                <Button variant="primary" size="sm">
                  Explore Catalog
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-stitch-border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-neutral-400 shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-20 bg-stitch-surface border border-stitch-border rounded flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                      {order.items[0]?.variantSku ? (
                        <MaterialIcon name="apparel" size={28} className="text-neutral-400" />
                      ) : (
                        <MaterialIcon name="inventory_2" size={28} className="text-neutral-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono text-sm font-bold text-black">
                          {order.orderNumber}
                        </h3>
                        <span className="text-xs text-neutral-400">·</span>
                        <span className="text-xs text-neutral-500">{formatDate(order.createdAt)}</span>
                      </div>
                      <p className="text-xs font-bold text-black">
                        {formatCurrency(order.total)}{" "}
                        <span className="text-neutral-500 font-normal">
                          ({order.itemCount} {order.itemCount === 1 ? "item" : "items"})
                        </span>
                      </p>
                      <div className="pt-0.5">{getOrderStatusBadge(order.status)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="text-xs py-1.5 px-3 inline-flex items-center gap-1">
                        <span>View Details</span>
                        <MaterialIcon name="arrow_forward" size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Address Book Section */}
        <section id="addresses" className="bg-white border border-stitch-border rounded-lg p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-stitch-border mb-6">
            <div>
              <h3 className="text-base font-bold uppercase tracking-wider text-black">
                Saved Delivery Addresses
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage your home, office, and delivery locations
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddAddressOpen(true)}
              className="text-xs inline-flex items-center gap-1"
            >
              <MaterialIcon name="add" size={16} />
              <span>Add Address</span>
            </Button>
          </div>

          {profile.addresses.length === 0 ? (
            <div className="text-center py-10 bg-stitch-surface border border-stitch-border rounded">
              <MaterialIcon name="location_on" size={36} className="text-neutral-400 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase text-black">No saved addresses yet</p>
              <p className="text-xs text-neutral-500 mt-0.5 max-w-xs mx-auto mb-4">
                Add a delivery address to speed up your checkout process.
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsAddAddressOpen(true)}>
                Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-4 border rounded relative flex flex-col justify-between transition-colors ${
                    addr.isDefault
                      ? "border-black bg-neutral-50/70"
                      : "border-stitch-border bg-white hover:border-neutral-400"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-black">
                        {addr.fullName}
                      </span>
                      {addr.isDefault && (
                        <Badge variant="default" className="text-[9px]">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                      <br />
                      {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                    </p>
                    <p className="text-[11px] text-neutral-500 pt-1">
                      Phone: <span className="font-semibold text-neutral-800">{addr.phone}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-neutral-100 text-xs">
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-neutral-500 hover:text-black text-[11px] uppercase font-bold transition-colors"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                        <MaterialIcon name="check_circle" size={14} className="text-emerald-700" />
                        <span>Primary Address</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1 transition-colors"
                      title="Delete Address"
                      aria-label="Delete Address"
                    >
                      <MaterialIcon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </Container>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditProfileOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-stitch-border p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 rounded-lg">
            <div className="flex items-center justify-between pb-3 border-b border-stitch-border mb-5">
              <div className="flex items-center gap-2">
                <MaterialIcon name="person" size={20} className="text-black" />
                <h3 className="text-sm font-black uppercase tracking-wider text-black">
                  Edit Personal Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 text-neutral-400 hover:text-black transition-colors"
                aria-label="Close modal"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            {profileError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <MaterialIcon name="error" size={16} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-black mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-stitch-surface border border-stitch-border py-2 px-3 text-xs text-black focus:outline-none focus:border-black rounded"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-black mb-1">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full bg-neutral-100 border border-stitch-border py-2 px-3 text-xs text-neutral-500 rounded cursor-not-allowed"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Email is linked to your account security and cannot be edited.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-black mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-stitch-surface border border-stitch-border py-2 px-3 text-xs text-black focus:outline-none focus:border-black rounded"
                />
              </div>

              <div className="pt-4 border-t border-stitch-border flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingProfile}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddAddressOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white border border-stitch-border p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="flex items-center justify-between pb-4 border-b border-stitch-border mb-6">
              <div className="flex items-center gap-2">
                <MaterialIcon name="location_on" size={20} className="text-black" />
                <h3 className="text-sm font-black uppercase tracking-wider text-black">
                  Add New Delivery Address
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(false)}
                className="p-1 text-neutral-400 hover:text-black transition-colors"
                aria-label="Close modal"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            {addressError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <MaterialIcon name="error" size={16} className="shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAddress} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-stitch-surface border border-stitch-border py-2 px-3 text-xs focus:outline-none focus:border-black rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-stitch-surface border border-stitch-border py-2 px-3 text-xs focus:outline-none focus:border-black rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-black mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="House / Flat No., Building, Street"
                  value={newAddress1}
                  onChange={(e) => setNewAddress1(e.target.value)}
                  className="w-full bg-stitch-surface border border-stitch-border py-2 px-3 text-xs focus:outline-none focus:border-black rounded"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-black mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Landmark, Area"
                  value={newAddress2}
                  onChange={(e) => setNewAddress2(e.target.value)}
                  className="w-full bg-stitch-surface border border-stitch-border py-2 px-3 text-xs focus:outline-none focus:border-black rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-stitch-surface border border-stitch-border py-2 px-3 text-xs focus:outline-none focus:border-black rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full bg-stitch-surface border border-stitch-border py-2 px-3 text-xs focus:outline-none focus:border-black rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    placeholder="6 digits"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    className="w-full bg-stitch-surface border border-stitch-border py-2 px-3 text-xs focus:outline-none focus:border-black rounded"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultAddressCheck"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded-none border-neutral-300 text-black focus:ring-black"
                />
                <label
                  htmlFor="defaultAddressCheck"
                  className="text-xs text-neutral-700 cursor-pointer"
                >
                  Make this my default delivery address
                </label>
              </div>

              <div className="pt-4 border-t border-stitch-border flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddAddressOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingAddress}
                >
                  Save Address
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

