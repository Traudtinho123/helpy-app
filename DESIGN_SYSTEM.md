# HELPY Design System v1

Grundlage für alle UI-Entwicklung in HELPY Office KI. Keine Ad-hoc-Werte — immer Tokens und UI-Komponenten verwenden.

## Struktur

```
lib/design/           Design Tokens
components/ui/        UI-Komponenten
components/ui/index.ts  Barrel-Export
```

## Komponentenübersicht

| Komponente | Zweck |
|---|---|
| `Button` | Aktionen — Primary, Secondary, Ghost, Danger, Success |
| `Card` | Inhaltscontainer — default, workspace, info, action |
| `Panel` | Seitenleisten — workspace, helpy, sidebar, info |
| `Section` | Seitenabschnitte mit Titel |
| `Modal` | Review-Dialoge, Overlays |
| `Input` / `Textarea` / `Select` | Formulare |
| `Badge` | Allgemeine Labels |
| `StatusBadge` | Vorgangs- und Prioritätsstatus |
| `Avatar` | HELPY- und Benutzer-Avatare |
| `Dropdown` | Menüs |
| `Tabs` | Tab-Navigation |
| `Timeline` | Status-Verlauf |
| `EmptyState` | Leere Zustände |
| `LoadingSkeleton` | Lade-Platzhalter |
| `Divider` | Trennlinien |

### Import

```tsx
import { Button, Card, Panel, StatusBadge } from "@/components/ui";
import { tokens, surfaces, typography } from "@/lib/design";
```

## Designregeln

1. **Keine Magic Numbers** — Spacing, Radius und Shadows nur aus Tokens.
2. **Komponenten zuerst** — Keine duplizierten Tailwind-Ketten in Feature-Komponenten.
3. **Varianten statt Copy-Paste** — `Card variant="workspace"` statt neuer Klassen.
4. **Deutsche UI** — Alle sichtbaren Texte auf Deutsch.
5. **Prüfen & Bestätigen** — Keine Automatik-Sprache in Buttons oder Labels.

## Farbsystem

| Token | Wert | Verwendung |
|---|---|---|
| `colors.brand.primary` | `#2563EB` | Primäraktionen, Links |
| `colors.text.primary` | `#0F172A` | Überschriften |
| `colors.text.muted` | `#64748B` | Hilfstext |
| `colors.border.default` | `#CBD5E1` | Karten, Panels |

Statusfarben: `lib/design/colors.ts` → `colors.status.*`

## Spacing

Basis: **4px**

| Token | px |
|---|---|
| `spacing.1` | 4 |
| `spacing.2` | 8 |
| `spacing.3` | 12 |
| `spacing.4` | 16 |
| `spacing.6` | 24 |
| `spacing.8` | 32 |
| `spacing.12` | 48 |
| `spacing.16` | 64 |

## Border Radius

Nur **12 · 16 · 20 · 24** (`radiusClass.sm` … `radiusClass.xl`).

## Shadows

| Stufe | Verwendung |
|---|---|
| `sm` | Cards, Listen |
| `md` | Hover-Zustände |
| `lg` | Modals, Dropdowns |

## Animationen

| Klasse | Effekt |
|---|---|
| `animationClass.transition` | Standard 300ms |
| `animationClass.hover` | Hover + Shadow |
| `animationClass.fade` | `helpy-fade-in` |
| `animationClass.scale` | Button-Press |

Icon-Größen: **16 · 20 · 24 · 32** (`iconSizeClass.sm` … `iconSizeClass.xl`)

## Beispielcode

### Button

```tsx
import { Button } from "@/components/ui";

<Button variant="primary" size="md">Bestätigen</Button>
<Button variant="secondary" size="sm">Bearbeiten</Button>
<Button variant="ghost">Abbrechen</Button>
```

### Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

<Card variant="workspace">
  <CardHeader>
    <CardTitle>Arbeitsablauf</CardTitle>
  </CardHeader>
  <CardContent>{/* … */}</CardContent>
</Card>
```

### Status Badge

```tsx
import { StatusBadge } from "@/components/ui";

<StatusBadge variant="in-pruefung" />
<StatusBadge variant="bestaetigt" />
<StatusBadge variant="kritisch" />
```

### Panel

```tsx
import { Panel, PanelHeader, PanelBody } from "@/components/ui";
import { Avatar } from "@/components/ui";

<Panel variant="helpy">
  <PanelHeader>{/* Avatar + Titel */}</PanelHeader>
  <PanelBody>{/* Inhalt */}</PanelBody>
</Panel>
```

### Tokens

```tsx
import { surfaces, typography } from "@/lib/design";

<div className={surfaces.card}>
  <p className={typography.bodySm}>Von HELPY vorbereitet – bitte prüfen und bestätigen.</p>
</div>
```

## Migration (schrittweise)

1. Bestehende `@/components/ui/button` Imports funktionieren weiter.
2. Neue Features: `@/components/ui` Barrel verwenden.
3. `lib/ui/design-tokens.ts` → `@/lib/design` (deprecated).
4. `HelpyAvatar` → intern `Avatar`, API unverändert.
5. `VorgangStatusBadge` → intern `StatusBadge`.

## Status Badge Varianten

`neu` · `vorbereitet` · `in-pruefung` · `bestaetigt` · `erledigt` · `kritisch` · `hoch` · `mittel` · `niedrig`
