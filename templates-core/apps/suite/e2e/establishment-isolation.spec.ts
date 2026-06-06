import { expect, test } from '@playwright/test';

/**
 * Garde-fou ADR 0013 (« non négociable ») — isolation cross-établissement.
 *
 * SCAFFOLD : marqué `fixme` tant que l'infra de données n'est pas câblée. Pour
 * l'activer (retirer `.fixme`), il faut :
 *   1. une DB de test (Neon branch dédiée) + `BETTER_AUTH_SECRET`,
 *   2. un seed e2e idempotent créant :
 *        org ACME · est_1 (Plateau, primary) · est_2 (Médina)
 *        owner@acme.sn (rôle owner) · contact C1 org-wide · contact C2 borné est_1,
 *   3. un helper de login programmatique Better-Auth (cookie de session)
 *      — cf. e2e/README.md « Infra requise ».
 *
 * La logique du choke-point (`contactsVisibleTo`, `require-establishment`) est
 * déjà couverte en unité (`packages/rpc/src/__tests__/{contacts-visibility,
 * require-establishment}.test.ts`). Ce test e2e verrouille le comportement
 * **bout-en-bout** (UI + tRPC + DB) une fois l'infra disponible.
 */
test.describe('isolation cross-établissement (ADR 0013)', () => {
  test.fixme('un contact borné à un établissement ne fuit pas via le sélecteur', async ({
    page,
  }) => {
    // 1. Login owner@acme.sn (helper à câbler) puis aller au carnet.
    await page.goto('/contacts');

    // 2. Établissement actif = est_1 (Plateau) → C1 (org-wide) ET C2 (borné est_1) visibles.
    await expect(page.getByText('Contact C1')).toBeVisible();
    await expect(page.getByText('Contact C2')).toBeVisible();

    // 3. Bascule du sélecteur d'établissement vers est_2 (Médina).
    await page.getByRole('button', { name: /établissement/i }).click();
    await page.getByRole('menuitem', { name: /médina/i }).click();

    // 4. C1 (org-wide) reste visible ; C2 (borné est_1) NE FUIT PAS.
    await expect(page.getByText('Contact C1')).toBeVisible();
    await expect(page.getByText('Contact C2')).toHaveCount(0);
  });
});
