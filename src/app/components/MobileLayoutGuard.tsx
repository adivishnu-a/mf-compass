"use client";
import { useEffect, useState } from "react";
import MobileNotice from './MobileNotice';

export default function MobileLayoutGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobileDevice = window.matchMedia(
        '(max-width: 767px), (pointer: coarse), (hover: none)'
      ).matches;
      setIsMobile(isMobileDevice);
    }
  }, []);

  if (isMobile === undefined) return null;
  if (isMobile) return <MobileNotice />;
  return <>{children}</>;
}
