import { Link } from "react-router-dom";
import { Heart, Instagram, Facebook, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-display text-2xl font-bold mb-4">Podróżówka</h3>
            <p className="text-primary-foreground/70 mb-4 max-w-md">
              Odwrócona pocztówka z Polski. Podziękuj osobom spotkanym w podróży 
              i pokaż im piękno naszego kraju.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                aria-label="Podróżówka na Instagramie"
                className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Instagram className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="#"
                aria-label="Podróżówka na Facebooku"
                className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="mailto:kontakt@podrozowka.pl"
                aria-label="Napisz e-mail do Podróżówki"
                className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Mail className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Nawigacja</h4>
            <ul className="space-y-2 text-primary-foreground/70">
              <li><a href="/#about" className="hover:text-primary-foreground transition-colors">O projekcie</a></li>
              <li><a href="/#distribution-map" className="hover:text-primary-foreground transition-colors">Mapa</a></li>
              <li><Link to="/sklep" className="hover:text-primary-foreground transition-colors">Sklep</Link></li>
              <li><a href="/#community-gallery" className="hover:text-primary-foreground transition-colors">Społeczność</a></li>
              <li><Link to="/polityka-prywatnosci" className="hover:text-primary-foreground transition-colors">Polityka prywatności</Link></li>
              <li><Link to="/regulamin" className="hover:text-primary-foreground transition-colors">Regulamin</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2 text-primary-foreground/70">
              <li>kontakt@podrozowka.pl</li>
              <li>Polska</li>
              <li className="pt-2">
                <Link 
                  to="/sklep" 
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors font-semibold"
                >
                  Zamów Podróżówki
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/80 text-sm">
            © 2024 Podróżówka. Wszystkie prawa zastrzeżone.
          </p>
          <p className="flex items-center gap-1 text-primary-foreground/80 text-sm">
            Stworzone z <Heart className="w-4 h-4 text-primary" aria-hidden="true" /> w Polsce
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
