/**
 * <Toaster /> — Notifications Sonner adapté Base & Brand.
 *
 * Utilise le package `sonner`. Configuration :
 * - Position : top-right (bureau) / bottom-center (mobile)
 * - richColors activé pour les variantes success/error/warning/info
 * - closeButton visible
 * - Thème Base & Brand via CSS vars injectées sur le conteneur
 * - Re-export de `toast` pour usage direct
 */

import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:font-sans',
          title: 'group-[.toast]:text-foreground group-[.toast]:text-sm group-[.toast]:font-medium',
          description: 'group-[.toast]:text-muted-foreground group-[.toast]:text-sm',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-pill group-[.toast]:text-xs group-[.toast]:font-medium',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-foreground group-[.toast]:border group-[.toast]:border-border group-[.toast]:rounded-pill group-[.toast]:text-xs',
          closeButton:
            'group-[.toast]:bg-muted group-[.toast]:border-border group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground group-[.toast]:hover:bg-subtle group-[.toast]:rounded-lg',
          icon: 'group-[.toast]:text-muted-foreground',
          success: 'group-[.toaster]:border-success-200',
          error: 'group-[.toaster]:border-danger-200',
          warning: 'group-[.toaster]:border-warning-200',
          info: 'group-[.toaster]:border-brand-200',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
export { toast } from 'sonner';
