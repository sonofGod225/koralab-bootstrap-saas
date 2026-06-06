/**
 * __PROJECT_NAME__ UI — utilitaires partagés.
 *
 * `cn()` combine plusieurs classNames en gérant les conflits Tailwind via
 * `tailwind-merge`. Convention shadcn/ui v2.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ReadonlyArray<ClassValue>): string {
  return twMerge(clsx(inputs));
}
