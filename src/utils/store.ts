import { create } from "zustand";
import { NodeData } from "./NodeData";

interface NodeState {
  nodes: NodeData[];
  setNodes: (nodes: NodeData[]) => void;
}

export const useNodeStore = create<NodeState>((set) => ({
  nodes: [],
  setNodes: (nodes) => set({ nodes }),
}));
