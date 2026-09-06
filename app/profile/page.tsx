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
  image: string | null;
  googleImage: string | null;
  avatarUrl?: string | null;
  role: string;
  addresses: AddressItem[];
  _count: {
    orders: number;
    wishlist: number;
  };
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroAvatarError, setHeroAvatarError] = useState(false);

  // Edit Profile modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);
  const [editAvatarError, setEditAvatarError] = useState<string | null>(null);
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
        setHeroAvatarError(false);
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

  const handleOpenEditProfile = () => {
    setEditName(profile?.name || "");
    setEditPhone(profile?.phone || "");
    setEditAvatarPreview(profile?.image || null);
    setIsAvatarRemoved(false);
    setEditAvatarError(null);
    setProfileError(null);
    setIsEditProfileOpen(true);
  };

  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setEditAvatarError("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setEditAvatarError("Image must be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setEditAvatarPreview(event.target.result);
        setIsAvatarRemoved(false);
      }
    };
    reader.onerror = () => {
      setEditAvatarError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAvatar = () => {
    setEditAvatarPreview(null);
    setIsAvatarRemoved(true);
    setEditAvatarError(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileError("Please enter your name.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    const updatePayload: { name: string; phone: string | null; image?: string | null } = {
      name: editName.trim(),
      phone: editPhone.trim() || null,
    };

    if (isAvatarRemoved) {
      updatePayload.image = null;
    } else if (editAvatarPreview && editAvatarPreview !== profile?.image) {
      updatePayload.image = editAvatarPreview;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditProfileOpen(false);
        // Explicit authoritative server re-fetch
        await fetchProfileAndOrders();
        // Update client session so header reflects avatar immediately
        if (typeof updateSession === "function") {
          await updateSession({
            name: data.data.name,
            image: data.data.avatarUrl || null,
          });
        }
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

  // Order Stepper Helper
  const getOrderProgressStep = (orderStatus: string): { step: number; isCancelled: boolean } => {
    switch (orderStatus) {
      case "ORDER_PLACED":
        return { step: 1, isCancelled: false };
      case "CONFIRMED":
        return { step: 1, isCancelled: false };
      case "PROCESSING":
        return { step: 2, isCancelled: false };
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return { step: 3, isCancelled: false };
      case "DELIVERED":
        return { step: 4, isCancelled: false };
      case "CANCELLED":
      case "RETURNED":
        return { step: 0, isCancelled: true };
      default:
        return { step: 1, isCancelled: false };
    }
  };

  const getOrderStatusBadge = (orderStatus: string) => {
    switch (orderStatus) {
      case "ORDER_PLACED":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
            <MaterialIcon name="schedule" size={12} className="text-amber-700" />
            <span>Order Placed</span>
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 border border-neutral-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
            <MaterialIcon name="check" size={12} className="text-neutral-700" />
            <span>Confirmed</span>
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-900 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
            <MaterialIcon name="inventory_2" size={12} className="text-rose-600" />
            <span>Processing</span>
          </span>
        );
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
            <MaterialIcon name="local_shipping" size={12} className="text-blue-700" />
            <span>In-Transit</span>
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
            <MaterialIcon name="check_circle" size={12} className="text-emerald-700" />
            <span>Delivered</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
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
      <div className="py-10 bg-[#FAFAFA] min-h-screen">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-9 space-y-6">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 bg-[#FAFAFA] min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <MaterialIcon name="error" size={32} />
          </div>
          <h2 className="text-xl font-bold uppercase text-neutral-900 mb-2">Profile Error</h2>
          <p className="text-xs text-neutral-500 mb-6">{error || "Unable to load user profile."}</p>
          <Button variant="primary" size="sm" onClick={() => fetchProfileAndOrders()}>
            Retry
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-10 bg-[#FAFAFA] min-h-screen">
      <Container size="xl">
        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden mb-6 overflow-x-auto pb-1 scrollbar-none flex items-center gap-2">
          <span className="bg-[#FFF0F3] text-rose-950 border border-[#FFE4E8] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs">
            <MaterialIcon name="person" size={16} className="text-rose-600" />
            <span>Account</span>
          </span>
          <Link
            href="/orders"
            className="bg-white text-neutral-700 border border-neutral-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 hover:bg-neutral-50"
          >
            <MaterialIcon name="inventory_2" size={16} className="text-neutral-500" />
            <span>Orders ({profile._count.orders})</span>
          </Link>
          <Link
            href="/wishlist"
            className="bg-white text-neutral-700 border border-neutral-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 hover:bg-neutral-50"
          >
            <MaterialIcon name="favorite" size={16} className="text-neutral-500" />
            <span>Wishlist ({profile._count.wishlist})</span>
          </Link>
          <a
            href="#addresses"
            className="bg-white text-neutral-700 border border-neutral-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 hover:bg-neutral-50"
          >
            <MaterialIcon name="location_on" size={16} className="text-neutral-500" />
            <span>Addresses ({profile.addresses.length})</span>
          </a>
          <Link
            href="/reservations"
            className="bg-white text-neutral-700 border border-neutral-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 hover:bg-neutral-50"
          >
            <MaterialIcon name="storefront" size={16} className="text-neutral-500" />
            <span>In-Store Holds</span>
          </Link>
          <Link
            href="/stores"
            className="bg-white text-neutral-700 border border-neutral-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 hover:bg-neutral-50"
          >
            <MaterialIcon name="map" size={16} className="text-neutral-500" />
            <span>Stores</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs sticky top-24 space-y-1">
              <div className="px-3 py-2.5 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                  Account Menu
                </span>
              </div>

              {/* Active: My Account */}
              <div className="bg-[#FFF0F3] text-rose-950 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between border border-[#FFE4E8] shadow-xs">
                <div className="flex items-center gap-2.5">
                  <MaterialIcon name="person" size={18} className="text-rose-600" />
                  <span>My Account</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              </div>

              <Link
                href="/orders"
                className="text-neutral-700 hover:text-black hover:bg-neutral-50 font-medium text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <MaterialIcon name="inventory_2" size={18} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  <span>My Orders</span>
                </div>
                {profile._count.orders > 0 && (
                  <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {profile._count.orders}
                  </span>
                )}
              </Link>

              <Link
                href="/wishlist"
                className="text-neutral-700 hover:text-black hover:bg-neutral-50 font-medium text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <MaterialIcon name="favorite" size={18} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  <span>Wishlist</span>
                </div>
                {profile._count.wishlist > 0 && (
                  <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {profile._count.wishlist}
                  </span>
                )}
              </Link>

              <a
                href="#addresses"
                className="text-neutral-700 hover:text-black hover:bg-neutral-50 font-medium text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <MaterialIcon name="location_on" size={18} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  <span>Addresses</span>
                </div>
                {profile.addresses.length > 0 && (
                  <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {profile.addresses.length}
                  </span>
                )}
              </a>

              <Link
                href="/reservations"
                className="text-neutral-700 hover:text-black hover:bg-neutral-50 font-medium text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <MaterialIcon name="storefront" size={18} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  <span>In-Store Holds</span>
                </div>
              </Link>

              <Link
                href="/stores"
                className="text-neutral-700 hover:text-black hover:bg-neutral-50 font-medium text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <MaterialIcon name="map" size={18} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  <span>Store Locator</span>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="w-full text-left text-neutral-700 hover:text-black hover:bg-neutral-50 font-medium text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <MaterialIcon name="settings" size={18} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  <span>Profile Settings</span>
                </div>
              </button>

              <a
                href="#help"
                className="text-neutral-700 hover:text-black hover:bg-neutral-50 font-medium text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <MaterialIcon name="help_outline" size={18} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  <span>Help & Support</span>
                </div>
              </a>

              <div className="pt-3 mt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left text-neutral-500 hover:text-rose-700 hover:bg-rose-50/60 font-medium text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors"
                >
                  <MaterialIcon name="logout" size={18} className="text-neutral-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Dashboard Area */}
          <main className="lg:col-span-9 space-y-7">
            {/* 1. Account Header / Profile Hero */}
            <section className="bg-gradient-to-r from-[#FFF0F3] via-[#FFF6F3] to-[#FDFBF7] border border-[#FFE8EC] rounded-2xl p-6 sm:p-7 shadow-xs overflow-hidden relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                {/* Left: User Info */}
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-2xl sm:text-3xl border-2 border-white shadow-sm shrink-0 overflow-hidden relative">
                    {(profile.image || profile.googleImage) && !heroAvatarError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.image || profile.googleImage || ""}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                        onError={() => setHeroAvatarError(true)}
                      />
                    ) : (
                      <span className="font-mono uppercase">{profile.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Hello,
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight leading-none">
                      {profile.name}
                    </h1>
                    <p className="text-xs text-neutral-500 font-medium">{profile.email}</p>
                    {profile.phone && (
                      <p className="text-xs text-neutral-500 font-medium">{profile.phone}</p>
                    )}
                    {profile.role !== "CUSTOMER" && (
                      <div className="pt-1.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-white/90 border border-neutral-200/80 text-neutral-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-2xs">
                          <MaterialIcon name="admin_panel_settings" size={13} className="text-neutral-700" />
                          <span>{profile.role}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Editorial Quote & Actions */}
                <div className="flex flex-col sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200/50">
                  <div className="hidden md:block text-right max-w-xs">
                    <p className="text-xs italic text-neutral-600 font-serif leading-relaxed">
                      &ldquo;Style is a way of saying who you are without having to speak.&rdquo;
                    </p>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 block mt-1">
                      — Zudio Editorial
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenEditProfile}
                      className="bg-white hover:bg-neutral-50 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 rounded-xl border-neutral-200"
                    >
                      <MaterialIcon name="edit" size={14} />
                      <span>Edit Profile</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="bg-white hover:bg-rose-50 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 text-neutral-600 hover:text-rose-700 rounded-xl border-neutral-200"
                    >
                      <MaterialIcon name="logout" size={14} />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Quick Action Cards (5 Pastel Tiles) */}
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Card 1: My Orders */}
              <Link
                href="/orders"
                className="bg-[#FFF0F3] border border-[#FFE4E8] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white text-rose-600 shadow-2xs flex items-center justify-center mb-3">
                    <MaterialIcon name="inventory_2" size={20} />
                  </div>
                  <h2 className="text-sm font-bold text-neutral-900 tracking-tight">My Orders</h2>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    {profile._count.orders} {profile._count.orders === 1 ? "order" : "orders"} placed
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-rose-200/40 flex items-center justify-between text-xs font-bold text-neutral-900 group-hover:text-rose-700 transition-colors">
                  <span>View Orders</span>
                  <MaterialIcon name="arrow_forward" size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Card 2: Wishlist */}
              <Link
                href="/wishlist"
                className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white text-blue-600 shadow-2xs flex items-center justify-center mb-3">
                    <MaterialIcon name="favorite" size={20} />
                  </div>
                  <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Wishlist</h2>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    {profile._count.wishlist} {profile._count.wishlist === 1 ? "item" : "items"} saved
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-blue-200/40 flex items-center justify-between text-xs font-bold text-neutral-900 group-hover:text-blue-700 transition-colors">
                  <span>View Wishlist</span>
                  <MaterialIcon name="arrow_forward" size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Card 3: Addresses */}
              <a
                href="#addresses"
                className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 shadow-2xs flex items-center justify-center mb-3">
                    <MaterialIcon name="location_on" size={20} />
                  </div>
                  <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Addresses</h2>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    {profile.addresses.length} {profile.addresses.length === 1 ? "address" : "addresses"} saved
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-emerald-200/40 flex items-center justify-between text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                  <span>Manage</span>
                  <MaterialIcon name="arrow_forward" size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>

              {/* Card 4: In-Store Holds */}
              <Link
                href="/reservations"
                className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white text-amber-600 shadow-2xs flex items-center justify-center mb-3">
                    <MaterialIcon name="storefront" size={20} />
                  </div>
                  <h2 className="text-sm font-bold text-neutral-900 tracking-tight">In-Store Holds</h2>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">2-Hour Pickup</p>
                </div>
                <div className="pt-3 mt-2 border-t border-amber-200/40 flex items-center justify-between text-xs font-bold text-neutral-900 group-hover:text-amber-700 transition-colors">
                  <span>View Holds</span>
                  <MaterialIcon name="arrow_forward" size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Card 5: Store Locator */}
              <Link
                href="/stores"
                className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group col-span-2 sm:col-span-1"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white text-purple-600 shadow-2xs flex items-center justify-center mb-3">
                    <MaterialIcon name="map" size={20} />
                  </div>
                  <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Store Locator</h2>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">Find nearby stores</p>
                </div>
                <div className="pt-3 mt-2 border-t border-purple-200/40 flex items-center justify-between text-xs font-bold text-neutral-900 group-hover:text-purple-700 transition-colors">
                  <span>Locate Stores</span>
                  <MaterialIcon name="arrow_forward" size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </section>

            {/* Split Section: Recent Orders & Right Discovery Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
              {/* Left Column: Recent Orders (8 cols on XL) */}
              <div className="xl:col-span-8 space-y-7">
                {/* Recent Orders Card */}
                <section className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-xs" id="recent-orders">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-100">
                    <div>
                      <h2 className="text-base font-black tracking-tight text-neutral-950">
                        Recent Orders
                      </h2>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        Track live status and order fulfillment
                      </p>
                    </div>
                    <Link
                      href="/orders"
                      className="text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-rose-800 transition-colors inline-flex items-center gap-1"
                    >
                      <span>View All ({profile._count.orders})</span>
                      <MaterialIcon name="arrow_forward" size={14} />
                    </Link>
                  </div>

                  {recentOrders.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white text-neutral-400 flex items-center justify-center mx-auto shadow-2xs border border-neutral-200">
                        <MaterialIcon name="inventory_2" size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">No orders placed yet</p>
                        <p className="text-xs text-neutral-500 mt-0.5 max-w-xs mx-auto">
                          Discover our latest fashion drops and place your first order.
                        </p>
                      </div>
                      <Link href="/products" className="inline-block pt-1">
                        <Button variant="primary" size="sm" className="rounded-xl">
                          Explore Catalog
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => {
                        const progress = getOrderProgressStep(order.status);
                        const isDelivered = order.status === "DELIVERED";

                        return (
                          <div
                            key={order.id}
                            className="border border-neutral-200/80 rounded-xl p-4 sm:p-5 hover:border-neutral-300 transition-colors bg-white shadow-2xs space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3.5">
                                <div className="w-14 h-18 sm:w-16 sm:h-20 bg-neutral-100 rounded-lg shrink-0 relative overflow-hidden flex items-center justify-center border border-neutral-200/60">
                                  {order.items[0]?.variantSku ? (
                                    <MaterialIcon name="apparel" size={28} className="text-neutral-400" />
                                  ) : (
                                    <MaterialIcon name="inventory_2" size={28} className="text-neutral-400" />
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-mono text-xs sm:text-sm font-bold text-neutral-900">
                                      {order.orderNumber}
                                    </h3>
                                    <span className="text-xs text-neutral-300">·</span>
                                    <span className="text-xs text-neutral-500 font-medium">
                                      {formatDate(order.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-neutral-900">
                                    {formatCurrency(order.total)}{" "}
                                    <span className="text-neutral-500 font-normal">
                                      ({order.itemCount} {order.itemCount === 1 ? "item" : "items"})
                                    </span>
                                  </p>
                                  <div className="pt-0.5">{getOrderStatusBadge(order.status)}</div>
                                </div>
                              </div>

                              <div className="flex items-center sm:justify-end">
                                <Link href={`/orders/${order.id}`}>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800"
                                  >
                                    <span>View Details</span>
                                    <MaterialIcon name="arrow_forward" size={13} />
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            {/* Order Stepper Progress Indicator */}
                            {!progress.isCancelled && (
                              <div className="pt-3 border-t border-neutral-100">
                                <div className="relative flex items-center justify-between max-w-md mx-auto">
                                  {/* Connecting Line */}
                                  <div className="absolute top-2 left-3 right-3 h-0.5 bg-neutral-200 -z-0">
                                    <div
                                      className={`h-full transition-all duration-300 ${
                                        isDelivered ? "bg-emerald-500" : "bg-rose-500"
                                      }`}
                                      style={{
                                        width: `${Math.max(0, Math.min(100, ((progress.step - 1) / 3) * 100))}%`,
                                      }}
                                    />
                                  </div>

                                  {/* Step 1: Confirmed */}
                                  <div className="flex flex-col items-center gap-1 relative z-10">
                                    <div
                                      className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-colors ${
                                        progress.step >= 1
                                          ? isDelivered
                                            ? "bg-emerald-600 border-emerald-600 text-white"
                                            : "bg-rose-600 border-rose-600 text-white"
                                          : "bg-white border-neutral-300 text-neutral-400"
                                      }`}
                                    >
                                      {progress.step >= 1 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <span
                                      className={`text-[10px] uppercase tracking-wider ${
                                        progress.step >= 1 ? "font-bold text-neutral-900" : "text-neutral-400"
                                      }`}
                                    >
                                      Confirmed
                                    </span>
                                  </div>

                                  {/* Step 2: Processing */}
                                  <div className="flex flex-col items-center gap-1 relative z-10">
                                    <div
                                      className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-colors ${
                                        progress.step >= 2
                                          ? isDelivered
                                            ? "bg-emerald-600 border-emerald-600 text-white"
                                            : "bg-rose-600 border-rose-600 text-white"
                                          : "bg-white border-neutral-300 text-neutral-400"
                                      }`}
                                    >
                                      {progress.step >= 2 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <span
                                      className={`text-[10px] uppercase tracking-wider ${
                                        progress.step >= 2 ? "font-bold text-neutral-900" : "text-neutral-400"
                                      }`}
                                    >
                                      Processing
                                    </span>
                                  </div>

                                  {/* Step 3: Shipped */}
                                  <div className="flex flex-col items-center gap-1 relative z-10">
                                    <div
                                      className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-colors ${
                                        progress.step >= 3
                                          ? isDelivered
                                            ? "bg-emerald-600 border-emerald-600 text-white"
                                            : "bg-rose-600 border-rose-600 text-white"
                                          : "bg-white border-neutral-300 text-neutral-400"
                                      }`}
                                    >
                                      {progress.step >= 3 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <span
                                      className={`text-[10px] uppercase tracking-wider ${
                                        progress.step >= 3 ? "font-bold text-neutral-900" : "text-neutral-400"
                                      }`}
                                    >
                                      Shipped
                                    </span>
                                  </div>

                                  {/* Step 4: Delivered */}
                                  <div className="flex flex-col items-center gap-1 relative z-10">
                                    <div
                                      className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-colors ${
                                        progress.step >= 4
                                          ? "bg-emerald-600 border-emerald-600 text-white"
                                          : "bg-white border-neutral-300 text-neutral-400"
                                      }`}
                                    >
                                      {progress.step >= 4 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <span
                                      className={`text-[10px] uppercase tracking-wider ${
                                        progress.step >= 4 ? "font-bold text-emerald-800" : "text-neutral-400"
                                      }`}
                                    >
                                      Delivered
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* 4. Saved Delivery Addresses */}
                <section id="addresses" className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-5">
                    <div>
                      <h2 className="text-base font-black tracking-tight text-neutral-950">
                        Saved Delivery Addresses
                      </h2>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        Manage your home, office, and delivery locations
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddAddressOpen(true)}
                      className="text-xs inline-flex items-center gap-1 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800"
                    >
                      <MaterialIcon name="add" size={16} />
                      <span>Add Address</span>
                    </Button>
                  </div>

                  {profile.addresses.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-white text-neutral-400 flex items-center justify-center mx-auto mb-2 shadow-2xs border border-neutral-200">
                        <MaterialIcon name="location_on" size={24} />
                      </div>
                      <p className="text-sm font-bold text-neutral-900">No saved addresses yet</p>
                      <p className="text-xs text-neutral-500 mt-0.5 max-w-xs mx-auto mb-4">
                        Add a delivery address to speed up your checkout process.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setIsAddAddressOpen(true)} className="rounded-xl">
                        Add Your First Address
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`p-4 border rounded-xl relative flex flex-col justify-between transition-colors ${
                            addr.isDefault
                              ? "border-neutral-900 bg-neutral-50/70"
                              : "border-neutral-200/80 bg-white hover:border-neutral-300"
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-neutral-950">
                                {addr.fullName}
                              </span>
                              {addr.isDefault && (
                                <Badge variant="default" className="text-[9px] rounded-full px-2">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                              {addr.addressLine1}
                              {addr.addressLine2 && `, ${addr.addressLine2}`}
                              <br />
                              {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                            </p>
                            <p className="text-[11px] text-neutral-500 pt-1">
                              Phone: <span className="font-semibold text-neutral-800">{addr.phone}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100 text-xs">
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
              </div>

              {/* Right Column: Discovery & Store Support (4 cols on XL) */}
              <div className="xl:col-span-4 space-y-6">
                {/* Promo Card: New Arrivals */}
                <div className="bg-gradient-to-br from-rose-50 via-pink-50/50 to-neutral-50 border border-rose-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-2 relative z-10">
                    <span className="inline-flex items-center gap-1 bg-white/90 border border-rose-200/80 text-rose-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-2xs">
                      <MaterialIcon name="auto_awesome" size={12} className="text-rose-600" />
                      <span>New Drops</span>
                    </span>
                    <h3 className="text-lg font-black text-neutral-950 tracking-tight leading-tight">
                      New Arrivals
                    </h3>
                    <p className="text-xs text-neutral-600 font-medium">
                      Minimal, modern silhouettes designed for everyday fashion.
                    </p>
                  </div>
                  <div className="pt-4 mt-2">
                    <Link href="/products">
                      <Button variant="primary" size="sm" className="w-full rounded-xl bg-neutral-950 text-white hover:bg-neutral-800">
                        <span>Shop Now</span>
                        <MaterialIcon name="arrow_forward" size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Store Locator Card */}
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center">
                      <MaterialIcon name="location_city" size={20} />
                    </div>
                    <h3 className="text-base font-black text-neutral-950 tracking-tight">
                      Find Your Nearest Zudio Store
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                      Check in-store availability, try on fitting room styles, and explore local collections.
                    </p>
                  </div>
                  <Link href="/stores">
                    <Button variant="outline" size="sm" className="w-full rounded-xl border-neutral-200 font-bold">
                      <span>Locate Store</span>
                      <MaterialIcon name="near_me" size={14} />
                    </Button>
                  </Link>
                </div>

                {/* In-Store Hold Reminder Card */}
                <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-900">
                    <MaterialIcon name="timer" size={18} className="text-amber-700" />
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      2-Hour Hold Pass
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                    Reserve trending garments online and try them on in-store within 2 hours with zero upfront charge.
                  </p>
                  <div className="pt-1">
                    <Link href="/reservations" className="text-xs font-bold text-amber-900 hover:text-amber-950 inline-flex items-center gap-1">
                      <span>View Active Holds</span>
                      <MaterialIcon name="arrow_forward" size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Bottom Service Strip (3 Cards) */}
            <section id="help" className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <MaterialIcon name="help_outline" size={20} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Help & Support
                  </h4>
                  <p className="text-xs text-neutral-500 font-medium">Find stores and assistance.</p>
                  <Link href="/stores" className="text-xs font-bold text-rose-600 hover:text-rose-800 inline-flex items-center gap-0.5 pt-1">
                    <span>Store Locator</span>
                    <MaterialIcon name="arrow_forward" size={12} />
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <MaterialIcon name="storefront" size={20} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    In-Store Holds
                  </h4>
                  <p className="text-xs text-neutral-500 font-medium">2-hour reservation pickup.</p>
                  <Link href="/reservations" className="text-xs font-bold text-rose-600 hover:text-rose-800 inline-flex items-center gap-0.5 pt-1">
                    <span>View Holds</span>
                    <MaterialIcon name="arrow_forward" size={12} />
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <MaterialIcon name="lock" size={20} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Secure Payments
                  </h4>
                  <p className="text-xs text-neutral-500 font-medium">Encrypted online checkout.</p>
                  <Link href="/orders" className="text-xs font-bold text-rose-600 hover:text-rose-800 inline-flex items-center gap-0.5 pt-1">
                    <span>Order History</span>
                    <MaterialIcon name="arrow_forward" size={12} />
                  </Link>
                </div>
              </div>
            </section>
          </main>
        </div>
      </Container>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditProfileOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-neutral-200 p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-5">
              <div className="flex items-center gap-2">
                <MaterialIcon name="person" size={20} className="text-neutral-900" />
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                  Edit Personal Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 text-neutral-400 hover:text-black transition-colors rounded-lg"
                aria-label="Close modal"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            {profileError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 rounded-xl">
                <MaterialIcon name="error" size={16} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              {/* Profile Photo Editor Section */}
              <div className="flex items-center gap-4 p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-neutral-900 text-white flex items-center justify-center font-bold text-xl shrink-0 border-2 border-white shadow-xs">
                  {(() => {
                    const preview = isAvatarRemoved
                      ? profile.googleImage || null
                      : editAvatarPreview || profile.image || profile.googleImage || null;

                    return preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-mono uppercase">{editName.trim().charAt(0) || "U"}</span>
                    );
                  })()}
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-900 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-2xs">
                      <MaterialIcon name="upload" size={14} />
                      <span>{editAvatarPreview || profile.image ? "Change Photo" : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleEditAvatarChange}
                        className="hidden"
                      />
                    </label>
                    {(profile.image || editAvatarPreview) && !isAvatarRemoved && (
                      <button
                        type="button"
                        onClick={handleRemoveCustomAvatar}
                        className="inline-flex items-center gap-1 py-1.5 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors"
                      >
                        <MaterialIcon name="delete" size={14} />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                  {editAvatarError && (
                    <p className="text-[10px] text-rose-600 font-medium">{editAvatarError}</p>
                  )}
                  <p className="text-[10px] text-neutral-400">
                    Supported formats: JPEG, PNG, WebP (Max 2MB)
                    {profile.googleImage && isAvatarRemoved && " · Will display your linked Google photo"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 py-2.5 px-3 text-xs text-black focus:outline-none focus:border-black rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full bg-neutral-100 border border-neutral-200 py-2.5 px-3 text-xs text-neutral-500 rounded-xl cursor-not-allowed"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Email is linked to your account security and cannot be edited.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 py-2.5 px-3 text-xs text-black focus:outline-none focus:border-black rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingProfile}
                  className="rounded-xl bg-neutral-950 text-white"
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
          <div className="relative w-full max-w-lg bg-white border border-neutral-200 p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
              <div className="flex items-center gap-2">
                <MaterialIcon name="location_on" size={20} className="text-neutral-900" />
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                  Add New Delivery Address
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(false)}
                className="p-1 text-neutral-400 hover:text-black transition-colors rounded-lg"
                aria-label="Close modal"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            {addressError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 rounded-xl">
                <MaterialIcon name="error" size={16} className="shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAddress} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 py-2 px-3 text-xs focus:outline-none focus:border-black rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 py-2 px-3 text-xs focus:outline-none focus:border-black rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="House / Flat No., Building, Street"
                  value={newAddress1}
                  onChange={(e) => setNewAddress1(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 py-2 px-3 text-xs focus:outline-none focus:border-black rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Landmark, Area"
                  value={newAddress2}
                  onChange={(e) => setNewAddress2(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 py-2 px-3 text-xs focus:outline-none focus:border-black rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 py-2 px-3 text-xs focus:outline-none focus:border-black rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 py-2 px-3 text-xs focus:outline-none focus:border-black rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-neutral-900 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    placeholder="6 digits"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 py-2 px-3 text-xs focus:outline-none focus:border-black rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultAddressCheck"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                />
                <label
                  htmlFor="defaultAddressCheck"
                  className="text-xs text-neutral-700 cursor-pointer font-medium"
                >
                  Make this my default delivery address
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingAddress}
                  className="rounded-xl bg-neutral-950 text-white"
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

