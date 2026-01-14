import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EntryCards from "@/components/EntryCards";
import Features from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <EntryCards />
        <Features />
      </main>
    </div>
  );
};

export default Index;
