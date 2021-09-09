import * as React from 'react';

interface ProviderProps {
  group: string;
  children: React.ReactNode;
}

function createContext<T extends object | null>(groupName: string, defaultContext?: T) {
  type ContextValue<T> = T & { parentContext?: ContextValue<T> } & Omit<ProviderProps, 'children'>;
  const Context = React.createContext<ContextValue<T>>(defaultContext as any);

  function Provider(props: T & ProviderProps) {
    const { children, ...providerProps } = props;
    const parentContext = React.useContext(Context);
    // Only re-memoize when prop values change
    const value = React.useMemo(
      () => ({ ...providerProps, parentContext }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [...Object.values(providerProps), parentContext]
    ) as ContextValue<T>;
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useContext(groupName: string, partName: string | null) {
    const isRootPart = partName === null;
    const context = React.useContext(Context);
    const partContext = (function getPartContext(
      context?: ContextValue<T>
    ): ContextValue<T> | undefined {
      if (!context) return;
      return context.group === groupName ? context : getPartContext(context.parentContext);
    })(context);

    if (defaultContext === undefined && partContext === undefined) {
      if (isRootPart) {
        throw new Error(`Missing default context for \`${groupName}\``);
      } else {
        throw new Error(`\`${partName}\` must be used within \`${groupName}\``);
      }
    }

    return partContext || context;
  }

  Provider.displayName = groupName + 'Provider';
  return [Provider, useContext] as const;
}

export { createContext };
export type { ProviderProps };
