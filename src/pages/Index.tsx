import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EntryCards from "@/components/EntryCards";
import Features from "@/components/Features";
import BackgroundIcons from "@/components/BackgroundIcons";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundIcons />
      <Header />
      <main className="relative z-10">
        <Hero />
        <EntryCards />
        <Features />
      </main>
    </div>
  );
};

export default Index;
