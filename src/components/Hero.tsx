import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-poland.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Piękny krajobraz Polski z Tatrami w tle"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Quote from documentation */}
          <p className="italic text-primary-foreground/80 text-sm md:text-base mb-4 animate-fade-up">
            „Dla mnie podróżowanie jest jak oddychanie. Muszę podróżować, żeby żyć"
          </p>
          
          <span className="inline-block px-4 py-2 bg-primary/90 text-primary-foreground rounded-full text-sm font-medium mb-6 animate-fade-up">
            Odwrócona pocztówka z Polski
          </span>
          
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Podróżówka — Odwrócona pocztówka z Polski
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-4 leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Pocztówka + Podróż = Podróżówka
          </p>
          
          <p className="text-base md:text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-up" style={{ animationDelay: "0.25s" }}>
            Fizyczne podziękowanie, które zabierasz ze sobą i dajesz w prezencie. 
            Jest podziękowaniem za życzliwość, pomoc, a także sposobem na poznawanie Polski przez świat.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Link 
              to="/sklep"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-elevated hover:shadow-card"
            >
              Przeglądaj wzory
            </Link>
            <a 
              href="/#about"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30 rounded-lg font-semibold hover:bg-primary-foreground/30 transition-all backdrop-blur-sm"
            >
              Dowiedz się więcej
            </a>
          </div>

          {/* Stats - Updated according to documentation: 32 designs, 16 countries */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">16</p>
              <p className="text-sm text-primary-foreground/70 mt-1">języków</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">10</p>
              <p className="text-sm text-primary-foreground/70 mt-1">wzorów</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">2k+</p>
              <p className="text-sm text-primary-foreground/70 mt-1">sprzedanych</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-foreground/70 rounded-full mt-2 animate-pulse-soft" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
