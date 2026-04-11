'use client';

import React, { useState, useEffect } from 'react';
import { SuperAppAPI } from '@/api/SuperAppClient';
import { StoryDemo } from '@/components/ui/demo';
import { XCard } from '@/components/ui/x-gradient-card';
import DockMorph from '@/components/ui/dock-morph';
import { Home, MessageCircle, Newspaper, LayoutGrid, User } from 'lucide-react';

// TIKTOK/AMAZON/TINDER - THE UNIFIED SUPER AGGREGATOR UI
export default function SuperAppDashboard() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Example Context that gets pushed to MasterAlgorithm
  const mockUserContext = {
    id: 'user_001',
    embeddingVector: [0.9, 0.8, 0.4, 0.1, 0.2] // Tech & Comedy lover
  };

  useEffect(() => {
    fetchUnifiedFeed();
  }, []);

  const fetchUnifiedFeed = async () => {
    try {
      setLoading(true);
      // Calls the /rank-feed Master Algorithm in ai-service
      const response = await SuperAppAPI.getRankedFeed(mockUserContext, 10);
      setFeedItems(response.data.data);
    } catch (err) {
      console.error('Core Backend down or MongoDB not running.', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItemCard = (item: any) => {
    switch (item.type) {
      case 'reel':
        return (
          <div key={item.id} className="relative w-full h-[600px] bg-black rounded-3xl overflow-hidden mb-6 shadow-2xl transition hover:scale-[1.02]">
            {/* Mock Reel Video Screen */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 p-6 flex flex-col justify-end">
              <h2 className="text-white text-2xl font-bold">{item.title}</h2>
              <p className="text-gray-300">🎵 Original Audio • Viral Score: {item._superScore.toFixed(2)}</p>
            </div>
            <div className="absolute right-4 bottom-20 z-20 flex flex-col gap-4 text-white">
              <button className="bg-white/20 p-3 rounded-full hover:bg-red-500 transition">❤️</button>
              <button className="bg-white/20 p-3 rounded-full hover:bg-blue-500 transition">💬</button>
            </div>
          </div>
        );
      
      case 'product':
        return (
          <div key={item.id} className="w-full bg-white rounded-3xl p-6 mb-6 shadow-xl border border-gray-100 flex items-center gap-6">
            <div className="w-32 h-32 bg-indigo-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-indigo-300 text-4xl">
              🛍️
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-800">{item.title}</h2>
              <p className="text-sm text-gray-500 mt-1">Recommended for you (Score: {item._superScore.toFixed(2)})</p>
              <button className="mt-4 bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800">
                Buy with 1-Click
              </button>
            </div>
          </div>
        );

      case 'dating':
        return (
          <div key={item.id} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-6 mb-6 shadow-xl text-white">
            <h2 className="text-2xl font-bold flex items-center gap-2">🔥 Matches Found</h2>
            <p className="mt-2 text-pink-100">{item.title} is looking for someone like you (Score: {item._superScore.toFixed(2)})</p>
            <div className="mt-4 flex gap-4">
              <button className="bg-white text-pink-600 px-6 py-2 rounded-full font-bold shadow-md">Swipe Right</button>
              <button className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-full font-bold">Skip</button>
            </div>
          </div>
        );

      case 'tweet':
        return (
          <div key={item.id} className="mb-6">
            <XCard
              link={item.link || 'https://x.com'}
              authorName={item.authorName || item.title}
              authorHandle={item.authorHandle || 'user'}
              authorImage={item.authorImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
              content={Array.isArray(item.content) ? item.content : [item.title]}
              isVerified={item.isVerified ?? false}
              timestamp={item.timestamp || ''}
              reply={item.reply}
            />
          </div>
        );

      default:
        return (
          <div key={item.id} className="w-full bg-gray-50 rounded-2xl p-6 mb-4">
            <h3 className="font-bold">{item.title}</h3>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-md">{item.type}</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-0">
      <div className="max-w-md mx-auto relative relative">
        
        {/* TOP NAVIGATION BAR */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md rounded-full shadow-sm mb-6 px-6 py-3 flex justify-between items-center border border-gray-100">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
             SuperApp
          </h1>
          <div className="flex gap-3">
             <button className="p-2 hover:bg-gray-100 rounded-full">🔔</button>
             <button className="p-2 hover:bg-gray-100 rounded-full">💬</button>
             <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
        </header>

        {/* STORIES */}
        <div className="bg-white rounded-3xl mb-6 shadow-sm border border-gray-100 overflow-hidden">
          <StoryDemo />
        </div>

        {/* FEED / CONTENT STREAM */}
        <main className="pb-24">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            feedItems.map(item => renderItemCard(item))
          )}
        </main>

        {/* BOTTOM NAVIGATION - DockMorph */}
        <DockMorph
          position="bottom"
          items={[
            { icon: Home, label: "Home", onClick: () => alert("Home clicked") },
            { icon: MessageCircle, label: "Message", onClick: () => alert("Message clicked") },
            { icon: Newspaper, label: "Feed", onClick: () => alert("Feed clicked") },
            { icon: LayoutGrid, label: "Mini App", onClick: () => alert("Mini App clicked") },
            { icon: User, label: "Profile", onClick: () => alert("Profile clicked") },
          ]}
        />

      </div>
    </div>
  );
}
