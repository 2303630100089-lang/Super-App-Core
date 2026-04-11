// src/app/landing/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import {
  Zap,
  ShoppingBag,
  Heart,
  Car,
  UtensilsCrossed,
  Brain,
  Video,
  MessageCircle,
  Users,
  Star,
  Check,
  X,
  ArrowRight,
  Globe,
  Shield,
  TrendingUp,
} from "lucide-react";

// ─── Feature comparison data ─────────────────────────────────────────────────
const FEATURES = [
  { label: "Short-form Video (Reels/TikToks)", superApp: true, facebook: true, instagram: true, tiktok: true, twitter: false },
  { label: "Social Feed & Stories", superApp: true, facebook: true, instagram: true, tiktok: true, twitter: true },
  { label: "Marketplace / Shopping", superApp: true, facebook: true, instagram: true, tiktok: true, twitter: false },
  { label: "Dating & Matchmaking", superApp: true, facebook: false, instagram: false, tiktok: false, twitter: false },
  { label: "Ride-Hailing", superApp: true, facebook: false, instagram: false, tiktok: false, twitter: false },
  { label: "Food Delivery", superApp: true, facebook: false, instagram: false, tiktok: false, twitter: false },
  { label: "AI-Powered Master Feed", superApp: true, facebook: false, instagram: false, tiktok: true, twitter: false },
  { label: "Real-time Messaging", superApp: true, facebook: true, instagram: true, tiktok: false, twitter: true },
  { label: "Business Dashboard", superApp: true, facebook: true, instagram: false, tiktok: false, twitter: false },
  { label: "Hotel & Travel Booking", superApp: true, facebook: false, instagram: false, tiktok: false, twitter: false },
  { label: "Digital Wallet / Payments", superApp: true, facebook: false, instagram: false, tiktok: false, twitter: false },
  { label: "Live Streaming", superApp: true, facebook: true, instagram: true, tiktok: true, twitter: true },
];

const COMPETITORS = [
  { key: "superApp", name: "SuperApp", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30", logo: "🚀" },
  { key: "facebook", name: "Facebook", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", logo: "f" },
  { key: "instagram", name: "Instagram", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30", logo: "📸" },
  { key: "tiktok", name: "TikTok", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", logo: "🎵" },
  { key: "twitter", name: "X / Twitter", color: "text-neutral-300", bg: "bg-neutral-500/10 border-neutral-500/30", logo: "𝕏" },
] as const;

// ─── Core feature cards ───────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    icon: <Video className="w-6 h-6" />,
    title: "Viral Reels Feed",
    description: "An AI-ranked short-video feed that learns your taste and surfaces the most relevant content — faster than TikTok's For You page.",
    gradient: "from-rose-500/20 to-orange-500/10",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    tag: "vs TikTok",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Social Graph",
    description: "Follow friends, post stories, comment, share — a full social graph with algorithmic & chronological feed modes.",
    gradient: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    tag: "vs Instagram",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Smart Dating",
    description: "Advanced matchmaking powered by personality vectors and shared interests — swipe right on people who genuinely match you.",
    gradient: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/20",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-400",
    tag: "vs Tinder",
  },
  {
    icon: <ShoppingBag className="w-6 h-6" />,
    title: "Unified Marketplace",
    description: "Buy, sell, and discover products surfaced by the same algorithm that powers your content feed. 1-click checkout built-in.",
    gradient: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    tag: "vs Amazon",
  },
  {
    icon: <Car className="w-6 h-6" />,
    title: "Ride-Hailing",
    description: "Book rides without leaving the app. Your social context powers smarter route suggestions and carpool matching.",
    gradient: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    tag: "vs Uber",
  },
  {
    icon: <UtensilsCrossed className="w-6 h-6" />,
    title: "Food Delivery",
    description: "Order food from local restaurants, get AI-powered cuisine recommendations based on your cravings and social activity.",
    gradient: "from-orange-500/20 to-red-500/10",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    tag: "vs DoorDash",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Master Algorithm",
    description: "A unified AI brain that understands you across every feature — your ride history influences your feed, your food taste shapes your dating matches.",
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    tag: "Unique to SuperApp",
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Real-time Messaging",
    description: "Full-featured encrypted DMs and group chats that live beside your feed, commerce, and everything else — no app-switching.",
    gradient: "from-cyan-500/20 to-sky-500/10",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    tag: "vs WhatsApp",
  },
];

const STATS = [
  { value: "8", unit: "apps", label: "Replaced by SuperApp", icon: <Zap className="w-5 h-5" /> },
  { value: "1M+", unit: "", label: "Active Users", icon: <Users className="w-5 h-5" /> },
  { value: "99.9%", unit: "", label: "Uptime SLA", icon: <Shield className="w-5 h-5" /> },
  { value: "2.4×", unit: "", label: "Engagement vs. Single Apps", icon: <TrendingUp className="w-5 h-5" /> },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden w-full min-h-screen bg-[#06080F] text-white">
      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <CinematicHero />

      {/* ─── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="relative py-16 px-4 border-b border-white/5 bg-gradient-to-b from-[#06080F] to-[#0A0E1A]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-1">
                {s.icon}
              </div>
              <div className="text-4xl font-black tracking-tighter text-white">
                {s.value}<span className="text-indigo-400 text-2xl">{s.unit}</span>
              </div>
              <div className="text-sm text-neutral-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Feature Grid ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#0A0E1A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-3">Everything. One app.</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              Why download 8 apps<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">when one does it all?</span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
              SuperApp is the world&apos;s first true super-aggregator. Every feature is powered by a shared AI engine that makes each service smarter the more you use it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className={`relative rounded-3xl border ${card.border} bg-gradient-to-b ${card.gradient} p-6 flex flex-col gap-4 group hover:scale-[1.02] transition-transform duration-300`}
              >
                <div className={`w-12 h-12 rounded-2xl ${card.iconBg} border ${card.border} flex items-center justify-center ${card.iconColor}`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2 tracking-tight">{card.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{card.description}</p>
                </div>
                <div className="mt-auto">
                  <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/10 ${card.iconColor}`}>
                    {card.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison Table ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#0A0E1A] to-[#06080F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-bold uppercase tracking-widest mb-3">Head-to-head</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              SuperApp vs.<br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">The Giants</span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-xl mx-auto">
              See how SuperApp stacks up against the world&apos;s most popular platforms — all in a single comparison.
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02]">
            {/* Header */}
            <div className="grid grid-cols-6 border-b border-white/5">
              <div className="p-5 text-neutral-500 text-sm font-semibold">Feature</div>
              {COMPETITORS.map((c) => (
                <div
                  key={c.key}
                  className={`p-5 flex flex-col items-center gap-2 border-l border-white/5 ${c.key === "superApp" ? "bg-indigo-500/5" : ""}`}
                >
                  <span className={`text-2xl font-black ${c.color}`}>{c.logo}</span>
                  <span className={`text-xs font-bold tracking-wide ${c.color}`}>{c.name}</span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {FEATURES.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-6 border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                <div className="p-5 text-neutral-300 text-sm font-medium flex items-center">{row.label}</div>
                {COMPETITORS.map((c) => {
                  const val = row[c.key as keyof typeof row] as boolean;
                  return (
                    <div
                      key={c.key}
                      className={`p-5 flex items-center justify-center border-l border-white/5 ${c.key === "superApp" ? "bg-indigo-500/5" : ""}`}
                    >
                      {val ? (
                        <Check className={`w-5 h-5 ${c.key === "superApp" ? "text-indigo-400" : "text-emerald-400"}`} strokeWidth={2.5} />
                      ) : (
                        <X className="w-4 h-4 text-neutral-700" strokeWidth={2} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Score row */}
            <div className="grid grid-cols-6 bg-white/[0.02]">
              <div className="p-5 text-neutral-300 text-sm font-bold">Total Features</div>
              {COMPETITORS.map((c) => {
                const total = FEATURES.filter((f) => f[c.key as keyof typeof f] === true).length;
                return (
                  <div
                    key={c.key}
                    className={`p-5 flex items-center justify-center border-l border-white/5 ${c.key === "superApp" ? "bg-indigo-500/10" : ""}`}
                  >
                    <span className={`text-xl font-black ${c.key === "superApp" ? "text-indigo-300" : "text-neutral-400"}`}>{total}/{FEATURES.length}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Accordion */}
          <div className="md:hidden space-y-3">
            {COMPETITORS.map((c) => {
              const total = FEATURES.filter((f) => f[c.key as keyof typeof f] === true).length;
              return (
                <div key={c.key} className={`rounded-2xl border border-white/5 overflow-hidden ${c.key === "superApp" ? "border-indigo-500/30" : ""}`}>
                  <div className={`p-4 flex items-center justify-between ${c.key === "superApp" ? "bg-indigo-500/10" : "bg-white/[0.02]"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-black ${c.color}`}>{c.logo}</span>
                      <span className={`font-bold ${c.color}`}>{c.name}</span>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${c.key === "superApp" ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-neutral-400"}`}>
                      {total}/{FEATURES.length}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-2">
                    {FEATURES.map((row) => {
                      const val = row[c.key as keyof typeof row] as boolean;
                      return (
                        <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-neutral-400">{row.label}</span>
                          {val ? (
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-700 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#06080F] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-3">Loved worldwide</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              What people are saying
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I deleted TikTok, Instagram, Uber, AND DoorDash. SuperApp replaced all of them and the AI feed is actually better.",
                author: "Priya M.",
                location: "Mumbai, India",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
                stars: 5,
              },
              {
                quote: "The master algorithm is scary good. It knew I wanted sushi before I did — and surfaced a restaurant, a nearby match who loves sushi, AND a reel about Tokyo.",
                author: "James K.",
                location: "Lagos, Nigeria",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
                stars: 5,
              },
              {
                quote: "As a small business owner, the unified dashboard is a game-changer. I manage my shop, run ads, and handle deliveries all in one place.",
                author: "Sofia R.",
                location: "São Paulo, Brazil",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
                stars: 5,
              },
            ].map((t) => (
              <div key={t.author} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-neutral-300 leading-relaxed text-sm">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <img src={t.avatar} alt={t.author} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-white font-semibold text-sm">{t.author}</p>
                    <p className="text-neutral-500 text-xs flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-32 px-4 bg-gradient-to-b from-[#06080F] via-[#0A0E1A] to-[#06080F] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">Get started free</p>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
            One app.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Infinite life.
            </span>
          </h2>
          <p className="text-neutral-400 text-lg md:text-xl mb-12 max-w-xl mx-auto leading-relaxed">
            Stop juggling apps. SuperApp is your unified digital life — social, commerce, transport, food, dating, and AI in one beautifully engineered experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              Open SuperApp
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-4 bg-[#06080F]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">SuperApp</span>
            <span className="text-neutral-600 text-xs">© {new Date().getFullYear()}</span>
          </div>
          <p className="text-neutral-600 text-sm text-center">The world&apos;s first true super-aggregator. Built for the future.</p>
          <Link href="/app" className="text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition-colors flex items-center gap-1">
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
