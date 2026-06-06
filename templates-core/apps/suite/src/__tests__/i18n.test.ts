/**
 * Tests parite des cles i18n (Story 1.9 AC).
 *
 * Verifie que toutes les cles de `fr-fr.json` (locale de reference)
 * existent aussi dans `fr-af.json` et `en.json`. Wolof est exempte :
 * couverture minimale MVP, fallback fr-fr documente.
 */

import { describe, it, expect } from 'vitest';
import frFr from '../../messages/fr-fr.json';
import frAf from '../../messages/fr-af.json';
import en from '../../messages/en.json';
import wo from '../../messages/wo.json';

const baseKeys = Object.keys(frFr).filter((k) => !k.startsWith('$') && !k.startsWith('_'));

describe('i18n parite cles', () => {
  it('fr-af couvre 100% des cles de fr-fr', () => {
    const missing = baseKeys.filter((k) => !(k in frAf));
    expect(missing).toEqual([]);
  });

  it('en couvre 100% des cles de fr-fr', () => {
    const missing = baseKeys.filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });

  it('wo definit au moins les cles minimales documentees', () => {
    // Minimum exige : greeting + common.* + auth.* basics.
    const required = [
      'greeting',
      'common.continue',
      'common.cancel',
      'common.save',
      'common.error',
      'auth.signin',
      'language.switcher.label',
    ];
    const missing = required.filter((k) => !(k in wo));
    expect(missing).toEqual([]);
  });
});
