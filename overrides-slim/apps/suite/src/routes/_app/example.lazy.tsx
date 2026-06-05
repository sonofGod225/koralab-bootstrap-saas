/**
 * Lazy shim of the Example module — mounts the package component on /example.
 *
 * Everything a `.lazy.tsx` file imports lands in the route's lazy chunk: that is
 * what guarantees `@__SCOPE__/module-example` is code-split and absent from the
 * initial bundle. The shim holds NO logic — the app owns routing, the module
 * owns the component.
 */
import { createLazyFileRoute } from '@tanstack/react-router';
import { ExamplePage } from '@__SCOPE__/module-example';

export const Route = createLazyFileRoute('/_app/example')({
  component: ExamplePage,
});
