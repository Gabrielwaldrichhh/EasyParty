import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

export function CheckoutCancelado() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <XCircle className="w-9 h-9 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xl font-bold text-foreground mb-1">Pagamento cancelado</p>
          <p className="text-sm text-muted-foreground">Nenhuma cobrança foi realizada.</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full h-10 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #ee2525, #fdbb2d)' }}
        >
          Voltar ao mapa
        </button>
      </div>
    </div>
  );
}
