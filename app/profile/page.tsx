"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  User,
  MapPin,
  Package,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  LogOut,
  X,
  AlertCircle,
} from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.error?.message || "Failed to load profile.");
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Unable to connect to user service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

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
        fetchProfile();
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
    if (!confirm("Are you sure you want to remove this address?")) return;

    try {
      const res = await fetch(`/api/user/addresses/${addressId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchProfile();
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
        fetchProfile();
      }
    } catch (err) {
      console.error("Set default address error:", err);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="py-12 bg-white min-h-screen">
        <Container size="lg" className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </Container>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-16 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <AlertCircle className="h-10 w-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold uppercase text-black mb-2">Profile Error</h2>
          <p className="text-xs text-neutral-500 mb-6">{error || "Unable to load user profile."}</p>
          <Button variant="primary" size="sm" onClick={() => fetchProfile()}>
            Retry
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 bg-neutral-50 min-h-screen">
      <Container size="lg">
        {/* Profile Header Card */}
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-black text-white flex items-center justify-center text-2xl font-black uppercase">
                {profile.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                    {profile.name}
                  </h1>
                  <Badge variant="secondary" className="text-[10px]">
                    {profile.role}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{profile.email}</p>
                {profile.phone && (
                  <p className="text-xs text-neutral-500">{profile.phone}</p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>

          {/* Quick Action Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-neutral-100">
            <Link
              href="/orders"
              className="p-4 bg-neutral-50 border border-neutral-200 hover:border-black transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-black" />
                <div>
                  <span className="text-lg font-black text-black">
                    {profile._count.orders}
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Orders
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/wishlist"
              className="p-4 bg-neutral-50 border border-neutral-200 hover:border-black transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-black" />
                <div>
                  <span className="text-lg font-black text-black">
                    {profile._count.wishlist}
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Saved Items
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/stores"
              className="col-span-2 sm:col-span-1 p-4 bg-neutral-50 border border-neutral-200 hover:border-black transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-black" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    Find Stores
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Retail Locations
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Address Book Section */}
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-6">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-black">
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
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Address
            </Button>
          </div>

          {profile.addresses.length === 0 ? (
            <div className="text-center py-10 bg-neutral-50 border border-neutral-200">
              <MapPin className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase text-black">
                No saved addresses yet
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 max-w-xs mx-auto mb-4">
                Add a delivery address to speed up your checkout process.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddAddressOpen(true)}
              >
                Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-4 border relative flex flex-col justify-between ${
                    addr.isDefault
                      ? "border-black bg-neutral-50/50"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="space-y-1">
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
                      Phone: {addr.phone}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-neutral-100 text-xs">
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-neutral-500 hover:text-black text-[11px] uppercase font-bold"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Primary Address
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1"
                      title="Delete Address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* Add Address Modal */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddAddressOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white border border-neutral-200 p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-black">
                Add New Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(false)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addressError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {addressError}
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
                    className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
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
                  className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
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
                  className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
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
                    className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
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
                    className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
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
                    className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
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

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
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
