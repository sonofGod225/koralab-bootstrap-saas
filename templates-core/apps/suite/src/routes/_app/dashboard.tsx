/**
 * /dashboard — tableau de bord authentifié (placeholder Story 3.17 / Epic 7).
 *
 * Page d'accueil de l'espace authentifié. Placeholder pour l'instant : pas de
 * données métier tant qu'Epic 8 (Facturation) et Epic 9 (Encaissements) ne
 * sont pas livrés. Sert de cible aux post-auth (signin/signup/verify-email
 * via `/`) et au tour guidé de fin d'onboarding (Story 7.10).
 *
 * Garde d'accès : héritée du shell `_app.tsx` (redirection `/signin` si pas
 * de session).
 */
import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Users, Settings } from 'lucide-react';
import { Button } from '@__SCOPE__/ui/button';
import { authClient } from '../../lib/auth-client';

export const Route = createFileRoute('/_app/dashboard')({ component: DashboardPage });

function firstName(name: string | undefined): string {
  if (!name) return '';
  return name.split(' ')[0] ?? name;
}

function DashboardPage() {
  const [name, setName] = useState<string>('');

  useEffect(() => {
    void (async () => {
      const session = await authClient.getSession();
      if (session.data) setName(session.data.user.name);
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
      <header className="mb-10">
        <p className="text-soleil-600 text-xs font-medium tracking-wide uppercase">
          Tableau de bord
        </p>
        <h1 className="font-display text-terre-900 mt-2 text-4xl font-light tracking-tighter sm:text-5xl">
          Bonjour {firstName(name) || 'à vous'}.
        </h1>
        <p className="text-terre-600 mt-3 max-w-xl text-base leading-relaxed">
          Votre suite est prête. Les premiers modules (Facturation, Encaissements, CRM) arrivent
          progressivement — en attendant, configurez votre équipe et explorez les paramètres.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <DashCard
          icon={Users}
          eyebrow="Équipe"
          title="Invitez vos collaborateurs"
          body="Ajoutez les personnes qui vont travailler avec vous et attribuez-leur un rôle."
          ctaHref="/settings/team"
          ctaLabel="Gérer l'équipe"
          delayMs={0}
        />
        <DashCard
          icon={Settings}
          eyebrow="Configuration"
          title="Réglez vos paramètres"
          body="Sécurité, sessions, double authentification : votre compte sous contrôle."
          ctaHref="/settings/security/2fa"
          ctaLabel="Aller aux paramètres"
          delayMs={80}
        />
      </section>

      <p className="text-terre-500 mt-10 text-xs">
        Les modules métier seront activés au fil de leur livraison.
      </p>
    </main>
  );
}

function DashCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  ctaHref,
  ctaLabel,
  delayMs = 0,
}: {
  icon: typeof Users;
  eyebrow: string;
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  /** Stagger entrée — décalage en ms par card pour effet en cascade. */
  delayMs?: number;
}) {
  return (
    <article
      className="border-border bg-card animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="bg-soleil-100 text-soleil-700 flex h-10 w-10 items-center justify-center rounded-xl">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-terre-500 text-xs font-medium tracking-wide uppercase">{eyebrow}</p>
        <h2 className="text-terre-900 mt-1 text-lg font-semibold">{title}</h2>
        <p className="text-terre-600 mt-1.5 text-sm leading-relaxed">{body}</p>
      </div>
      <Button
        asChild
        variant="ghost"
        className="text-terre-900 mt-auto w-fit px-0 hover:bg-transparent hover:underline"
      >
        <Link to={ctaHref}>
          {ctaLabel}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </article>
  );
}
