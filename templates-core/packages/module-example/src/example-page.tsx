/**
 * <ExamplePage /> — skeleton screen of the Example module (Voie A).
 *
 * Demonstrates the package boundary:
 *  - the component lives in @__SCOPE__/module-example;
 *  - it consumes the shared design system via @__SCOPE__/ui (Card, Button…),
 *    proving the design tokens cross the package boundary;
 *  - it knows nothing about routing — apps/suite mounts it on /example via a
 *    lazy shim → this component ships in a separate chunk.
 *
 * Replace the demo data with a tRPC loader when wiring real data.
 */
import { ArrowRight, Box, Plus } from 'lucide-react';
import { Button } from '@__SCOPE__/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@__SCOPE__/ui/card';

import { countByStatus, type Item } from './lib/example';

const DEMO_ITEMS: Item[] = [
  { id: '1', name: 'First item', status: 'active' },
  { id: '2', name: 'Second item', status: 'active' },
  { id: '3', name: 'Draft item', status: 'draft' },
];

export function ExamplePage() {
  const counts = countByStatus(DEMO_ITEMS);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
      <header className="mb-10">
        <p className="text-brand-600 text-xs font-medium tracking-wide uppercase">Example module</p>
        <h1 className="font-display text-base-900 mt-2 text-4xl font-light tracking-tighter sm:text-5xl">
          Your items.
        </h1>
        <p className="text-base-600 mt-3 max-w-xl text-base leading-relaxed">
          This screen lives in the <code className="font-mono text-sm">@__SCOPE__/module-example</code>{' '}
          package — outside <code className="font-mono text-sm">apps/suite</code>. The app only
          mounts it on <code className="font-mono text-sm">/example</code>.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Draft</CardDescription>
            <CardTitle className="text-3xl font-light">{counts.draft}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl font-light">{counts.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Archived</CardDescription>
            <CardTitle className="text-3xl font-light">{counts.archived}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Box className="size-5" aria-hidden /> Module seam demo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus className="size-4" aria-hidden /> New item
          </Button>
          <Button variant="outline">
            See all <ArrowRight className="size-4" aria-hidden />
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
