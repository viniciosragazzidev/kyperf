import { getDashboardDataAction } from "@/lib/actions/dashboard-actions";
import DashboardClient from "./dashboard-client";

export default async function PanelPage() {
  const result = await getDashboardDataAction();
  const initialData = (result.success && result.data) ? result.data : null;
  
  return (
    <DashboardClient 
      initialData={initialData} 
      error={result.error} 
    />
  );
}
