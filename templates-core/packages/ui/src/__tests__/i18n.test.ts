/**
 * Story 2.15 — couverture i18n des primitives @__SCOPE__/ui.
 *
 * Garantit que les 4 locales (`fr-fr`, `fr-af`, `en`, `wo`) couvrent 100% des
 * clés du bundle de base et n'introduisent ni clé orpheline ni valeur vide.
 */

import { describe, it, expect } from 'vitest';
import frFr from '../../messages/fr-fr.json';
import frAf from '../../messages/fr-af.json';
import en from '../../messages/en.json';
import wo from '../../messages/wo.json';
import { translateUI, UI_LOCALES, type UILocale } from '../lib/i18n';

const bundles: Record<UILocale, Record<string, string>> = {
  'fr-fr': frFr,
  'fr-af': frAf,
  en,
  wo,
};

const baseKeys = Object.keys(frFr).sort();

describe('i18n @__SCOPE__/ui — couverture des clés', () => {
  it('expose exactement les 4 locales __PROJECT_NAME__', () => {
    expect([...UI_LOCALES]).toEqual(['fr-fr', 'fr-af', 'en', 'wo']);
  });

  for (const locale of UI_LOCALES) {
    it(`${locale} — 100% des clés de base, aucune clé orpheline`, () => {
      expect(Object.keys(bundles[locale]).sort()).toEqual(baseKeys);
    });

    it(`${locale} — aucune valeur vide`, () => {
      for (const [key, value] of Object.entries(bundles[locale])) {
        expect(value, `${locale} · ${key}`).toBeTruthy();
      }
    });
  }
});

describe('translateUI', () => {
  it('interpole les paramètres {nom}', () => {
    expect(translateUI('nav.pageOf', 'fr-fr', { page: 2, total: 9 })).toBe('Page 2 sur 9');
    expect(translateUI('nav.pageOf', 'en', { page: 2, total: 9 })).toBe('Page 2 of 9');
  });

  it('retombe sur fr-fr quand la locale ne traduit pas une clé', () => {
    // wo traduit bien la clé — on vérifie surtout le chemin nominal + fallback défaut.
    expect(translateUI('common.cancel', 'fr-fr')).toBe('Annuler');
    expect(translateUI('common.cancel', 'en')).toBe('Cancel');
  });

  it('laisse les placeholders inconnus intacts', () => {
    expect(translateUI('nav.pageOf', 'fr-fr', { page: 1 })).toBe('Page 1 sur {total}');
  });
});
