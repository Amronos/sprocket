import { create } from 'zustand';

type ThreadState = {
  threadId: string | null;
  setThreadId: (threadId: string) => void;
};

export const useThread = create<ThreadState>((set) => ({
  threadId: null,
  setThreadId: (threadId) => set({ threadId }),
}));
