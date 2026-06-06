/**
 * /onboarding/step-1 — redirect legacy → /onboarding/company.
 *
 * L'ancien placeholder numéroté est remplacé par la route nominale V2
 * `/onboarding/company` (Story 7.3). On garde cette route comme redirect
 * permanent pour ne pas casser les emails / liens externes qui pointaient
 * sur l'ancienne URL.
 */
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/onboarding/step-1')({ component: LegacyRedirect });

function LegacyRedirect() {
  useEffect(() => {
    window.location.replace('/onboarding/company');
  }, []);
  return null;
}
