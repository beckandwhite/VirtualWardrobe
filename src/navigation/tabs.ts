import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

// M3-17 (#47) tab-bar composition, extracted so the persistent five-icon bottom bar
// is described in one place and asserted by a test. app/(tabs)/_layout.tsx renders
// this descriptor; the test locks the set so a regression — a dropped, added, or
// reordered tab, or the retired M7-2b `catalog` tab sneaking back — is caught.
//
// Only *types* are imported (react, @expo/vector-icons), so this module stays
// runtime-free and jest-loadable in the node test environment.

export type TabName = 'welcome' | 'me' | 'wardrobe' | 'studio' | 'looks';
type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface TabDescriptor {
  readonly name: TabName;
  readonly titleKey: string; // i18n key, resolved in the (tabs) layout under I18nProvider
  readonly icon: IoniconName;
}

// The five tabs, in canonical left-to-right order (Plans/05 navigation reality).
//
// #47 D-8 (welcome as a permanent tab vs reclaim the slot): welcome STAYS a
// permanent tab — the lowest-risk option. Reclaiming the slot would move orientation
// into me/settings and re-wire entry routing + the storyboard's five-icon reality
// for no functional gain; keeping it is a no-op with the current, working design.
export const TABS: readonly TabDescriptor[] = [
  { name: 'welcome', titleKey: 'tabs.welcome', icon: 'information-circle-outline' },
  { name: 'me', titleKey: 'tabs.me', icon: 'person-circle-outline' },
  { name: 'wardrobe', titleKey: 'tabs.wardrobe', icon: 'shirt-outline' },
  { name: 'studio', titleKey: 'tabs.studio', icon: 'color-wand-outline' },
  { name: 'looks', titleKey: 'tabs.looks', icon: 'images-outline' },
] as const;

export const TAB_NAMES: readonly TabName[] = TABS.map((t) => t.name);
