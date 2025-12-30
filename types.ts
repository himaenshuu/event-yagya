export type EventStatus = "Upcoming" | "Ongoing" | "Completed";

export interface EventUpdate {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  timestamp: string;
}

export interface ScheduleItem {
  id: string;
  day: string;
  date: string;
  rituals: {
    time: string;
    title: string;
    description: string;
  }[];
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  purpose?: string;
  timestamp: string;
  transactionId: string; // Legacy display ID (YGYA-XXXXX)
  passId: string; // Secure UUID for verification
  receiptId?: number; // Legacy sequential ID (optional)
  paymentMethod: "credit_card" | "cash" | "bank_transfer" | "mobile_payment";
  status: "Success" | "Pending" | "Failed";
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "public";
}

export interface AppState {
  updates: EventUpdate[];
  schedule: ScheduleItem[];
  donations: Donation[];
  eventInfo: {
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    status: EventStatus;
    significance: string;
  };
}
