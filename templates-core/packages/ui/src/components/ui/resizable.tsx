/**
 * <Resizable /> — react-resizable-panels v4 adapté Base & Brand.
 *
 * Exports : `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`.
 * Note : react-resizable-panels v4 exporte `Group`, `Panel`, `Separator`
 * (pas `PanelGroup`/`PanelResizeHandle`) — on les ré-exporte sous les
 * noms shadcn conventionnels.
 *
 * Style handle :
 * - bg-base-100, flex items-center justify-center
 * - Prop `withHandle` affiche un grip visuel (ligne base-400)
 */

import * as React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

function ResizablePanelGroup({ className, ...props }: React.ComponentProps<typeof Group>) {
  return (
    <Group
      className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
      {...props}
    />
  );
}
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

const ResizablePanel = Panel;

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) {
  return (
    <Separator
      className={cn(
        'bg-subtle focus-visible:ring-brand-400/40 relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:outline-none data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="border-border bg-subtle z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
          <GripVertical className="text-muted-foreground h-2.5 w-2.5" />
        </div>
      )}
    </Separator>
  );
}
ResizableHandle.displayName = 'ResizableHandle';

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
