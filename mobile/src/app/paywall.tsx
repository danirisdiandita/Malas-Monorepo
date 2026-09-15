import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { useEffect, useRef } from "react";
import { YuzuScreen } from "@/components/yuzu-screen";
import { UpgradeSubscriptionSheet } from "@/components/upgrade-subscription-sheet";

export default function PaywallScreen() {
  const sheetRef = useRef<BottomSheetMethods>(null);
  useEffect(() => { const timer = setTimeout(() => sheetRef.current?.present(), 0); return () => clearTimeout(timer); }, []);
  return <YuzuScreen scroll={false}><UpgradeSubscriptionSheet sheetRef={sheetRef} /></YuzuScreen>;
}
