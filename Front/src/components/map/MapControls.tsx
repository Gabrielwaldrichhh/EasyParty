import { Plus, Minus, Locate, Loader2, LocateFixed } from "lucide-react";
import L from "leaflet";

interface Props {
  map: React.RefObject<L.Map | null>;
  geoStatus?: 'idle' | 'loading' | 'done' | 'denied';
  onLocate?: () => void;
}

export function MapControls({ map, geoStatus = 'idle', onLocate }: Props) {
  function aproximar() { map.current?.zoomIn(); }
  function afastar()   { map.current?.zoomOut(); }

  function handleLocate() {
    if (onLocate) { onLocate(); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => map.current?.flyTo([coords.latitude, coords.longitude], 15, { animate: true, duration: 1.2 }),
      () => {},
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  const locateColor =
    geoStatus === 'done'   ? '#10b981' :
    geoStatus === 'denied' ? '#ef4444' :
    geoStatus === 'loading'? '#3b82f6' :
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Botão localização — com feedback visual */}
      <button
        onClick={handleLocate}
        disabled={geoStatus === 'loading'}
        className="w-9 h-9 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-md flex items-center justify-center transition-all hover:bg-accent disabled:opacity-70"
        style={locateColor ? { borderColor: locateColor, color: locateColor } : {}}
        title={
          geoStatus === 'loading' ? 'Obtendo localização...' :
          geoStatus === 'done'    ? 'Localização encontrada' :
          geoStatus === 'denied'  ? 'Localização negada' :
          'Minha localização'
        }
      >
        {geoStatus === 'loading'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : geoStatus === 'done'
          ? <LocateFixed className="w-4 h-4" />
          : <Locate className="w-4 h-4" />
        }
      </button>

      {/* Zoom */}
      <div className="flex flex-col bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-md overflow-hidden">
        <button
          onClick={aproximar}
          className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-accent transition-colors border-b border-border"
          title="Aproximar"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={afastar}
          className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-accent transition-colors"
          title="Afastar"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
