"use client";

import { OfferCarousel, type Offer } from "@/components/ui/offer-carousel";

const sampleOffers: Offer[] = [
  {
    id: 1,
    imageSrc: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1966&auto=format&fit=crop",
    imageAlt: "International travel landmarks collage",
    tag: "Discount",
    title: "Up to ₹3000 OFF",
    description: "On International Flights.",
    brandLogoSrc: "https://static.twidpay.com/co/mobile_app_images/brand_logos/square/easemytripsquare.png?size=40",
    brandName: "Ease My Trip",
    promoCode: "EMTWID",
    href: "#",
  },
  {
    id: 2,
    imageSrc: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1998&auto=format&fit=crop",
    imageAlt: "A delicious looking burger",
    tag: "Discount",
    title: "Snack more. Save more.",
    description: "Get ₹75 OFF on purchases of ₹299 or more.",
    brandLogoSrc: "https://static.twidpay.com/co/mobile_app_images/brand_logos/square/mcdonaldssquare.png?size=40",
    brandName: "McD",
    promoCode: "TWID75",
    href: "#",
  },
  {
    id: 3,
    imageSrc: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop",
    imageAlt: "Logos of popular streaming services",
    tag: "Discount",
    title: "Flat ₹550 OFF on Timesprime",
    description: "Exclusive offer on Times Prime Membership.",
    brandLogoSrc: "https://static.twidpay.com/co/mobile_app_images/brand_logos/square/timesprimesquare.png?size=40",
    brandName: "Timesprime",
    promoCode: "TWID550",
    href: "#",
  },
  {
    id: 4,
    imageSrc: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2070&auto=format&fit=crop",
    imageAlt: "A person holding a phone with a payment app",
    tag: "Cashback",
    title: "10% Instant Cashback",
    description: "On RuPay Credit Card transactions.",
    brandLogoSrc: "https://static.twidpay.com/co/mobile_app_images/icons/rupay_rcc.png?size=40",
    brandName: "Rupay CC",
    promoCode: "RCC10",
    href: "#",
  },
  {
    id: 5,
    imageSrc: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop",
    imageAlt: "Gourmet food on a plate",
    tag: "Offer",
    title: "Flat 20% OFF",
    description: "On dining at partner restaurants.",
    brandLogoSrc: "https://twidpay.com/assets/new-square-logos/swiggysquare.webp?size=40",
    brandName: "Dineout",
    promoCode: "DINE20",
    href: "#",
  },
];

export default function OfferCarouselDemo() {
  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-6xl">
        <h2 className="text-3xl font-bold mb-6 text-foreground">Deals of the Day</h2>
        <OfferCarousel offers={sampleOffers} />
      </div>
    </div>
  );
}
