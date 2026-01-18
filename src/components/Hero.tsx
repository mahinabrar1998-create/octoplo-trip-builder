import mascot from "@/assets/octoplo-mascot.png";
const Hero = () => {
  return <section className="pt-8 pb-16 md:pt-12 px-6 py-[20px] md:pb-[24px]">
      <div className="max-w-4xl mx-auto text-center">
        {/* Mascot */}
        <div className="mb-4 md:mb-6">
          <img src={mascot} alt="Octoplo mascot - a friendly orange octopus holding a globe and phone" className="w-48 h-48 md:w-64 md:h-64 mx-auto animate-float" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
          Plan trips you'll never forget.
        </h1>

        {/* Subheadline */}
        
      </div>
    </section>;
};
export default Hero;