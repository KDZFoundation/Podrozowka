import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Country {
  id: string;
  iso2: string;
  name_pl: string;
}

interface CardDesign {
  id: string;
  country_id: string;
  language_code: string;
  view_no: number;
  title: string | null;
  thank_you_text: string | null;
  image_front_url: string | null;
  active: boolean;
  country_name?: string;
}

interface AdminCardDesignJoin {
  id: string;
  country_id: string;
  language_code: string;
  view_no: number;
  title: string | null;
  thank_you_text: string | null;
  image_front_url: string | null;
  active: boolean;
  countries: {
    name_pl: string;
  } | null;
}

const AdminCardDesigns = () => {
  const [designs, setDesigns] = useState<CardDesign[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const { toast } = useToast();

  const [form, setForm] = useState({
    country_id: '', language_code: 'pl', view_no: 1,
    title: '', thank_you_text: '', image_front_url: '', active: true,
  });

  const fetchData = useCallback(async () => {
    const [{ data: designsData }, { data: countriesData }] = await Promise.all([
      supabase.from('card_designs').select('*, countries!inner(name_pl)').order('country_id').order('view_no'),
      supabase.from('countries').select('id, iso2, name_pl').order('name_pl'),
    ]);

    if (designsData) {
      const typedDesigns = designsData as unknown as AdminCardDesignJoin[];
      setDesigns(typedDesigns.map((d: AdminCardDesignJoin) => ({
        ...d,
        country_name: d.countries?.name_pl,
      })));
    }
    if (countriesData) setCountries(countriesData as Country[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm({ country_id: '', language_code: 'pl', view_no: 1, title: '', thank_you_text: '', image_front_url: '', active: true });
    setEditingId(null);
    setShowAdd(false);
  };

  const handleSave = async () => {
    if (!form.country_id || !form.title) {
      toast({ title: "Podaj kraj i tytuł wzoru", variant: "destructive" });
      return;
    }

    const payload = {
      country_id: form.country_id,
      language_code: form.language_code,
      view_no: form.view_no,
      title: form.title,
      thank_you_text: form.thank_you_text || null,
      image_front_url: form.image_front_url || null,
      active: form.active,
    };

    if (editingId) {
      const { error } = await supabase.from('card_designs').update(payload).eq('id', editingId);
      if (error) {
        toast({ title: "Błąd zapisu", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Wzór zaktualizowany" });
        resetForm();
        fetchData();
      }
    } else {
      const { error } = await supabase.from('card_designs').insert(payload);
      if (error) {
        toast({ title: "Błąd dodawania", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Wzór dodany" });
        resetForm();
        fetchData();
      }
    }
  };

  const handleEdit = (d: CardDesign) => {
    setForm({
      country_id: d.country_id,
      language_code: d.language_code,
      view_no: d.view_no,
      title: d.title || '',
      thank_you_text: d.thank_you_text || '',
      image_front_url: d.image_front_url || '',
      active: d.active,
    });
    setEditingId(d.id);
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('card_designs').delete().eq('id', id);
    if (error) {
      toast({ title: "Błąd usuwania", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Wzór usunięty" });
      fetchData();
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('card_designs').update({ active: !active }).eq('id', id);
    fetchData();
  };

  const filtered = filterCountry === 'all' ? designs : designs.filter(d => d.country_id === filterCountry);

  if (isLoading) return <div className="animate-pulse text-muted-foreground text-center py-8">Ładowanie...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" /> Wzory kartek ({designs.length})
        </h2>
        <div className="flex items-center gap-2">
          <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-1.5 bg-background border border-input rounded-lg text-sm">
            <option value="all">Wszystkie kraje</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name_pl} ({c.iso2})</option>)}
          </select>
          <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Dodaj wzór
          </Button>
        </div>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 shadow-soft border border-border space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Kraj *</label>
              <select value={form.country_id} onChange={(e) => setForm({ ...form, country_id: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm">
                <option value="">Wybierz kraj</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name_pl}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Język</label>
              <Input value={form.language_code} onChange={(e) => setForm({ ...form, language_code: e.target.value })} placeholder="pl" maxLength={5} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nr widoku *</label>
              <Input type="number" value={form.view_no} onChange={(e) => setForm({ ...form, view_no: parseInt(e.target.value) || 1 })} min={1} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tytuł *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brama Brandenburska" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Tekst podziękowania</label>
              <Textarea value={form.thank_you_text} onChange={(e) => setForm({ ...form, thank_you_text: e.target.value })} rows={2} placeholder="Dziękujemy za..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL obrazka (front)</label>
              <Input value={form.image_front_url} onChange={(e) => setForm({ ...form, image_front_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
              Aktywny
            </label>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={resetForm}><X className="w-4 h-4 mr-1" />Anuluj</Button>
            <Button size="sm" onClick={handleSave}><Check className="w-4 h-4 mr-1" />{editingId ? 'Zapisz' : 'Dodaj'}</Button>
          </div>
        </motion.div>
      )}

      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Kraj</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Nr</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Tytuł</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Język</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Obrazek</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3">{d.country_name}</td>
                  <td className="p-3 font-mono">{d.view_no}</td>
                  <td className="p-3 font-medium">{d.title || '—'}</td>
                  <td className="p-3">{d.language_code}</td>
                  <td className="p-3">
                    {d.image_front_url ? (
                      <img src={d.image_front_url} alt={d.title || ''} className="w-12 h-8 object-cover rounded" referrerPolicy="no-referrer" />
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">
                    <button onClick={() => toggleActive(d.id, d.active)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${d.active ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {d.active ? 'Aktywny' : 'Nieaktywny'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(d)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Brak wzorów</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCardDesigns;
