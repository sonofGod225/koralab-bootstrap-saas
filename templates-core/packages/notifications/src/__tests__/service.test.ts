/**
 * Tests Story 1.14 — Notification service shell.
 *
 * Vérifie :
 * - dispatch fallback email quand aucune préférence
 * - dispatch respecte preferredChannels[0] si éligible
 * - skip canal non éligible (ex: push sans userId) et passe au suivant
 * - sendVia force un canal spécifique
 * - tous les stubs retournent `stubbed: true` + `delivered: false`
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EmailStub } from '../channels/email-stub';
import { WhatsAppStub } from '../channels/whatsapp-stub';
import { SmsStub } from '../channels/sms-stub';
import { PushStub } from '../channels/push-stub';
import { createNotificationService } from '../service';

describe('createNotificationService — Story 1.14 shell', () => {
  beforeEach(() => {
    // Silence les console.warn des stubs pour des sorties tests propres
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it("dispatche sur email par défaut quand aucune préférence n'est fournie", async () => {
    const email = new EmailStub();
    const sendSpy = vi.spyOn(email, 'send');
    const service = createNotificationService([
      email,
      new WhatsAppStub(),
      new SmsStub(),
      new PushStub(),
    ]);

    const result = await service.send(
      'invoice.sent',
      { invoiceId: 'inv_test' },
      { email: 'test@example.com' },
    );

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy.mock.calls[0]?.[0]).toBe('invoice.sent');
    expect(result.delivered).toBe(false);
    expect(result.channel).toBe('email');
    expect(result.stubbed).toBe(true);
  });

  it('respecte preferredChannels[0] quand le canal est éligible', async () => {
    const wa = new WhatsAppStub();
    const waSendSpy = vi.spyOn(wa, 'send');
    const service = createNotificationService([new EmailStub(), wa, new SmsStub(), new PushStub()]);

    const result = await service.send(
      'invoice.paid',
      { invoiceId: 'inv_paid' },
      { phone: '+221700000000', email: 'fallback@example.com' },
      { preferredChannels: ['whatsapp', 'email'] },
    );

    expect(waSendSpy).toHaveBeenCalledTimes(1);
    expect(result.channel).toBe('whatsapp');
    expect(result.stubbed).toBe(true);
  });

  it('skip le canal non éligible et passe au suivant (push sans userId → email)', async () => {
    const push = new PushStub();
    const email = new EmailStub();
    const pushSpy = vi.spyOn(push, 'send');
    const emailSpy = vi.spyOn(email, 'send');
    const service = createNotificationService([email, push]);

    const result = await service.send(
      'auth.passwordReset',
      { resetUrl: 'https://app.__PROJECT_SLUG__.com/reset/xyz' },
      { email: 'user@example.com' }, // pas de userId → push doit être skip
      { preferredChannels: ['push', 'email'] },
    );

    expect(pushSpy).not.toHaveBeenCalled();
    expect(emailSpy).toHaveBeenCalledTimes(1);
    expect(result.channel).toBe('email');
  });

  it('sendVia force le canal demandé même si moins préféré', async () => {
    const sms = new SmsStub();
    const smsSpy = vi.spyOn(sms, 'send');
    const service = createNotificationService([new EmailStub(), sms]);

    const result = await service.sendVia(
      'sms',
      'auth.signup.confirm',
      { code: '123456' },
      { phone: '+22507070707' },
    );

    expect(smsSpy).toHaveBeenCalledTimes(1);
    expect(result.channel).toBe('sms');
    expect(result.stubbed).toBe(true);
  });

  it("sendVia retourne une erreur si le canal n'est pas enregistré", async () => {
    const service = createNotificationService([new EmailStub()]);
    const result = await service.sendVia(
      'whatsapp',
      'invoice.overdue',
      {},
      { phone: '+221700000000' },
    );
    expect(result.delivered).toBe(false);
    expect(result.error).toContain('non enregistré');
  });

  it('send retourne une erreur si aucun canal éligible (recipient vide)', async () => {
    const service = createNotificationService([new EmailStub(), new WhatsAppStub()]);
    const result = await service.send('invoice.sent', { invoiceId: 'x' }, {});
    expect(result.delivered).toBe(false);
    expect(result.error).toContain('Aucun canal éligible');
  });

  it('log console.warn avec le format `[NotificationStub] email/{template} → {target}`', async () => {
    const warnSpy = console.warn as ReturnType<typeof vi.fn>;
    const service = createNotificationService([new EmailStub()]);
    await service.send('invoice.sent', { invoiceId: 'inv_test' }, { email: 'test@example.com' });
    expect(warnSpy).toHaveBeenCalledWith(
      '[NotificationStub] email/invoice.sent → test@example.com',
    );
  });
});
