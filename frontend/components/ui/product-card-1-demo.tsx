import { ProductCard } from "@/components/ui/product-card-1";

export default function DemoOne() {
  return (
    <ProductCard
      name="Nike Air Force"
      price={129.99}
      originalPrice={169.99}
      rating={4.7}
      reviewCount={325}
      discount={25}
      freeShipping
      isNew
      isBestSeller
      colors={["#1e293b", "#f43f5e", "#0ea5e9", "#10b981"]}
      sizes={["38", "39", "40", "41", "42", "43"]}
      images={[
        "https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=1315&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1656230259229-aa2634e3352c?q=80&w=1350&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1579338559194-a162d19bf842?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ]}
    />
  );
}
