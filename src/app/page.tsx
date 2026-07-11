import { Nav } from "@/components/Nav";
import { HeroSection } from "@/components/HeroSection";
import { ProductDemoSection } from "@/components/ProductDemoSection";
import { DoorwaySection } from "@/components/DoorwaySection";
import { PhiSection } from "@/components/PhiSection";
import { WaitlistSection } from "@/components/WaitlistSection";

export default function Home() {
  return (
    <main className="bg-black text-white">
      <Nav />
      <HeroSection />
      <ProductDemoSection />
      <DoorwaySection />
      <PhiSection />
      <WaitlistSection />
    </main>
  );
}
