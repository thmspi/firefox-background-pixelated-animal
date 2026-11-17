declare const browser: {
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    };
    onChanged: {
      addListener(listener: (changes: Record<string, { newValue?: unknown }>, area: string) => void): void;
    };
  };
  search: {
    search(properties: { query: string; disposition: "CURRENT_TAB" }): Promise<void>;
  };
  topSites: {
    get(options: { newtab: true; includeFavicon: true; limit: number }): Promise<{
      title: string;
      url: string;
      favicon?: string;
    }[]>;
  };
  runtime: {
    openOptionsPage(): Promise<void>;
  };
};
