/**
 * Primitives de formulaire Base & Brand (Story 2.8).
 *
 * - `<Form>` câble react-hook-form + résolveur zod ; validation au **blur**
 *   par défaut, `noValidate` (on délègue tout à zod), focus + scroll vers le
 *   premier champ en erreur après un submit invalide.
 * - `<FormField>` connecte un champ au `control` (pattern shadcn — composable
 *   avec `<Input>`, `<Select>`, `<Checkbox>`, etc.).
 * - `<FormItem>` / `<FormLabel>` / `<FormControl>` / `<FormDescription>` /
 *   `<FormMessage>` (alias `<FieldError>`) composent un champ accessible :
 *   `aria-describedby`, `aria-invalid`, astérisque + `aria-required`.
 * - `<FormSection>` regroupe des champs avec un filet `border-hairline`.
 *
 * i18n — les schémas zod consomment les clés `form.*` de `@__SCOPE__/ui/i18n`
 * (`fieldRequired`, `emailInvalid`, `phoneInvalid`, `amountMin`, `amountMax`…).
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useFormState,
  type ControllerProps,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  type Resolver,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod/v4';
import { cn } from '../../lib/utils';
import { Label } from './label';

/* ─── <Form> — wrapper react-hook-form + zod ──────────────────────────── */

export interface FormProps<TValues extends FieldValues> extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'children'
> {
  /** Schéma zod — sert de résolveur de validation. */
  schema: z.ZodType;
  /** Handler appelé avec les valeurs validées. */
  onSubmit: SubmitHandler<TValues>;
  /** Valeurs initiales du formulaire. */
  defaultValues?: DefaultValues<TValues>;
  /** Déclencheur de validation — `onBlur` par défaut. */
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  /** Contenu, ou render-prop recevant les méthodes du formulaire. */
  children: React.ReactNode | ((methods: UseFormReturn<TValues>) => React.ReactNode);
}

/** Scrolle en douceur vers le premier champ marqué `aria-invalid`. */
function scrollToFirstError(formEl: HTMLFormElement | null): void {
  const target = formEl?.querySelector<HTMLElement>('[aria-invalid="true"]');
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function Form<TValues extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  mode = 'onBlur',
  children,
  ...formProps
}: FormProps<TValues>) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const methods = useForm<TValues>({
    resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]) as Resolver<TValues>,
    mode,
    defaultValues,
  });

  return (
    <FormProvider {...methods}>
      <form
        ref={formRef}
        noValidate
        onSubmit={methods.handleSubmit(onSubmit, () => scrollToFirstError(formRef.current))}
        {...formProps}
      >
        {typeof children === 'function' ? children(methods) : children}
      </form>
    </FormProvider>
  );
}
Form.displayName = 'Form';

/* ─── <FormField> — Controller + contexte ─────────────────────────────── */

type FormFieldContextValue = { name: string; required: boolean };
const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

type FormItemContextValue = { id: string };
const FormItemContext = React.createContext<FormItemContextValue | null>(null);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ required = false, ...props }: ControllerProps<TFieldValues, TName> & { required?: boolean }) {
  return (
    <FormFieldContext.Provider value={{ name: props.name, required }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}
FormField.displayName = 'FormField';

/** Hook interne : agrège contexte champ + item + état de validation. */
function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { control, getFieldState } = useFormContext();
  const formState = useFormState({ control, name: fieldContext?.name });

  if (!fieldContext) {
    throw new Error('useFormField doit être utilisé dans un <FormField>.');
  }
  const fieldState = getFieldState(fieldContext.name, formState);
  const id = itemContext?.id ?? fieldContext.name;

  return {
    id,
    name: fieldContext.name,
    required: fieldContext.required,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

/* ─── Briques visuelles ───────────────────────────────────────────────── */

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();
    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, children, ...props }, ref) => {
  const { error, formItemId, required } = useFormField();
  return (
    <Label
      ref={ref}
      htmlFor={formItemId}
      className={cn(error ? 'text-danger-700' : 'text-foreground', className)}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-brand-600 ml-0.5">
          *
        </span>
      )}
    </Label>
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId, required } = useFormField();
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={!!error}
      aria-required={required || undefined}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-muted-foreground text-xs', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? '') : children;
  if (!body) return null;
  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-danger-700 text-xs font-medium', className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

/* ─── <FormSection> — regroupement de champs ──────────────────────────── */

export interface FormSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

const FormSection = React.forwardRef<HTMLElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('border-hairline space-y-4 py-6 first:pt-0', className)}
      {...props}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="font-display text-foreground text-lg font-medium">{title}</h3>}
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      )}
      {children}
    </section>
  ),
);
FormSection.displayName = 'FormSection';

/** Alias sémantique de `<FormMessage>` — affiche l'erreur de validation. */
const FieldError = FormMessage;

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FieldError,
  FormSection,
  useFormField,
};
