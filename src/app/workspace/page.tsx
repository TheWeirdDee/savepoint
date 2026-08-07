import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";
import { rowToAuthUser } from "@/lib/map";
import { Workspace } from "@/components/Workspace";

export const metadata: Metadata = {
  title: "Workspace · Save Point",
};

// Never statically rendered — this page reads the session cookie per request.
export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    redirect("/login");
  }

  const { data } = await getSupabaseAdmin()
    .from("users")
    .select("*")
    .eq("id", session.userId)
    .single();

  if (!data) {
    redirect("/login");
  }

  return <Workspace user={rowToAuthUser(data)} />;
}
