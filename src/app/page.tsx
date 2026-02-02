import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { PolicyQA } from "@/components/sections/policy-qa";
import { GetInvolved } from "@/components/sections/get-involved";
import { Updates } from "@/components/sections/updates";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        <PolicyQA />
        <GetInvolved />
        <Updates />
      </main>
      <Footer />
    </div>
  );
}
