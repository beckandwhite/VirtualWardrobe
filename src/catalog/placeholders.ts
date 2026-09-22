import type { ItemCategory } from '@/store/db';

function toUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const TOP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f0f0f0"/>
  <path d="M124,68 C134,50 166,50 176,68 L244,54 L276,78 L276,114 L236,106 L234,260 L66,260 L64,106 L24,114 L24,78 L56,54 Z"
        fill="#d0d0d0" stroke="#bbb" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="150" cy="66" rx="26" ry="18" fill="#f0f0f0"/>
</svg>`;

const BOTTOM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f0f0f0"/>
  <rect x="70" y="50" width="160" height="26" rx="5" fill="#c8c8c8" stroke="#bbb" stroke-width="1.5"/>
  <path d="M70,76 L230,76 L233,268 Q218,278 200,268 L150,142 L100,268 Q82,278 67,268 Z"
        fill="#d0d0d0" stroke="#bbb" stroke-width="2" stroke-linejoin="round"/>
  <line x1="150" y1="76" x2="150" y2="142" stroke="#bbb" stroke-width="1.5"/>
</svg>`;

const DRESS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f0f0f0"/>
  <path d="M110,54 C98,50 78,58 75,76 L72,150 L38,268 L262,268 L228,150 L225,76 C222,58 202,50 190,54 C178,42 122,42 110,54 Z"
        fill="#d0d0d0" stroke="#bbb" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="150" cy="56" rx="40" ry="14" fill="#f0f0f0"/>
  <path d="M75,150 Q150,164 225,150" fill="none" stroke="#bbb" stroke-width="1.5"/>
</svg>`;

const OUTERWEAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f0f0f0"/>
  <path d="M122,56 C132,36 168,36 178,56 L248,42 L280,68 L280,108 L240,98 L238,266 L62,266 L60,98 L20,108 L20,68 L52,42 Z"
        fill="#d0d0d0" stroke="#bbb" stroke-width="2" stroke-linejoin="round"/>
  <path d="M122,56 L148,124 L124,114" fill="#f0f0f0" stroke="#bbb" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M178,56 L152,124 L176,114" fill="#f0f0f0" stroke="#bbb" stroke-width="1.5" stroke-linejoin="round"/>
  <line x1="150" y1="124" x2="150" y2="266" stroke="#bbb" stroke-width="1.5"/>
  <circle cx="150" cy="150" r="4" fill="#bbb"/>
  <circle cx="150" cy="178" r="4" fill="#bbb"/>
  <circle cx="150" cy="206" r="4" fill="#bbb"/>
</svg>`;

const SHOES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f0f0f0"/>
  <ellipse cx="150" cy="245" rx="110" ry="14" fill="#c0c0c0" stroke="#aaa" stroke-width="1.5"/>
  <path d="M48,232 Q44,196 66,166 Q94,132 148,120 L204,116 L254,134 L258,232 Z"
        fill="#d0d0d0" stroke="#bbb" stroke-width="2" stroke-linejoin="round"/>
  <path d="M192,116 L200,232" fill="none" stroke="#c8c8c8" stroke-width="1.5"/>
  <circle cx="202" cy="146" r="3.5" fill="#bbb"/>
  <circle cx="218" cy="146" r="3.5" fill="#bbb"/>
  <circle cx="200" cy="162" r="3.5" fill="#bbb"/>
  <circle cx="216" cy="162" r="3.5" fill="#bbb"/>
  <circle cx="198" cy="178" r="3.5" fill="#bbb"/>
  <circle cx="214" cy="178" r="3.5" fill="#bbb"/>
</svg>`;

const OTHER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f0f0f0"/>
  <path d="M106,96 Q100,52 116,44 Q134,34 140,96" fill="none" stroke="#c0c0c0" stroke-width="10" stroke-linecap="round"/>
  <path d="M160,96 Q166,34 184,44 Q200,52 194,96" fill="none" stroke="#c0c0c0" stroke-width="10" stroke-linecap="round"/>
  <rect x="70" y="96" width="160" height="164" rx="12" fill="#d0d0d0" stroke="#bbb" stroke-width="2"/>
  <line x1="70" y1="118" x2="230" y2="118" stroke="#bbb" stroke-width="1.5"/>
  <rect x="106" y="148" width="88" height="54" rx="8" fill="none" stroke="#bbb" stroke-width="1.5"/>
</svg>`;

export const PLACEHOLDER_URIS: Record<ItemCategory, string> = {
  top: toUri(TOP),
  bottom: toUri(BOTTOM),
  dress: toUri(DRESS),
  outerwear: toUri(OUTERWEAR),
  shoes: toUri(SHOES),
  other: toUri(OTHER),
};
