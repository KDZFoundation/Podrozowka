import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Country {
  id: string;
  iso2: string;
  iso3: string | null;
  name_pl: string;
  slug: string | null;
  active: boolean;
  created_at: string;
}

const AdminCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  // Form state
  const [form, setForm] = useState({ iso2: '', iso3: '', name_pl: '', slug: '', active: true });

  const fetchCountries = useCallback(async () => {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name_pl');

    if (!error && data) setCountries(data as Country[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchCountries(); }, [fetchCountries]);

  const resetForm = () => {
    setForm({ iso2: '', iso3: '', name_pl: '', slug: '', active: true });
    setEditingId(null);
    setShowAdd(false);
  };

  const handleSave = async () => {
    if (!form.iso2 || !form.name_pl) {
      toast({ title: "Podaj ISO2 i nazwę kraju", variant: "destructive" });
      return;
    }

    const slug = form.slug || form.name_pl.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (editingId) {
      const { error } = await supabase
        .from('countries')
        .update({ iso2: form.iso2, iso3: form.iso3 || null, name_pl: form.name_pl, slug, active: form.active })
        .eq('id', editingId);

      if (error) {
        toast({ title: "Błąd zapisu", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Kraj zaktualizowany" });
        resetForm();
        fetchCountries();
      }
    } else {
      const { error } = await supabase
        .from('countries')
        .insert({ iso2: form.iso2, iso3: form.iso3 || null, name_pl: form.name_pl, slug, active: form.active });

      if (error) {
        toast({ title: "Błąd dodawania", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Kraj dodany" });
        resetForm();
        fetchCountries();
      }
    }
  };

  const handleEdit = (c: Country) => {
    setForm({ iso2: c.iso2, iso3: c.iso3 || '', name_pl: c.name_pl, slug: c.slug || '', active: c.active });
    setEditingId(c.id);
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('countries').delete().eq('id', id);
    if (error) {
      toast({ title: "Błąd usuwania", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Kraj usunięty" });
      fetchCountries();
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('countries').update({ active: !active }).eq('id', id);
    fetchCountries();
  };

  if (isLoading) return <div className="animate-pulse text-muted-foreground text-center py-8">Ładowanie...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-primary" /> Kraje ({countries.length})
        </h2>
        <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Dodaj kraj
        </Button>
      </div>

      {/* Add/Edit form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 shadow-soft border border-border space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">ISO2 *</label>
              <Input value={form.iso2} onChange={(e) => setForm({ ...form, iso2: e.target.value.toUpperCase() })} placeholder="PL" maxLength={2} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ISO3</label>
              <Input value={form.iso3} onChange={(e) => setForm({ ...form, iso3: e.target.value.toUpperCase() })} placeholder="POL" maxLength={3} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nazwa (PL) *</label>
              <Input value={form.name_pl} onChange={(e) => setForm({ ...form, name_pl: e.target.value })} placeholder="Polska" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="polska" />
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

      {/* Table */}
      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">ISO2</th>
                <th className="text-left p-3 font-medium text-muted-foreground">ISO3</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Nazwa</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Slug</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3 font-mono">{c.iso2}</td>
                  <td className="p-3 font-mono text-muted-foreground">{c.iso3 || '—'}</td>
                  <td className="p-3 font-medium">{c.name_pl}</td>
                  <td className="p-3 text-muted-foreground">{c.slug}</td>
                  <td className="p-3">
                    <button onClick={() => toggleActive(c.id, c.active)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${c.active ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {c.active ? 'Aktywny' : 'Nieaktywny'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(c)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCountries;
