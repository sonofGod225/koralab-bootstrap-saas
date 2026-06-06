/**
 * Tests des helpers réseau — cœur du fix « perte de connexion → onboarding ».
 *
 * L'invariant à garantir : une panne réseau est reconnue comme telle, mais une
 * vraie réponse d'erreur du serveur (UNAUTHORIZED…) ne l'est PAS — sinon le
 * garde d'accès éjecterait à tort l'utilisateur connecté.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TRPCClientError } from '@trpc/client';
import { isNetworkError, isOffline } from '../network';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isOffline', () => {
  it('renvoie false quand `navigator` est absent (SSR / env node)', () => {
    expect(isOffline()).toBe(false);
  });

  it('renvoie true quand `navigator.onLine` est false', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(isOffline()).toBe(true);
  });

  it('renvoie false quand `navigator.onLine` est true', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(isOffline()).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('TRPCClientError avec une réponse serveur (data non nul) → false', () => {
    const err = new TRPCClientError('UNAUTHORIZED');
    (err as unknown as { data: unknown }).data = { code: 'UNAUTHORIZED', httpStatus: 401 };
    expect(isNetworkError(err)).toBe(false);
  });

  it('TRPCClientError sans réponse serveur (data nul, fetch échoué) → true', () => {
    const err = new TRPCClientError('Failed to fetch');
    expect(isNetworkError(err)).toBe(true);
  });

  it('TypeError « Failed to fetch » (échec fetch natif) → true', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('une Error applicative quelconque → false', () => {
    expect(isNetworkError(new Error('boom'))).toBe(false);
  });

  it('hors-ligne : tout est réseau, même une erreur serveur', () => {
    vi.stubGlobal('navigator', { onLine: false });
    const err = new TRPCClientError('UNAUTHORIZED');
    (err as unknown as { data: unknown }).data = { code: 'UNAUTHORIZED', httpStatus: 401 };
    expect(isNetworkError(err)).toBe(true);
  });
});
