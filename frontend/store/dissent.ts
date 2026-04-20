import { create } from 'zustand';
import { api } from '@/lib/api';

export type ObjectionSeverity = "minor" | "major" | "blocking";
export type ObjectionCategory = "budget" | "compliance" | "timing" | "technical" | "strategic";

export interface IObjection {
  _id: string;
  category: ObjectionCategory;
  severity: ObjectionSeverity;
  rationale: string;
  status: "active" | "resolved" | "dismissed";
  submittedBy: { name: string; role: string; _id: string };
  createdAt: string;
  adminNote?: string;
}

interface DissentState {
  trustScore: number | null;
  objections: IObjection[];
  loading: boolean;
  setTrustScore: (score: number) => void;
  loadObjections: (decisionId: string) => Promise<void>;
  submitObjection: (decisionId: string, payload: { category: string; severity: string; rationale: string }) => Promise<void>;
  resolveObjection: (decisionId: string, objectionId: string, adminNote: string) => Promise<void>;
  dismissObjection: (decisionId: string, objectionId: string, adminNote: string) => Promise<void>;
}

export const useDissentStore = create<DissentState>((set) => ({
  trustScore: null,
  objections: [],
  loading: false,

  setTrustScore: (score) => set({ trustScore: score }),

  loadObjections: async (decisionId) => {
    try {
      const res = await api.get<{ objections: IObjection[] }>(`/decision/${decisionId}/dissent`);
      set({ objections: res.objections });
    } catch (err) {
      console.error("Failed to load objections", err);
    }
  },

  submitObjection: async (decisionId, payload) => {
    set({ loading: true });
    try {
      const res = await api.post<{ objection: IObjection; newTrustScore: number }>(`/decision/${decisionId}/dissent`, payload);
      set((state) => ({
        objections: [res.objection, ...state.objections],
        trustScore: res.newTrustScore
      }));
    } finally {
      set({ loading: false });
    }
  },

  resolveObjection: async (decisionId, objectionId, adminNote) => {
    set({ loading: true });
    try {
      const res = await api.patch<{ objection: IObjection; newTrustScore: number }>(`/decision/${decisionId}/dissent/${objectionId}/resolve`, { adminNote });
      set((state) => ({
        objections: state.objections.map(o => o._id === objectionId ? res.objection : o),
        trustScore: res.newTrustScore
      }));
    } finally {
      set({ loading: false });
    }
  },

  dismissObjection: async (decisionId, objectionId, adminNote) => {
    set({ loading: true });
    try {
      const res = await api.patch<{ objection: IObjection; newTrustScore: number }>(`/decision/${decisionId}/dissent/${objectionId}/dismiss`, { adminNote });
      set((state) => ({
        objections: state.objections.map(o => o._id === objectionId ? res.objection : o),
        trustScore: res.newTrustScore
      }));
    } finally {
      set({ loading: false });
    }
  }
}));
