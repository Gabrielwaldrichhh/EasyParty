import { useState } from "react";
import { X, MapPin, Clock, DollarSign, Users, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { CATEGORY_CONFIG } from "../../config/categories";
import type { Category, CreateEventPayload } from "../../types";

interface Props {
  lat: number;
  lng: number;
  onSubmit: (payload: CreateEventPayload) => Promise<void>;
  onClose: () => void;
}

const CATEGORIAS = (Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]);

export function CreateEventModal({ lat, lng, onSubmit, onClose }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  const dataHoje = new Date().toISOString().split('T')[0];
  const horapadrao = new Date();
  horapadrao.setHours(horapadrao.getHours() + 1, 0, 0, 0);
  const horaPadraoStr = horapadrao.toTimeString().slice(0, 5);

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: 'PARTY' as Category,
    customCategoria: '',
    data: dataHoje,
    hora: horaPadraoStr,
    horaFim: '',
    preco: '',
    capacidade: '',
    idadeMinima: '' as string,
    endereco: '',
    publico: true,
    imageUrl: '',
  });

  function set(campo: string, valor: string | boolean) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) { setErro('O título é obrigatório'); return; }
    if (form.categoria === 'OTHER' && !form.customCategoria.trim()) {
      setErro('Descreva o tipo do evento'); return;
    }
    if (!form.horaFim) { setErro('O horário de fim é obrigatório'); return; }
    setErro('');
    setCarregando(true);

    // Monta datetime explícito: usa a data local sem conversão de fuso
    const [ano, mes, dia] = form.data.split('-').map(Number);
    const [hh, mm] = form.hora.split(':').map(Number);
    const dataHoraObj = new Date(ano, mes - 1, dia, hh, mm, 0);
    const dataHora = dataHoraObj.toISOString();

    let dataHoraFim: string | undefined;
    if (form.horaFim) {
      const [fhh, fmm] = form.horaFim.split(':').map(Number);
      // Se horário de fim for menor ou igual ao de início → evento termina no dia seguinte
      const diaFim = (fhh * 60 + fmm) <= (hh * 60 + mm) ? dia + 1 : dia;
      dataHoraFim = new Date(ano, mes - 1, diaFim, fhh, fmm, 0).toISOString();
    }

    try {
      await onSubmit({
        title: form.titulo.trim(),
        description: form.descricao.trim() || undefined,
        category: form.categoria,
        customCategory: form.categoria === 'OTHER' ? form.customCategoria.trim() : undefined,
        date: dataHora,
        endDate: dataHoraFim,
        price: form.preco ? parseFloat(form.preco) : 0,
        maxCapacity: form.capacidade ? parseInt(form.capacidade) : undefined,
        minAge: form.idadeMinima ? parseInt(form.idadeMinima) : undefined,
        address: form.endereco.trim() || undefined,
        isPublic: form.publico,
        imageUrl: form.imageUrl || undefined,
        latitude: lat,
        longitude: lng,
      });
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      // Limite do plano free → mostrar modal de upgrade
      if (status === 403 && data?.code === 'FREE_PLAN_LIMIT') {
        setShowUpgrade(true);
      } else {
        const msg = data?.errors?.[0]?.message || data?.message || 'Erro ao criar evento';
        setErro(msg);
      }
    } finally {
      setCarregando(false);
    }
  }

  const cfgAtual = CATEGORY_CONFIG[form.categoria];

  if (showUpgrade) {
    return <UpgradeModal onClose={() => { setShowUpgrade(false); onClose(); }} />;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-50 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: `linear-gradient(135deg, ${cfgAtual.color}cc, ${cfgAtual.color}44)` }}
        >
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span className="text-xl">{cfgAtual.emoji}</span>
              Novo evento
            </h2>
            <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {erro && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          {/* Categorias — grid 5 colunas */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo de evento</label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIAS.map(([value, c]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('categoria', value)}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs transition-all"
                  style={form.categoria === value
                    ? { borderColor: c.color, background: c.color + '22', color: c.color, fontWeight: 600 }
                    : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                  }
                >
                  <span className="text-base leading-none">{c.emoji}</span>
                  <span className="leading-tight text-center" style={{ fontSize: '9px' }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Campo customCategory quando OTHER */}
          {form.categoria === 'OTHER' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Descreva o tipo *</label>
              <Input
                placeholder="Ex: Corrida de rua, Leilão, Feira..."
                value={form.customCategoria}
                onChange={e => set('customCategoria', e.target.value)}
                maxLength={50}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do evento *</label>
            <Input
              placeholder="Ex: Open bar sexta à noite"
              value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
            <textarea
              placeholder="Conte mais sobre o evento..."
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <ImageUploader
            context="event"
            label="Imagem do evento"
            aspectRatio="16/9"
            currentUrl={form.imageUrl}
            onUploaded={url => set('imageUrl', url)}
            disabled={carregando}
          />

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Data *
            </label>
            <Input type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Início *
              </label>
              <Input type="time" value={form.hora} onChange={e => set('hora', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Fim *
                {form.horaFim && form.hora && (() => {
                  const [fhh, fmm] = form.horaFim.split(':').map(Number);
                  const [hh, mm] = form.hora.split(':').map(Number);
                  return (fhh * 60 + fmm) <= (hh * 60 + mm);
                })() && (
                  <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: cfgAtual.color }}>
                    +1 dia
                  </span>
                )}
              </label>
              <Input type="time" value={form.horaFim} onChange={e => set('horaFim', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Valor (R$)
              </label>
              <Input
                type="number" min="0" step="0.01"
                placeholder="0 = gratuito"
                value={form.preco}
                onChange={e => set('preco', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Capacidade
              </label>
              <Input
                type="number" min="1"
                placeholder="Ilimitado"
                value={form.capacidade}
                onChange={e => set('capacidade', e.target.value)}
              />
            </div>
          </div>

          {/* Faixa etária */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Faixa etária
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: 'Livre', value: '' },
                { label: '10+', value: '10' },
                { label: '14+', value: '14' },
                { label: '16+', value: '16' },
                { label: '18+', value: '18' },
                { label: '21+', value: '21' },
              ].map(op => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => set('idadeMinima', op.value)}
                  className="h-8 px-3 rounded-xl border text-xs font-semibold transition-all"
                  style={form.idadeMinima === op.value
                    ? { background: cfgAtual.color, color: 'white', borderColor: cfgAtual.color }
                    : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                  }
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Endereço (opcional)</label>
            <Input
              placeholder="Rua, número..."
              value={form.endereco}
              onChange={e => set('endereco', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-foreground">Evento público</p>
              <p className="text-xs text-muted-foreground">Visível para todos no mapa</p>
            </div>
            <button
              type="button"
              onClick={() => set('publico', !form.publico)}
              className="w-11 h-6 rounded-full transition-colors relative"
              style={{ background: form.publico ? cfgAtual.color : 'var(--muted)' }}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.publico ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <Button
            type="submit"
            disabled={carregando}
            className="w-full text-white font-semibold rounded-xl h-11"
            style={{ background: `linear-gradient(135deg, ${cfgAtual.color}, ${cfgAtual.color}99)` }}
          >
            {carregando ? 'Criando...' : `Criar ${cfgAtual.label}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
