'use client';

import React from 'react';
import { ImageSwiper } from '@/components/ui/image-swiper';

// Unsplash stock images (people / portraits – relevant for Tinder / random-user / Omegle-style features)
const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&h=800&fit=crop',
].join(',');

export default function ImageSwiperDemoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Image Swiper</h1>
        <p className="text-gray-500 text-sm mt-1">Drag or swipe to cycle through cards</p>
      </div>

      <ImageSwiper images={DEMO_IMAGES} />

      <p className="text-xs text-gray-400">← swipe left or right →</p>
    </div>
  );
}
