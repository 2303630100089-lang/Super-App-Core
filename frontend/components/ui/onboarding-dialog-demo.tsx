"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

const ONBOARDING_IMAGE =
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80";

const stepContent = [
  {
    title: "Welcome to SuperApp",
    description:
      "Discover a powerful all-in-one platform — chat, rides, food delivery, marketplace, and much more.",
  },
  {
    title: "Personalised Experience",
    description:
      "Switch between Personal and Business modes to unlock tools tailored to how you use the app.",
  },
  {
    title: "Stay Connected",
    description:
      "Real-time messaging, snaps, stories, live video, and random chat — all in one unified inbox.",
  },
  {
    title: "Ready to Explore?",
    description:
      "Tap any mini-app from the Apps grid to get started. Your journey begins now.",
  },
];

export function OnboardingDialog() {
  const [step, setStep] = useState(1);
  const totalSteps = stepContent.length;

  const handleContinue = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setStep(1);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">App Tour</Button>
      </DialogTrigger>
      <DialogContent className="gap-0 p-0 [&>button:last-child]:text-white">
        {/* Hero image */}
        <div className="p-2">
          <img
            className="w-full rounded-lg object-cover"
            src={ONBOARDING_IMAGE}
            width={382}
            height={216}
            alt="SuperApp feature highlight"
          />
        </div>

        <div className="space-y-6 px-6 pb-6 pt-3">
          <DialogHeader>
            <DialogTitle>{stepContent[step - 1].title}</DialogTitle>
            <DialogDescription>{stepContent[step - 1].description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            {/* Step dots */}
            <div className="flex justify-center space-x-1.5 max-sm:order-1">
              {[...Array(totalSteps)].map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-primary transition-opacity",
                    index + 1 === step ? "opacity-100" : "opacity-20",
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Skip
                </Button>
              </DialogClose>
              {step < totalSteps ? (
                <Button className="group" type="button" onClick={handleContinue}>
                  Next
                  <ArrowRight
                    className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button type="button">Get Started</Button>
                </DialogClose>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
