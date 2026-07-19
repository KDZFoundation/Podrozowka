import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Medal, Globe, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MissionUnit {
  id: string;
  card_design_id: string;
  card_designs: {
    country_id: string;
    countries: {
      name_pl: string;
    } | null;
  } | null;
  recipient_registrations: { id: string }[] | null;
}

const CulturalMissions = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["cultural-missions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: units, error } = await supabase
        .from("inventory_units")
        .select(`
          id,
          card_design_id,
          card_designs!inventory_units_card_design_id_fkey (
            country_id,
            countries!designs_country_id_fkey ( name_pl )
          ),
          recipient_registrations ( id )
        `)
        .eq("traveler_user_id", user!.id)
        .not("recipient_registrations", "is", null);

      if (error) throw error;

      const typedUnits = (units ?? []) as unknown as MissionUnit[];
      const registered = typedUnits.filter(
        (u) => u.recipient_registrations && u.recipient_registrations.length > 0
      );

      const totalRegistered = registered.length;
      const uniqueCountries = new Set(
        registered.map((u) => u.card_designs?.country_id).filter(Boolean)
      ).size;

      return { totalRegistered, uniqueCountries };
    },
  });

  const totalRegistered = data?.totalRegistered ?? 0;
  const uniqueCountries = data?.uniqueCountries ?? 0;

  const missions = [
    {
      icon: Medal,
      title: "Pierwszy Krok",
      description: "Zarejestruj swoją pierwszą kartkę",
      current: Math.min(totalRegistered, 1),
      goal: 1,
    },
    {
      icon: Globe,
      title: "Obywatel Świata",
      description: "Dotrzyj do 3 różnych krajów",
      current: Math.min(uniqueCountries, 3),
      goal: 3,
    },
    {
      icon: Trophy,
      title: "Wpływowy Ambasador",
      description: "Zarejestruj łącznie 10 kartek",
      current: Math.min(totalRegistered, 10),
      goal: 10,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Misje Kulturowe</h3>
      {missions.map((m) => {
        const pct = Math.round((m.current / m.goal) * 100);
        const completed = pct >= 100;
        const Icon = m.icon;
        return (
          <Card key={m.title}>
            <CardContent className="flex items-center gap-4 p-4">
              <Icon
                className={`h-8 w-8 shrink-0 ${completed ? "text-yellow-500" : "text-muted-foreground"}`}
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{m.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {m.current}/{m.goal}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{m.description}</p>
                <Progress value={pct} className="h-2" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CulturalMissions;
