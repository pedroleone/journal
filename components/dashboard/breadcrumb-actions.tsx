"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Listener = () => void;

interface BreadcrumbActionsStore {
  getSnapshot: () => ReactNode;
  subscribe: (listener: Listener) => () => void;
  setActions: (actions: ReactNode) => void;
}

function createBreadcrumbActionsStore(): BreadcrumbActionsStore {
  let actions: ReactNode = null;
  const listeners = new Set<Listener>();

  return {
    getSnapshot: () => actions,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setActions: (nextActions) => {
      actions = nextActions;
      listeners.forEach((listener) => listener());
    },
  };
}

const BreadcrumbActionsContext = createContext<BreadcrumbActionsStore | null>(null);

export function BreadcrumbActionsProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createBreadcrumbActionsStore);

  return (
    <BreadcrumbActionsContext.Provider value={store}>
      {children}
    </BreadcrumbActionsContext.Provider>
  );
}

function useBreadcrumbActionsStore() {
  const store = useContext(BreadcrumbActionsContext);
  if (!store) {
    throw new Error("Breadcrumb actions must be used within BreadcrumbActionsProvider");
  }
  return store;
}

export function useBreadcrumbActions() {
  const store = useBreadcrumbActionsStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useRegisterBreadcrumbActions(actions: ReactNode) {
  const store = useBreadcrumbActionsStore();

  useEffect(() => {
    store.setActions(actions);
    return () => store.setActions(null);
  }, [actions, store]);
}
