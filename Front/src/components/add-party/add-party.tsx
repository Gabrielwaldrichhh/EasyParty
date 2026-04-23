import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function AddParty() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="
            flex items-center gap-2 px-5 h-11
            bg-gradient-to-r from-[#ee2525] to-[#fdbb2d]
            text-white font-semibold text-sm rounded-2xl
            shadow-lg hover:opacity-90 active:scale-95
            transition-all duration-150
          "
        >
          <Plus className="w-4 h-4" />
          Adicionar evento
        </button>
      </DialogTrigger>
      <DialogContent />
    </Dialog>
  );
}
