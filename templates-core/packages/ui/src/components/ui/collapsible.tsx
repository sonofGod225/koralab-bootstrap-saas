/**
 * <Collapsible /> — Radix Collapsible adapté Terre & Soleil.
 *
 * Exports : `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`.
 * Wrapper léger — les variants visuels sont à la charge du consommateur.
 */

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
