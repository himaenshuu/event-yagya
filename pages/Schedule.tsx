import React, { useState, useEffect } from "react";
import { AppState } from "../types";
import { Calendar, Clock, ChevronRight } from "lucide-react";

const ScheduleSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {[1, 2].map((day) => (
      <div key={day} className="relative">
        <div className="sticky top-16 z-10 bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center mb-4">
          <div className="space-y-2">
            <div className="h-6 w-24 shimmer-bg rounded-lg"></div>
            <div className="h-4 w-32 shimmer-bg rounded-lg"></div>
          </div>
          <div className="h-8 w-8 shimmer-bg rounded-full"></div>
        </div>
        <div className="grid gap-4 ml-4 pl-4 border-l-2 border-gray-100">
          {[1, 2, 3].map((ritual) => (
            <div
              key={ritual}
              className="bg-white p-5 rounded-xl border border-gray-100 flex gap-4"
            >
              <div className="min-w-[80px] space-y-2 flex flex-col items-center justify-center">
                <div className="h-4 w-4 shimmer-bg rounded-full"></div>
                <div className="h-4 w-12 shimmer-bg rounded-lg"></div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="h-5 w-2/3 shimmer-bg rounded-lg"></div>
                <div className="h-4 w-full shimmer-bg rounded-lg"></div>
              </div>
              <div className="h-6 w-6 shimmer-bg rounded-lg self-center"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const Schedule: React.FC<{ state: AppState }> = ({ state }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-9 w-48 shimmer-bg rounded-xl mx-auto"></div>
          <div className="h-5 w-64 shimmer-bg rounded-lg mx-auto"></div>
        </div>
        <ScheduleSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center animate-slide-up">
        <h2 className="text-3xl font-bold text-red-900 mb-2 font-serif">
          Event Schedule
        </h2>
        <p className="text-gray-600">Daily activities and event timings</p>
      </div>

      <div className="space-y-8">
        {state.schedule.map((day, dayIdx) => (
          <div
            key={day.id}
            className="relative animate-slide-up"
            style={{ animationDelay: `${dayIdx * 0.1}s` }}
          >
            <div className="sticky top-16 z-10 bg-red-50/95 backdrop-blur-md p-4 rounded-xl border border-red-100 flex justify-between items-center mb-4 shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-red-800 font-serif">
                  {day.day}
                </h3>
                <p className="text-sm text-red-600">
                  {new Date(day.date).toLocaleDateString("en-IN", {
                    dateStyle: "long",
                  })}
                </p>
              </div>
              <Calendar className="text-red-300 animate-pulse" />
            </div>

            <div className="grid gap-4 ml-4 pl-4 border-l-2 border-red-200">
              {day.rituals.map((ritual, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex gap-4 hover-lift active:scale-[0.98] transition-all group"
                >
                  <div className="flex flex-col items-center justify-center min-w-[80px] text-red-700 font-bold group-hover:scale-110 transition-transform">
                    <Clock size={18} className="mb-1" />
                    <span className="text-sm uppercase">{ritual.time}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-red-800 transition-colors font-serif">
                      {ritual.title}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {ritual.description}
                    </p>
                  </div>
                  <div className="ml-auto self-center group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="text-gray-300 group-hover:text-red-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
