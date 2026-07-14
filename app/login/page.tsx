import { signIn } from "@/lib/auth";
import Logo from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-brand-950 sm:flex-row">
      <div className="flex flex-1 flex-col justify-center gap-4 px-6 py-16 text-white sm:px-12 md:px-20">
        <Logo size={48} />
        <p className="text-sm font-medium tracking-wide text-gold-400">Sistema de asistencia</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Liceo Eduardo Charme</h1>
        <p className="max-w-md text-brand-200">
          Registro de asistencia por curso y aviso automático por WhatsApp a
          los apoderados. San Fernando, Chile.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-16 dark:bg-brand-900 sm:px-12">
        <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-8 shadow-sm dark:border-brand-800 dark:bg-brand-950">
          <h2 className="text-lg font-semibold text-brand-900 dark:text-white">Ingresar</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-brand-300">
            Usa tu cuenta institucional de Google del liceo.
          </p>

          {error && (
            <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              Tu cuenta no está autorizada todavía. Pídele al administrador del
              sistema que agregue tu correo en &quot;Usuarios y roles&quot;
              antes de intentar de nuevo.
            </p>
          )}

          <form
            className="mt-6"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn-primary w-full">
              Ingresar con Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
