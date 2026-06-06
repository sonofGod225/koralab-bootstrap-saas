/**
 * Rendu des templates email — react-email → HTML + texte brut.
 *
 * Registre `NotificationTemplate` → composant react-email. Seuls les templates
 * `auth.*` sont câblés ici (Epic 3) ; les templates métier (`invoice.*`,
 * `onboarding.*`) seront ajoutés au fil de leurs epics (Story 5.2+).
 */
import type { ReactElement } from 'react';
import { render } from '@react-email/render';
import type { NotificationPayload, NotificationTemplate } from '../types';
import { VerificationEmail } from './templates/verification-email';
import { EmailOtpEmail } from './templates/email-otp-email';
import { ResetPasswordEmail } from './templates/reset-password-email';
import { PasswordChangedEmail } from './templates/password-changed-email';
import { TeamInvitationEmail } from './templates/team-invitation-email';
import { ContactsImportSummaryEmail } from './templates/contacts-import-summary-email';
import { CatalogueImportSummaryEmail } from './templates/catalogue-import-summary-email';
import { BillingTrialEndingEmail } from './templates/billing-trial-ending-email';
import { BillingPaymentFailedEmail } from './templates/billing-payment-failed-email';
import { InvoiceReminderEmail } from './templates/invoice-reminder-email';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

async function renderElement(subject: string, element: ReactElement): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { subject, html, text };
}

type EmailTemplateRenderer = (payload: NotificationPayload) => Promise<RenderedEmail>;

const renderers: Partial<Record<NotificationTemplate, EmailTemplateRenderer>> = {
  'auth.signup.confirm': (p) =>
    renderElement(
      'Vérifiez votre adresse email — __PROJECT_NAME__',
      <VerificationEmail name={String(p.name ?? '')} url={String(p.url ?? '')} />,
    ),
  'auth.emailOtp': (p) =>
    renderElement(
      'Votre code de vérification — __PROJECT_NAME__',
      <EmailOtpEmail code={String(p.code ?? '')} />,
    ),
  'auth.passwordReset': (p) =>
    renderElement(
      'Réinitialisez votre mot de passe — __PROJECT_NAME__',
      <ResetPasswordEmail name={String(p.name ?? '')} url={String(p.url ?? '')} />,
    ),
  'auth.passwordChanged': (p) =>
    renderElement(
      'Votre mot de passe a été modifié — __PROJECT_NAME__',
      <PasswordChangedEmail name={String(p.name ?? '')} />,
    ),
  'auth.teamInvitation': (p) =>
    renderElement(
      `${String(p.inviterName ?? 'Un collègue')} vous invite sur __PROJECT_NAME__`,
      <TeamInvitationEmail
        inviterName={String(p.inviterName ?? 'Un collègue')}
        organizationName={String(p.organizationName ?? 'une organisation')}
        roleLabel={String(p.roleLabel ?? 'Membre')}
        url={String(p.url ?? '')}
        personalMessage={p.personalMessage ? String(p.personalMessage) : undefined}
      />,
    ),
  'contacts.import.summary': (p) =>
    renderElement(
      'Import de contacts terminé — __PROJECT_NAME__',
      <ContactsImportSummaryEmail
        imported={Number(p.imported ?? 0)}
        duplicates={Number(p.duplicates ?? 0)}
        errors={Number(p.errors ?? 0)}
        total={Number(p.total ?? 0)}
        url={p.url ? String(p.url) : undefined}
      />,
    ),
  'catalogue.import.summary': (p) =>
    renderElement(
      'Import du catalogue terminé — __PROJECT_NAME__',
      <CatalogueImportSummaryEmail
        imported={Number(p.imported ?? 0)}
        duplicates={Number(p.duplicates ?? 0)}
        errors={Number(p.errors ?? 0)}
        total={Number(p.total ?? 0)}
        url={p.url ? String(p.url) : undefined}
      />,
    ),
  'billing.trialEnding': (p) =>
    renderElement(
      Number(p.daysLeft ?? 0) <= 1
        ? 'Votre essai se termine demain — __PROJECT_NAME__'
        : `Votre essai se termine dans ${Number(p.daysLeft ?? 0)} jours — __PROJECT_NAME__`,
      <BillingTrialEndingEmail
        daysLeft={Number(p.daysLeft ?? 0)}
        planName={String(p.planName ?? 'votre plan')}
        trialEndDate={String(p.trialEndDate ?? '')}
        url={p.url ? String(p.url) : undefined}
      />,
    ),
  'billing.paymentFailed': (p) =>
    renderElement(
      p.reason === 'trial_ended'
        ? 'Votre essai a pris fin — action requise — __PROJECT_NAME__'
        : 'Paiement échoué — action requise — __PROJECT_NAME__',
      <BillingPaymentFailedEmail
        planName={String(p.planName ?? 'votre plan')}
        reason={p.reason === 'trial_ended' ? 'trial_ended' : 'payment_failed'}
        url={p.url ? String(p.url) : undefined}
      />,
    ),
  'invoice.overdue': (p) =>
    renderElement(
      `Relance — facture ${String(p.invoiceNumber ?? '')} — __PROJECT_NAME__`.replace('  ', ' '),
      <InvoiceReminderEmail
        orgName={String(p.orgName ?? 'votre fournisseur')}
        customerName={String(p.customerName ?? 'Madame, Monsieur')}
        invoiceNumber={String(p.invoiceNumber ?? '')}
        amountLabel={String(p.amountLabel ?? '')}
        daysOverdue={Number(p.daysOverdue ?? 0)}
        dueDateLabel={String(p.dueDateLabel ?? '')}
        publicLink={String(p.publicLink ?? '')}
        levelTitle={String(p.levelTitle ?? 'Relance')}
      />,
    ),
};

/** Rend un template email en HTML + texte, ou `null` si le template n'est pas câblé. */
export async function renderEmailTemplate(
  template: NotificationTemplate,
  payload: NotificationPayload,
): Promise<RenderedEmail | null> {
  const renderer = renderers[template];
  return renderer ? renderer(payload) : null;
}
