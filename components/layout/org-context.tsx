"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";

interface OrgContextValue {
  workspaceId: string | null;
  orgId: string | null;
  workspaceName: string | null;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextValue>({
  workspaceId: null,
  orgId: null,
  workspaceName: null,
  isLoading: true,
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const { isLoaded: orgListLoaded } = useOrganizationList();
  const [value, setValue] = useState<OrgContextValue>({
    workspaceId: null,
    orgId: null,
    workspaceName: null,
    isLoading: true,
  });

  const resolveOrg = useCallback(async () => {
    try {
      const res = await fetch("/api/orgs/current");
      const json = await res.json();
      if (json.data) {
        setValue({
          workspaceId: json.data.workspaceId,
          orgId: json.data.orgId,
          workspaceName: json.data.workspaceName,
          isLoading: false,
        });
      }
    } catch {
      setValue((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (orgListLoaded) {
      resolveOrg();
    }
  }, [orgListLoaded, organization?.id, resolveOrg]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useActiveOrg() {
  return useContext(OrgContext);
}
