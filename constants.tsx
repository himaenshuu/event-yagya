
import React from 'react';
import { AppState } from './types';

export const INITIAL_STATE: AppState = {
  updates: [
    {
      id: '1',
      title: 'Kalash Yatra Commenced',
      description: 'The auspicious Kalash Yatra has started with thousands of devotees participating.',
      imageUrl: 'https://picsum.photos/seed/kalash/800/400',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Mandap Preparation Complete',
      description: 'The Yagya Mandap at Tetarpur is now ready for the main rituals.',
      imageUrl: 'https://picsum.photos/seed/mandap/800/400',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  schedule: [
    {
      id: 'd1',
      day: 'Day 1',
      date: '2024-11-20',
      rituals: [
        { time: '06:00 AM', title: 'Kalash Sthapana', description: 'Initial ritual to welcome the divine energy.' },
        { time: '10:00 AM', title: 'Devi Avahan', description: 'Invocation of Goddess Durga.' }
      ]
    },
    {
      id: 'd2',
      day: 'Day 2',
      date: '2024-11-21',
      rituals: [
        { time: '07:00 AM', title: 'Satchandi Paath', description: 'Continuous recitation of Durga Saptashati.' },
        { time: '06:00 PM', title: 'Maha Aarti', description: 'Grand evening prayer with lights.' }
      ]
    }
  ],
  donations: [],
  eventInfo: {
    title: 'Maha Satchandi Mahayagya',
    location: 'Tetarpur, Siswar',
    startDate: '2024-11-20',
    endDate: '2024-11-29',
    status: 'Upcoming',
    significance: 'The Satchandi Mahayagya is a sacred fire ritual dedicated to Goddess Chandi. It is performed for peace, prosperity, and the removal of obstacles for the entire community. Reciting the Durga Saptashati 100 times during this Yagya creates an immense spiritual vibration.'
  }
};
