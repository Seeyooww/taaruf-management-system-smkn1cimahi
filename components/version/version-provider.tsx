"use client";

import * as React from "react";
import { ChangelogModal } from "@/components/version/changelog-modal";
import { WhatsNewPopup } from "@/components/version/whats-new-popup";
import { getAllVersionsAction, getCurrentVersionAction } from "@/services/version.actions";
import type { SystemVersion } from "@/types/database";

interface VersionContextType {
  currentVersion: SystemVersion | null;
  allVersions: SystemVersion[];
  openChangelogModal: () => void;
  openWhatsNewPopup: () => void;
}

const VersionContext = React.createContext<VersionContextType>({
  currentVersion: null,
  allVersions: [],
  openChangelogModal: () => {},
  openWhatsNewPopup: () => {},
});

export function useVersion() {
  return React.useContext(VersionContext);
}

interface VersionProviderProps {
  children: React.ReactNode;
  initialCurrentVersion?: SystemVersion | null;
  initialAllVersions?: SystemVersion[];
}

export function VersionProvider({
  children,
  initialCurrentVersion = null,
  initialAllVersions = [],
}: VersionProviderProps) {
  const [currentVersion, setCurrentVersion] = React.useState<SystemVersion | null>(initialCurrentVersion);
  const [allVersions, setAllVersions] = React.useState<SystemVersion[]>(initialAllVersions);

  const [isChangelogOpen, setIsChangelogOpen] = React.useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = React.useState(false);

  // Fetch initial version info if not provided
  React.useEffect(() => {
    if (!initialCurrentVersion) {
      getCurrentVersionAction().then((ver) => {
        if (ver) setCurrentVersion(ver);
      }).catch(() => {});
    }

    if (!initialAllVersions || initialAllVersions.length === 0) {
      getAllVersionsAction().then((list) => {
        if (list && list.length > 0) setAllVersions(list);
      }).catch(() => {});
    }
  }, [initialCurrentVersion, initialAllVersions]);

  // Check What's New popup auto-trigger (ONCE per version)
  React.useEffect(() => {
    if (typeof window !== "undefined" && currentVersion?.version) {
      const storageKey = `tms_seen_version_${currentVersion.version}`;
      const hasSeen = localStorage.getItem(storageKey);

      if (!hasSeen) {
        // Small delay before showing pop-up
        const timer = setTimeout(() => {
          setIsWhatsNewOpen(true);
          localStorage.setItem(storageKey, "true");
        }, 1200);

        return () => clearTimeout(timer);
      }
    }
  }, [currentVersion?.version]);

  const openChangelogModal = React.useCallback(() => {
    setIsChangelogOpen(true);
  }, []);

  const openWhatsNewPopup = React.useCallback(() => {
    setIsWhatsNewOpen(true);
  }, []);

  return (
    <VersionContext.Provider
      value={{
        currentVersion,
        allVersions,
        openChangelogModal,
        openWhatsNewPopup,
      }}
    >
      {children}

      {/* Global Modals */}
      <ChangelogModal
        open={isChangelogOpen}
        onOpenChange={setIsChangelogOpen}
        currentVersion={currentVersion}
        allVersions={allVersions}
      />

      <WhatsNewPopup
        open={isWhatsNewOpen}
        onOpenChange={setIsWhatsNewOpen}
        currentVersion={currentVersion}
        onOpenFullChangelog={openChangelogModal}
      />
    </VersionContext.Provider>
  );
}
