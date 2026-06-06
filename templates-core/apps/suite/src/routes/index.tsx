import { createFileRoute, redirect } from '@tanstack/react-router';

// Sur les domaines applicatifs (app.__PROJECT_SLUG__.com / staging.__PROJECT_SLUG__.com), la
// racine est une porte d'entrée, pas une vitrine : on délègue tout le gating
// (session / org active / onboarding) au guard du layout `_app` en redirigeant
// vers /dashboard. Le guard renvoie ensuite vers /signin (non connecté) ou
// /onboarding (org/onboarding incomplet) selon le cas.
//
// La landing marketing vit désormais sur le projet landing dédié de
// __PROJECT_SLUG__.com (cf. apps/landing) — elle n'a plus sa place ici.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});
