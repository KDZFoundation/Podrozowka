import { motion } from "framer-motion";
import { Heart, Globe, Users, Sparkles } from "lucide-react";
import polishArtImage from "@/assets/polish-art.jpg";

const features = [
  {
    icon: Heart,
    title: "Osobiste podziękowanie",
    description: "Wręcz coś wyjątkowego zamiast zwykłej wizytówki czy napiwku."
  },
  {
    icon: Globe,
    title: "Ambasador Polski",
    description: "Pokaż światu piękno naszego kraju poprzez sztukę i fotografię."
  },
  {
    icon: Users,
    title: "Budowanie relacji",
    description: "Twórz autentyczne więzi międzykulturowe podczas swoich podróży."
  },
  {
    icon: Sparkles,
    title: "Unikalna pamiątka",
    description: "Każda Podróżówka to dzieło sztuki, które zostanie zapamiętane."
  }
];

const About = () => {
  return (
    <section id="about" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                O projekcie
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                Odwrócona pocztówka – 
                <span className="text-primary"> nowy sposób</span> na podziękowanie
              </h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Podróżówka to wyjątkowa koncepcja "odwróconej pocztówki". Zamiast wysyłać 
                pocztówki do domu, zabierasz je ze sobą i wręczasz jako podziękowanie za życzliwość, 
                pomoc, lub po prostu jako miły gest dla osób spotkanych w podróży.
              </p>
              <p className="text-muted-foreground mb-4">
                Każda karta prezentuje piękno Polski – krajobrazy, architekturę, dzieła polskich artystów 
                – i zawiera napis "Dziękuję" lub "Pozdrowienia" w języku odbiorcy.
              </p>
              <p className="text-muted-foreground mb-8 italic text-sm">
                Na odwrocie każdej Podróżówki znajdziesz mapę Europy z zaznaczoną Polską, 
                miejsce na wiadomość i informację o autorze fotografii.
              </p>

              {/* Features grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-3 p-4 bg-secondary rounded-xl"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-elevated">
              <img
                src={polishArtImage}
                alt="Polska sztuka ludowa - wycinanka"
                className="w-full aspect-square object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
            </div>

            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-card max-w-xs">
              <p className="font-display text-sm text-muted-foreground mb-2">
                Inspirowane tradycją
              </p>
              <p className="text-foreground font-medium">
                Wzory czerpią z polskiej sztuki ludowej, wycinanek i tradycyjnych motywów.
              </p>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute bottom-1/4 -right-8 w-16 h-16 bg-accent/20 rounded-full blur-xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
