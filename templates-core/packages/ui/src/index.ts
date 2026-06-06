/**
 * @__SCOPE__/ui — barrel export complet.
 *
 * Préférer les imports per-component pour le tree-shaking :
 *   import { Button } from '@__SCOPE__/ui/button';
 *   import { MoneyDisplay } from '@__SCOPE__/ui/money-display';
 *
 * Ce barrel reste pour les cas où on veut tout d'un coup (tests, storybook).
 */

export * from './lib/utils';
export * from './lib/use-ui-messages';
export * from './primitives';

/* === shadcn primitives — design system Terre & Soleil === */
export * from './components/ui/accordion';
export * from './components/ui/alert';
export * from './components/ui/alert-dialog';
export * from './components/ui/aspect-ratio';
export * from './components/ui/avatar';
export * from './components/ui/badge';
export * from './components/ui/breadcrumb';
export * from './components/ui/button';
export * from './components/ui/calendar';
export * from './components/ui/card';
export * from './components/ui/carousel';
export * from './components/ui/checkbox';
export * from './components/ui/collapsible';
export * from './components/ui/combobox';
export * from './components/ui/command';
export * from './components/ui/context-menu';
export * from './components/ui/dialog';
export * from './components/ui/drawer';
export * from './components/ui/dropdown-menu';
export * from './components/ui/form';
export * from './components/ui/hover-card';
export * from './components/ui/input';
export * from './components/ui/input-otp';
export * from './components/ui/kbd';
export * from './components/ui/label';
export * from './components/ui/menubar';
export * from './components/ui/navigation-menu';
export * from './components/ui/pagination';
export * from './components/ui/popover';
export * from './components/ui/progress';
export * from './components/ui/radio-group';
export * from './components/ui/resizable';
export * from './components/ui/scroll-area';
export * from './components/ui/select';
export * from './components/ui/separator';
export * from './components/ui/sheet';
export * from './components/ui/skeleton';
export * from './components/ui/slider';
export * from './components/ui/sonner';
export * from './components/ui/spinner';
export * from './components/ui/switch';
export * from './components/ui/table';
export * from './components/ui/tabs';
export * from './components/ui/textarea';
export * from './components/ui/toggle';
export * from './components/ui/toggle-group';
export * from './components/ui/tooltip';

/* === data display (Story 2.9) === */
export * from './components/ui/data-table';
export * from './components/ui/stat-card';
export * from './components/ui/trend';
export * from './components/ui/empty-state';
export * from './components/ui/table-skeleton';

/* === feedback (Story 2.10) === */
export * from './components/ui/loading-button';
export * from './components/ui/confirm-dialog';
export * from './lib/use-connection-status-toast';

/* === navigation (Story 2.11) === */
export * from './components/ui/command-palette';
export * from './components/ui/stepper';
export * from './components/ui/org-switcher';

/* === inputs métier (Story 2.12) === */
export * from './components/ui/money-input';
export * from './components/ui/date-input';
export * from './components/ui/date-range-picker';
export * from './components/ui/phone-input';
export * from './components/ui/country-select';

/* === layouts (Story 2.7) === */
export * from './layouts/app-shell';
export * from './layouts/sidebar';
export * from './layouts/topbar';
export * from './layouts/bottom-nav';
export * from './layouts/page-header';
export * from './layouts/section';
export * from './layouts/container';
