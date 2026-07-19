import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Quote, MapPin, Calendar } from "lucide-react";

interface RecipientConnection {
  id: string;
  recipient_name: string;
  recipient_message: string | null;
  registered_at: string;
  inventory_units: {
    card_designs: {
      countries: {
        name_pl: string;
      } | null;
    } | null;
  } | null;
}

const fetchConnections = async (): Promise<RecipientConnection[]> => {
  const { data, error } = await supabase
    .from("recipient_registrations")
    .select(`
      id, recipient_name, recipient_message, registered_at,
      inventory_units(card_designs(countries(name_pl)))
    `)
    .not("recipient_message", "is", null)
    .order("registered_at", { ascending: false })
    .limit(9);

  if (error) throw error;
  return (data ?? []) as unknown as RecipientConnection[];
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const ConnectionsGallery = () => {
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["connections-gallery"],
    queryFn: fetchConnections,
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse text-muted-foreground">Ładowanie galerii relacji...</div>
        </div>
      </section>
    );
  }

  if (connections.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
            Relacje
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Głosy ze Świata
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Wiadomości od osób, które otrzymały Podróżówkę.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((c: RecipientConnection, index: number) => {
            const countryName =
              c.inventory_units?.card_designs?.countries?.name_pl ?? null;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                viewport={{ once: true }}
              >
                <Card className="h-full flex flex-col hover:shadow-card transition-shadow">
                  <CardContent className="flex flex-col flex-1 p-6">
                    <Quote className="w-5 h-5 text-accent/40 mb-3 flex-shrink-0" />

                    <p className="italic text-foreground leading-relaxed line-clamp-4 mb-auto">
                      „{c.recipient_message}"
                    </p>

                    <div className="mt-5 pt-4 border-t border-border space-y-1.5">
                      <p className="font-semibold text-foreground">
                        {c.recipient_name}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {countryName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {countryName}
                          </span>
                        )}
                        {c.registered_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(c.registered_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ConnectionsGallery;
