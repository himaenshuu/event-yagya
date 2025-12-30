
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';

export const NotificationToggle: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      new Notification('Notifications Enabled', {
        body: 'You will now receive updates about the Mahayagya rituals.',
        icon: 'https://picsum.photos/seed/yagya/100/100'
      });
    }
  };

  if (permission === 'denied') {
    return (
      <button title="Notifications Blocked" className="p-2 text-red-400 cursor-not-allowed">
        <BellOff size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={requestPermission}
      title={permission === 'granted' ? "Notifications Active" : "Enable Notifications"}
      className={`p-2 rounded-full transition-all ${
        permission === 'granted' 
          ? 'text-yellow-400 bg-red-700/50' 
          : 'text-red-200 hover:bg-red-700/50'
      }`}
    >
      {permission === 'granted' ? <BellRing size={20} className="animate-pulse" /> : <Bell size={20} />}
    </button>
  );
};
