/**
 * FlowForge Asset Manifest
 * Centralized list of heavy graphical and structural assets to preload into browser cache.
 */

export interface AssetManifestItem {
  key: string;
  url: string;
  type: 'image' | 'gif' | 'svg' | 'font' | 'json';
  group: 'global' | 'workflow';
}

export const GLOBAL_ASSETS: AssetManifestItem[] = [
  { key: 'logo', url: './logo.png', type: 'image', group: 'global' },
  { key: 'hero-bg', url: './hero-bg.jpg', type: 'image', group: 'global' },
  { key: 'showcase-1', url: './showcase-1.gif', type: 'gif', group: 'global' },
  { key: 'showcase-2', url: './showcase-2.jpg', type: 'image', group: 'global' },
  { key: 'showcase-3', url: './showcase-3.jpg', type: 'image', group: 'global' },
  { key: 'showcase-4', url: './showcase-4.gif', type: 'gif', group: 'global' },
];

export const WORKFLOW_ASSETS: AssetManifestItem[] = [
  { key: 'favicon', url: './favicon.svg', type: 'svg', group: 'workflow' },
  { key: 'icons', url: './icons.svg', type: 'svg', group: 'workflow' },
];

export const ALL_ASSETS = [...GLOBAL_ASSETS, ...WORKFLOW_ASSETS];
