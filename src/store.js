import { create } from 'zustand';

const STORAGE_KEY = 'online-canvas-data';

// Helper to load initial state from localStorage
const loadInitialState = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }
  }
  return { shapes: [] };
};

const initialState = loadInitialState();

export const useStore = create((set, get) => ({
  shapes: initialState.shapes,
  selectedShapeId: null,
  tool: 'select', // 'select', 'rect', 'circle', 'line', 'pen'
  
  // History stacks
  history: [],
  redoStack: [],

  setTool: (tool) => set({ tool }),
  
  // Helper to save history before an action
  saveHistory: () => {
    const { shapes, history } = get();
    // Prevent saving if history is identical to current (basic check)
    if (history.length > 0 && JSON.stringify(history[history.length - 1]) === JSON.stringify(shapes)) {
      return;
    }
    set({ 
      history: [...history, shapes],
      redoStack: [] // Clear redo stack on new action
    });
  },

  // Helper to persist state to localStorage
  persist: () => {
    const { shapes } = get();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ shapes }));
    }
  },

  addShape: (shape) => {
    get().saveHistory();
    set((state) => {
      const newShapes = [...state.shapes, { ...shape, id: crypto.randomUUID() }];
      return { shapes: newShapes };
    });
    setTimeout(() => get().persist(), 0);
  },

  setSelectedShapeId: (id) => set({ selectedShapeId: id }),

  updateShape: (id, updates) => {
    get().saveHistory();
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    setTimeout(() => get().persist(), 0);
  },

  updateShapes: (updates) => {
    get().saveHistory();
    set((state) => ({
      shapes: state.shapes.map((s) => ({ ...s, ...updates })),
    }));
    setTimeout(() => get().persist(), 0);
  },

  removeShape: (id) => {
    get().saveHistory();
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedShapeId: null,
    }));
    setTimeout(() => get().persist(), 0);
  },

  clearAll: () => {
    get().saveHistory();
    set({ shapes: [], selectedShapeId: null });
    setTimeout(() => get().persist(), 0);
  },

  moveShape: (id, direction) => {
    get().saveHistory();
    const { shapes } = get();
    const index = shapes.findIndex(s => s.id === id);
    if (index === -1) return;

    const newShapes = [...shapes];
    const element = newShapes.splice(index, 1)[0];

    if (direction === 'front') {
      newShapes.push(element);
    } else if (direction === 'back') {
      newShapes.unshift(element);
    } else if (direction === 'forward' && index < shapes.length - 1) {
      newShapes.splice(index + 1, 0, element);
    } else if (direction === 'backward' && index > 0) {
      newShapes.splice(index - 1, 0, element);
    }

    set({ shapes: newShapes });
    setTimeout(() => get().persist(), 0);
  },

  undo: () => {
    const { history, shapes, redoStack } = get();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);

    set({
      shapes: previous,
      history: newHistory,
      redoStack: [shapes, ...redoStack]
    });
    setTimeout(() => get().persist(), 0);
  },

  redo: () => {
    const { redoStack, shapes, history } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[0];
    const newRedoStack = redoStack.slice(1);

    set({
      shapes: next,
      history: [...history, shapes],
      redoStack: newRedoStack
    });
    setTimeout(() => get().persist(), 0);
  },
}));
