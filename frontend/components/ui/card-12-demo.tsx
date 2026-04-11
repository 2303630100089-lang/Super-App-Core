"use client";

import { OpportunityCard, OpportunityCardProps } from '@/components/ui/card-12';

const Demo = () => {
  // Sample data to populate the card
  const opportunityData: Omit<OpportunityCardProps, 'onAccept' | 'onDecline'> = {
    status: 'Available',
    postedBy: {
      name: 'Jenifer A.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      company: 'Meta — Facebook',
      location: 'California',
    },
    salaryRange: {
      min: 35000,
      max: 45000,
    },
    deadline: '14 Oct - 2024',
    matchPercentage: 89.5,
    rating: 4.9,
    tags: ['Web Design'],
    description: 'Need Responsive Website showcase product. Modern and visually appealing design.',
    recruiter: {
      name: 'Robert T.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      company: 'Full Cycle Agency',
      location: 'Salt Lake',
    },
  };

  // Handler functions for the buttons
  const handleAccept = () => {
    console.log('Project Accepted!');
  };

  const handleDecline = () => {
    console.log('Offer Declined.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <OpportunityCard
        {...opportunityData}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  );
};

export default Demo;
