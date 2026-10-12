import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Medicine, SelectionLine } from '@/types/medicine';

interface SelectionState {
  lines: Record<string, SelectionLine>;
  add: (medicine: Medicine) => void;
  decrement: (medicineId: string) => void;
  remove: (medicineId: string) => void;
  clear: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  lines: {},

  add: (medicine) =>
    set((state) => {
      const existing = state.lines[medicine.id];
      const nextQuantity = Math.min(
        existing ? existing.quantity + 1 : 1,
        medicine.stock,
      );

      return {
        lines: {
          ...state.lines,
          [medicine.id]: { medicine, quantity: nextQuantity },
        },
      };
    }),

  decrement: (medicineId) =>
    set((state) => {
      const line = state.lines[medicineId];
      if (!line) return state;

      if (line.quantity <= 1) {
        const { [medicineId]: _removed, ...rest } = state.lines;
        return { lines: rest };
      }

      return {
        lines: {
          ...state.lines,
          [medicineId]: { ...line, quantity: line.quantity - 1 },
        },
      };
    }),

  remove: (medicineId) =>
    set((state) => {
      const { [medicineId]: _removed, ...rest } = state.lines;
      return { lines: rest };
    }),

  clear: () => set({ lines: {} }),
}));

export const selectSelectionCount = (state: SelectionState) =>
  Object.values(state.lines).reduce((sum, line) => sum + line.quantity, 0);

export const selectPrescriptionCount = (state: SelectionState) =>
  Object.values(state.lines).filter(
    ({ medicine }) => medicine.prescription_required,
  ).length;

const selectSelectionLines = (state: SelectionState) =>
  Object.values(state.lines);

export const useSelectionLines = () =>
  useSelectionStore(useShallow(selectSelectionLines));
