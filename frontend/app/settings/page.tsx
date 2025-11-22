import { Suspense } from "react";
import { WorkspaceLoader } from "@/components/ui/workspace-loader";
import SettingsClient from "./settings-client";

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <Suspense fallback={<WorkspaceLoader />}>
      <SettingsClient />
    </Suspense>
  );
}
