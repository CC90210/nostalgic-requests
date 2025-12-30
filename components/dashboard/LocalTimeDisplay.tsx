"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";

interface LocalTimeDisplayProps {
  start: string;
  end?: string;
  simple?: boolean;
}

export default function LocalTimeDisplay({ start, end, simple = false }: LocalTimeDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
     return <div className="h-4 w-24 bg-gray-800 animate-pulse rounded mt-1"></div>;
  }

  const s = new Date(start);
  
  if (simple) {
     // List View format: "Fri, Dec 29, 9:00 PM EST"
     const str = s.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
     });
     return <p className="text-gray-500 text-sm mt-2">{str}</p>;
  }

  // Detail View format
  const dateStr = s.toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "long", 
    day: "numeric",
    year: "numeric" 
  });

  const timeStart = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  
  let timeStr = timeStart;
  if (end) {
      const e = new Date(end);
      const timeEnd = e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
      timeStr = `${timeStart} - ${timeEnd}`;
  } else {
      timeStr = `${timeStart} (${new Intl.DateTimeFormat().resolvedOptions().timeZone})`;
  }

  return (
    <div className="space-y-1">
        <p className="text-white font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            {dateStr}
        </p>
        <p className="text-gray-300 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-purple-400" />
            {timeStr}
        </p>
    </div>
  );
}
