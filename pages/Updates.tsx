
import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { Clock, ImageIcon } from 'lucide-react';

const UpdatesSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {[1, 2].map((i) => (
      <article key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="h-64 shimmer-bg"></div>
        <div className="p-6 space-y-4">
          <div className="h-4 w-32 shimmer-bg rounded-lg"></div>
          <div className="h-8 w-3/4 shimmer-bg rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-4 w-full shimmer-bg rounded-lg"></div>
            <div className="h-4 w-5/6 shimmer-bg rounded-lg"></div>
          </div>
        </div>
      </article>
    ))}
  </div>
);

export const Updates: React.FC<{ state: AppState }> = ({ state }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-9 w-64 shimmer-bg rounded-xl mx-auto"></div>
          <div className="h-5 w-48 shimmer-bg rounded-lg mx-auto"></div>
        </div>
        <UpdatesSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center animate-slide-up">
        <h2 className="text-3xl font-bold text-red-900 mb-2 font-serif">Ongoing Updates</h2>
        <p className="text-gray-600">Live moments from Springfield Community Center</p>
      </div>

      <div className="space-y-8">
        {state.updates.map((update, idx) => (
          <article 
            key={update.id} 
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover-lift group animate-slide-up"
            style={{ animationDelay: `${idx * 0.15}s` }}
          >
            {update.imageUrl ? (
              <div className="overflow-hidden h-64">
                <img 
                  src={update.imageUrl} 
                  alt={update.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              </div>
            ) : (
              <div className="h-64 bg-gray-50 flex flex-col items-center justify-center text-gray-200">
                <ImageIcon size={48} />
                <p className="text-xs font-black uppercase tracking-widest mt-2">No Visual Attached</p>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider mb-2">
                <Clock size={14} className="group-hover:animate-spin-slow" />
                {new Date(update.timestamp).toLocaleString()}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-red-900 transition-colors font-serif">{update.title}</h3>
              <p className="text-gray-700 leading-relaxed">{update.description}</p>
            </div>
          </article>
        ))}
      </div>
      
      {!isLoading && state.updates.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 animate-scale-in">
          <p className="text-gray-400 font-medium">No updates posted yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
};
