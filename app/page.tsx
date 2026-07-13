import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const roleHome: Record<string, string> = {
  admin: "/admin",
  director: "/director/reports",
  inspector_general: "/inspector/dashboard",
  inspector_pasillo: "/inspector/dashboard",
  teacher: "/dashboard",
};

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  redirect(roleHome[session.user.role] ?? "/login");
}
