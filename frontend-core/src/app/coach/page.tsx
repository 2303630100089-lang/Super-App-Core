"use client";

import { useState } from "react";
import { CoachSchedulingCard } from "@/components/ui/coach-scheduling-card";

export default function Demo() {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{day: string, time: string} | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const handleTimeSlotSelect = (day: string, time: string) => {
    setSelectedTimeSlot({ day, time });
    console.log(`Selected: ${day} at ${time}`);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    console.log(`Location changed to: ${location}`);
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    console.log(`Week navigation: ${direction}`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex justify-center">
          <CoachSchedulingCard
            onTimeSlotSelect={handleTimeSlotSelect}
            onLocationChange={handleLocationChange}
            onWeekChange={handleWeekChange}
          />
        </div>
      </div>
    </div>
  );
}
