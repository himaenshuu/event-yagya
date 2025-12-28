import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppState, Donation, EventUpdate } from "./types";
import { INITIAL_STATE } from "./constants";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Schedule } from "./pages/Schedule";
import { Updates } from "./pages/Updates";
import { DonationPage } from "./pages/Donation";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { appwriteService } from "./services/appwrite";

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("community_event_state");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Don't load donations from localStorage - always fetch from DB
      return {
        ...parsed,
        donations: [], // Empty - will be loaded from DB by admin
      };
    }
    return INITIAL_STATE;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("admin_session") === "active";
  });

  // Register Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator && !import.meta.env.DEV) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
    }
  }, []);

  useEffect(() => {
    // Save only updates and eventInfo - donations are stored in DB only
    const stateToSave = {
      updates: state.updates,
      schedule: state.schedule,
      eventInfo: state.eventInfo,
      donations: [], // Don't persist donations to localStorage
    };
    localStorage.setItem("community_event_state", JSON.stringify(stateToSave));
  }, [state]);

  const triggerLocalNotification = (title: string, body: string) => {
    if (Notification.permission === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Fix: Use type assertion to any as 'vibrate' is a valid ServiceWorker notification property but often missing from base NotificationOptions types
        registration.showNotification(title, {
          body,
          icon: "https://picsum.photos/seed/community/100/100",
          vibrate: [200, 100, 200],
          tag: "event-update",
          renotify: true,
        } as any);
      });
    }
  };

  const handleLogin = async (password: string) => {
    try {
      // Call serverless admin auth API
      const response = await fetch("/api/admin-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAdmin(true);
        // Store session token securely
        localStorage.setItem("admin_session", data.sessionToken);

        // Fetch donations from cloud and sync with local state
        const cloudDonations = await appwriteService.fetchAllDonations();
        if (cloudDonations.length > 0) {
          setState((prev) => {
            // Merge cloud donations with local, avoiding duplicates by passId
            const existingPassIds = new Set(
              prev.donations.map((d) => d.passId)
            );
            const newDonations = cloudDonations.filter(
              (d) => !existingPassIds.has(d.passId)
            );

            return {
              ...prev,
              donations: [...newDonations, ...prev.donations],
            };
          });
        }
        return true;
      } else {
        // Authentication failed
        const serverMsg = data?.message || data?.error;
        const errorMessage =
          data?.error === "Too many authentication attempts"
            ? `Too many failed attempts. ${
                data?.message || "Please wait and try again."
              }`
            : serverMsg || "Invalid admin credentials";
        alert(errorMessage);
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Admin authentication error:", error);
      }
      alert(
        "Authentication failed. Please check your connection and try again."
      );
      return false;
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("admin_session");
  };

  const handleAddDonation = (donation: Donation) => {
    // Donation is saved to database in Donation component
    // Admin dashboard will fetch from DB, so no need to add to state
    if (import.meta.env.DEV) {
      console.log("Donation saved to database:", donation.passId);
    }
  };

  const handleAddUpdate = (update: EventUpdate) => {
    setState((prev) => ({
      ...prev,
      updates: [update, ...prev.updates],
    }));
    // Trigger local notification for the new update
    triggerLocalNotification("New Ritual Update", update.title);
  };

  const handleRemoveUpdate = (id: string) => {
    setState((prev) => ({
      ...prev,
      updates: prev.updates.filter((u) => u.id !== id),
    }));
  };

  const handleUpdateStatus = (status: any) => {
    const oldStatus = state.eventInfo.status;
    setState((prev) => ({
      ...prev,
      eventInfo: { ...prev.eventInfo, status },
    }));
    if (oldStatus !== status) {
      triggerLocalNotification(
        "Event Status Changed",
        `The event is now ${status}`
      );
    }
  };

  return (
    <HashRouter>
      <Layout isAdmin={isAdmin} logout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home state={state} />} />
          <Route path="/schedule" element={<Schedule state={state} />} />
          <Route path="/updates" element={<Updates state={state} />} />
          <Route
            path="/donate"
            element={<DonationPage onDonate={handleAddDonation} />}
          />

          <Route
            path="/admin/login"
            element={
              isAdmin ? (
                <Navigate to="/admin/dashboard" />
              ) : (
                <AdminLogin onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              isAdmin ? (
                <AdminDashboard
                  state={state}
                  onAddUpdate={handleAddUpdate}
                  onRemoveUpdate={handleRemoveUpdate}
                  onUpdateStatus={handleUpdateStatus}
                />
              ) : (
                <Navigate to="/admin/login" />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
