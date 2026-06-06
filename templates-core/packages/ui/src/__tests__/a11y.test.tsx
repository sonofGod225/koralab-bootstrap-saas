// @vitest-environment jsdom
/**
 * Story 2.13 — audit a11y axe-core (WCAG 2.1 AA).
 *
 * Rend un échantillon représentatif de primitives `@__SCOPE__/ui` et exécute
 * `axe` sur chacune : aucune violation WCAG 2.1 AA tolérée. Ce test tourne
 * dans le pipeline CI (`pnpm test`) — il sert de gate a11y des PR.
 */

import { describe, it, expect } from 'vitest';
import { type ReactElement } from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Spinner } from '../components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '../components/ui/breadcrumb';
import { Stepper } from '../components/ui/stepper';
import { EmptyState } from '../components/ui/empty-state';

const cases: Array<{ name: string; node: ReactElement }> = [
  { name: 'Button', node: <Button>Enregistrer</Button> },
  { name: 'Badge', node: <Badge variant="paid">Payée</Badge> },
  {
    name: 'Card',
    node: (
      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
          <CardDescription>Vue d&apos;ensemble</CardDescription>
        </CardHeader>
        <CardContent>Contenu</CardContent>
      </Card>
    ),
  },
  {
    name: 'Input',
    node: (
      <div>
        <Label htmlFor="a11y-email">Adresse e-mail</Label>
        <Input id="a11y-email" type="email" />
      </div>
    ),
  },
  {
    name: 'Textarea',
    node: (
      <div>
        <Label htmlFor="a11y-note">Note</Label>
        <Textarea id="a11y-note" />
      </div>
    ),
  },
  {
    name: 'Checkbox',
    node: (
      <div className="flex items-center gap-2">
        <Checkbox id="a11y-cgu" />
        <Label htmlFor="a11y-cgu">J&apos;accepte les conditions</Label>
      </div>
    ),
  },
  {
    name: 'Switch',
    node: (
      <div className="flex items-center gap-2">
        <Switch id="a11y-notif" />
        <Label htmlFor="a11y-notif">Notifications</Label>
      </div>
    ),
  },
  {
    name: 'Alert',
    node: (
      <Alert variant="info">
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>Votre facture a été envoyée.</AlertDescription>
      </Alert>
    ),
  },
  {
    name: 'Avatar',
    node: (
      <Avatar>
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
    ),
  },
  { name: 'Separator', node: <Separator /> },
  { name: 'Spinner', node: <Spinner /> },
  {
    name: 'Tabs',
    node: (
      <Tabs defaultValue="fac">
        <TabsList>
          <TabsTrigger value="fac">Factures</TabsTrigger>
          <TabsTrigger value="dev">Devis</TabsTrigger>
        </TabsList>
        <TabsContent value="fac">Liste des factures</TabsContent>
        <TabsContent value="dev">Liste des devis</TabsContent>
      </Tabs>
    ),
  },
  {
    name: 'Breadcrumb',
    node: (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/factures">Factures</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ),
  },
  {
    name: 'Stepper',
    node: (
      <Stepper
        currentStep={1}
        steps={[{ label: 'Identité' }, { label: 'Entreprise' }, { label: 'Paiement' }]}
      />
    ),
  },
  {
    name: 'EmptyState',
    node: <EmptyState title="Aucune facture" description="Créez votre première facture." />,
  },
];

describe('Story 2.13 — a11y axe-core (WCAG 2.1 AA)', () => {
  for (const { name, node } of cases) {
    it(`${name} — aucune violation`, async () => {
      const { container } = render(node);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  }
});
