/**
 * Barrel export des primitives custom __PROJECT_NAME__.
 *
 * Préférer les imports per-component depuis @__SCOPE__/ui pour le
 * tree-shaking (ex: `import { MoneyDisplay } from '@__SCOPE__/ui/money-display'`).
 * Ce barrel reste pour les imports groupés (Storybook, docs, tests).
 */

export { EditorialQuote, type EditorialQuoteProps } from './editorial-quote';
export { KPI, type KPIProps, type KPITrend } from './kpi';
export { MoneyDisplay, formatMoney, type MoneyDisplayProps } from './money-display';
export { PetalSymbol, type PetalSymbolProps } from './petal-symbol';
export { StatusDot, type StatusDotProps, type StatusKind } from './status-dot';
export { VersionBadge, type VersionBadgeProps } from './version-badge';
