import { redirect } from "next/navigation";

import { createClient } from "@/core/supabase/server";
import { getAvailabilityWindowsByUser } from "@/features/scheduling";

import { AvailabilityPageClient } from "./page-client";

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const windows = await getAvailabilityWindowsByUser(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Availability</h1>
          <p className="text-muted-foreground">Manage your weekly availability windows</p>
        </div>
      </div>
      <AvailabilityPageClient windows={windows} />
    </div>
  );
}
