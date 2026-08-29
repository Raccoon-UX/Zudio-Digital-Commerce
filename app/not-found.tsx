import Link from "next/link";
import { ArrowLeft, ShoppingBag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-neutral-50">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 text-neutral-900 font-bold text-2xl tracking-tighter">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-neutral-600">
            The page or style collection you are looking for might have been moved, renamed, or is currently unavailable.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link href="/products" className="w-full">
            <Button className="w-full bg-black text-white hover:bg-neutral-800 flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Explore Collections
            </Button>
          </Link>

          <Link href="/stores" className="w-full">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              Find Nearby Store
            </Button>
          </Link>

          <Link href="/" className="w-full text-center text-xs text-neutral-500 hover:text-black pt-2 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
