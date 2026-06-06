// @vitest-environment jsdom
/**
 * Story 2.8 — <Form> react-hook-form + zod.
 *
 * Vérifie qu'un submit invalide déclenche un message d'erreur accessible
 * (aria-invalid, aria-required, aria-describedby vers le message).
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { z } from 'zod/v4';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';

const schema = z.object({
  email: z.email('Adresse e-mail invalide'),
});

function TestForm() {
  return (
    <Form schema={schema} onSubmit={() => undefined}>
      <FormField
        name="email"
        required
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <button type="submit">Envoyer</button>
    </Form>
  );
}

describe('Form (Story 2.8) — validation zod', () => {
  it('affiche une erreur accessible après un submit invalide', async () => {
    render(<TestForm />);
    fireEvent.click(screen.getByText('Envoyer'));

    expect(await screen.findByText('Adresse e-mail invalide')).toBeTruthy();

    const input = screen.getByLabelText(/Email/);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('message');
  });
});
