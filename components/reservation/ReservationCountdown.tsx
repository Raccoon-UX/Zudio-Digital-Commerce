"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface ReservationCountdownProps {
  expiresAt: string;
  isExpired: boolean;
  onExpire?: () => void;
}

export const ReservationCountdown: React.FC<ReservationCountdownProps> = ({
  expiresAt,
  isExpired,
  onExpire,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: isExpired,
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(expiresAt).getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.expired || isExpired) {
    return (
      <div className="p-3 bg-neutral-100 border border-neutral-300 text-neutral-600 text-xs flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 text-neutral-500" />
        <span className="font-bold uppercase tracking-wider">
          Reservation Window Expired
        </span>
      </div>
    );
  }

  const formatUnit = (val: number) => val.toString().padStart(2, "0");

  return (
    <div className="p-4 bg-black text-white text-center space-y-1">
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        <Clock className="h-3.5 w-3.5 text-amber-400" />
        <span>Hold Window Remaining</span>
      </div>

      <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-white">
        {formatUnit(timeLeft.hours)}:{formatUnit(timeLeft.minutes)}:{formatUnit(timeLeft.seconds)}
      </div>

      <p className="text-[10px] text-neutral-400">
        Collect item in-store before countdown ends
      </p>
    </div>
  );
};

export default ReservationCountdown;
