"use client";

import { SWRConfig } from "swr";
import { swrFetcher } from "./api-client";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        errorRetryCount: 3,
        dedupingInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
