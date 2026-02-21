import { create } from "zustand";

export interface PrinterJob {
  fileName: string;
  progress: number;
  layer: number;
  totalLayers: number;
  startedAt: string;
  estimatedEnd: string;
  nozzleTemp: number;
  bedTemp: number;
  speed: number;
}

export interface PrinterStatus {
  id: string;
  name: string;
  model: string;
  state: "idle" | "printing" | "paused" | "error" | "offline";
  currentJob?: PrinterJob;
  updatedAt: string;
}

interface PrinterState {
  printers: Record<string, PrinterStatus>;
  updatePrinter: (id: string, status: Partial<PrinterStatus>) => void;
  setPrinters: (printers: PrinterStatus[]) => void;
  removePrinter: (id: string) => void;
}

export const usePrinterStore = create<PrinterState>((set) => ({
  printers: {},
  updatePrinter: (id, status) =>
    set((state) => ({
      printers: {
        ...state.printers,
        [id]: { ...state.printers[id], ...status } as PrinterStatus,
      },
    })),
  setPrinters: (printers) =>
    set({
      printers: Object.fromEntries(printers.map((p) => [p.id, p])),
    }),
  removePrinter: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.printers;
      return { printers: rest };
    }),
}));
