'use client';
import { TestimonialCarousel } from '@/components/ui/testimonial';

const items = [
  {
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop&crop=face',
    name: 'Branson Cook',
    role: 'Actor',
    accent: '#3b82f6',
    quote:
      'Radio telescope something incredible is waiting to be known billions upon billions...',
  },
  {
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=face',
    name: 'Ivy Ramirez',
    role: 'Founder',
    accent: '#10b981',
    quote:
      'We switched to Shadcn-Extras and shipped our new docs in days. Motion primitives are on point.',
  },
  {
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face',
    name: 'Takumi Aoki',
    role: 'Designer',
    accent: '#ef4444',
    quote:
      'Composable slots + Motion let me keep the exact art direction without fighting the API.',
  },
];

export default function TestimonialBasic() {
  return (
    <div className='mx-auto max-w-5xl p-6'>
      <h2 className='mb-6 text-center text-3xl font-bold'>Our Reviews</h2>
      <TestimonialCarousel
        items={items}
        autoplay
        autoplayMs={6000}
        className='bg-white dark:bg-zinc-900'
      />
    </div>
  );
}
