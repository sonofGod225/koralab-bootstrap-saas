import { expect, test } from '@playwright/test';

/**
 * Smoke — vérifie que le front suite démarre et rend la page de connexion.
 * Ne dépend d'aucune donnée (route publique `/signin`) : runnable sans DB.
 */
test.describe('smoke', () => {
  test('la page de connexion rend le formulaire email', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.getByPlaceholder('vous@votreentreprise.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });
});
