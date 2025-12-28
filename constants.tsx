import React from "react";
import { AppState } from "./types";

export const INITIAL_STATE: AppState = {
  updates: [
    {
      id: "1",
      title: "Opening Ceremony Commenced",
      description:
        "The festival has started with thousands of participants attending the welcome ceremony.",
      imageUrl: "https://picsum.photos/seed/opening/800/400",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Venue Setup Complete",
      description:
        "The main event hall at Springfield Community Center is now ready for all scheduled activities.",
      imageUrl: "https://picsum.photos/seed/venue/800/400",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  schedule: [
    {
      id: "d1",
      day: "Day 1",
      date: "2026-02-03",
      rituals: [
        {
          time: "06:00 AM",
          title: "Opening Ceremony",
          description: "Welcome address and program inauguration.",
        },
        {
          time: "10:00 AM",
          title: "Cultural Program",
          description: "Traditional music and dance performances.",
        },
      ],
    },
    {
      id: "d2",
      day: "Day 2",
      date: "2026-02-04",
      rituals: [
        {
          time: "07:00 AM",
          title: "Community Breakfast",
          description: "Complimentary breakfast for all participants.",
        },
        {
          time: "06:00 PM",
          title: "Evening Gala",
          description: "Grand evening celebration with lights and music.",
        },
      ],
    },
  ],
  donations: [],
  eventInfo: {
    title: "Annual Community Festival",
    location: "Springfield Community Center",
    startDate: "2026-02-03",
    endDate: "2026-02-10",
    status: "Upcoming",
    significance:
      "This community gathering brings people together for charitable activities, cultural programs, and community service. It promotes harmony, wellness, and social bonding through various engaging activities and workshops.",
  },
};
