/**
 * <OrgSwitcher> — sélecteur d'organisation (design __PROJECT_NAME__-Auth « Switch org »).
 *
 * Déclencheur (monogramme + nom + rôle) ouvrant un menu : liste des
 * organisations de l'utilisateur — l'organisation active est surlignée et
 * cochée (pastille Soleil) — puis actions « créer une organisation » /
 * « accepter une invitation ».
 *
 * Construit exclusivement sur les primitives shadcn `DropdownMenu` + `Avatar`.
 */

import * as React from 'react';
import { Building2, Check, ChevronsUpDown, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Avatar, AvatarFallback } from './avatar';

export type OrgTone = 'soleil' | 'terre' | 'palmeraie' | 'brique' | 'mil';

export interface Organization {
  id: string;
  name: string;
  /** Rôle de l'utilisateur dans l'organisation (ex: « Propriétaire »). */
  role: string;
  /** Monogramme affiché — défaut : 1re lettre du nom. */
  initial?: string;
  /** Teinte de l'avatar. Défaut : `terre`. */
  tone?: OrgTone;
}

export interface OrgSwitcherProps {
  organizations: Organization[];
  /** Id de l'organisation active. */
  activeId: string;
  onSelect?: (id: string) => void;
  onCreateOrg?: () => void;
  onAcceptInvite?: () => void;
}

const TONE_CLASS: Record<OrgTone, string> = {
  soleil: 'bg-soleil-100 text-terre-900',
  terre: 'bg-subtle text-foreground',
  palmeraie: 'bg-palmeraie-50 text-palmeraie-800',
  brique: 'bg-brique-50 text-brique-800',
  mil: 'bg-mil-50 text-mil-600',
};

function OrgAvatar({ org, className }: { org: Organization; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback
        className={cn('font-display text-sm font-medium', TONE_CLASS[org.tone ?? 'terre'])}
      >
        {org.initial ?? org.name.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
}

const OrgSwitcher = React.forwardRef<HTMLButtonElement, OrgSwitcherProps>(
  ({ organizations, activeId, onSelect, onCreateOrg, onAcceptInvite }, ref) => {
    const active = organizations.find((o) => o.id === activeId) ?? organizations[0];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            ref={ref}
            type="button"
            className="hover:bg-muted focus-visible:ring-soleil-400/40 inline-flex items-center gap-2.5 rounded-[10px] py-1.5 pr-2.5 pl-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {active && <OrgAvatar org={active} className="size-7" />}
            <span className="flex flex-col items-start">
              <span className="text-foreground text-[13px] leading-tight font-medium">
                {active?.name}
              </span>
              <span className="text-muted-foreground text-[10px] leading-tight">
                {active?.role}
              </span>
            </span>
            <ChevronsUpDown className="text-muted-foreground size-3.5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[320px] p-1.5">
          <DropdownMenuLabel className="text-muted-foreground px-3 pt-2 pb-1.5 text-[11px] font-medium tracking-widest uppercase">
            Vos organisations
          </DropdownMenuLabel>

          {organizations.map((org) => {
            const isActive = org.id === activeId;
            return (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => onSelect?.(org.id)}
                className={cn('gap-3 rounded-xl px-3 py-2.5', isActive && 'bg-subtle')}
              >
                <OrgAvatar org={org} className="size-[34px]" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-foreground truncate text-[13px] font-medium">
                    {org.name}
                  </span>
                  <span className="text-muted-foreground text-[11px]">{org.role}</span>
                </span>
                {isActive && (
                  <span className="bg-soleil-400 flex size-[22px] shrink-0 items-center justify-center rounded-full">
                    <Check className="text-terre-900 size-3" strokeWidth={2.5} />
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => onCreateOrg?.()}
            className="text-foreground gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium"
          >
            <span className="bg-subtle text-foreground flex size-[34px] shrink-0 items-center justify-center rounded-full">
              <Building2 className="size-4" />
            </span>
            Créer une nouvelle organisation
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onAcceptInvite?.()}
            className="text-foreground gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium"
          >
            <span className="bg-subtle text-foreground flex size-[34px] shrink-0 items-center justify-center rounded-full">
              <Mail className="size-4" />
            </span>
            Accepter une invitation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);
OrgSwitcher.displayName = 'OrgSwitcher';

export { OrgSwitcher };
