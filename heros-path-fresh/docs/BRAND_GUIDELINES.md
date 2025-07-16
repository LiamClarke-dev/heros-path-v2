# Hero's Path – Updated Brand Guidelines

## 🌍 Brand Core

### Mission

Empower everyday explorers to find meaning, wonder, and growth through walking adventures — transforming neighborhoods into navigable narratives.

### Vision

To become the definitive companion for exploration-based experiences, where real-world movement drives curiosity and discovery.

### Values

* **Exploration** – Reward curiosity and continual movement.
* **Connection** – Encourage place-based meaning and shared experience.
* **Resilience** – Celebrate progress through steps, not perfection.
* **Focus** – Create calm, intentional moments in a distracted world.
* **Delight** – Infuse everyday activity with subtle joy.

---

## 🧭 Brand Personality

| Trait       | Visual Expression                                                        |
| ----------- | ------------------------------------------------------------------------ |
| Adventurous | Navigational motifs, map-inspired backgrounds, progression indicators    |
| Grounded    | Earthy tones, field journal textures, analog aesthetic                   |
| Encouraging | Friendly language, progress affirmations, celebratory milestone moments  |
| Clear       | Predictable UX, accessible layouts, minimal jargon                       |
| Focused     | Reduced visual clutter, meaningful typography, frictionless interactions |

---

## 🎨 Visual Identity System

### Color Palette ("Field Guide")

| Token                      | Usage                                      | Hex / Value           | Notes                                                                          |
| -------------------------- | ------------------------------------------ | --------------------- | ------------------------------------------------------------------------------ |
| **--color-trail-blue**     | Primary actions, links, highlights         | #4A90E2               | Bright, friendly blue; boost contrast on small tappable elements.              |
| **--color-sunset-gold**    | Accents, call-to-action, discovery markers | #F6AF3C               | Warm gold for “earned” states; use sparingly to avoid overwhelming.            |
| **--color-paper-cream**    | App background, card surfaces              | #FFF7EA               | Soft off-white to reduce eye strain; great for large surfaces.                 |
| **--color-moss-sage**      | Progress bars, secondary highlights        | #739E82               | Muted green for “in-progress” or “success” states.                             |
| **--color-forest-deep**    | Dark backgrounds, nav bars, footers        | #2C5530               | Grounding deep green; use in headers/footers sparingly to maintain legibility. |
| **--color-stone-gray**     | Borders, dividers, disabled states         | #7F8C8D               | Neutral gray to subdue lower-priority elements.                                |
| **--color-shadow-overlay** | Translucent overlays, modals               | rgba(0,0,0,0.4)       | For depth and focus by dimming underlying content.                             |
| **--color-glow-accent**    | Subtle glows or focus rings                | rgba(74,144,226,0.25) | Gentle blue glow for input focus or notification badges.                       |

> **Tip:** Use gradients sparingly—e.g., a subtle two-stop gradient from paper-cream → trail-blue at the top of the header—to add depth without compromising performance.

#### Semantic Tokens

```css
--color-primary
--color-surface
--color-background
--color-text-default
--color-accent
--color-border-subtle
--color-map-path
--color-discovery-highlight
```

### Typography System

* **Primary Font:** Inter or SF Pro (readable, versatile)
* **Adventure Header Font (Optional):** HyliaSerif or alternative serif for headers only

```css
--text-hero-header: 32px/700
--text-section-title: 24px/600
--text-card-title: 18px/600
--text-body: 16px/400
--text-caption: 14px/400
```

Usage:

* Use serif headers only for *quests*, *screen titles*, or *achievements*.
* All body and UI text should default to Inter/Roboto for clarity.

---

## 🧱 Components & Patterns

### Hero Components

* **HeroButton:** Primary CTA with themed border/shadow and pressed-state scale.
* **HeroCard:** Info unit with optional texture overlay and inset glow.
* **HeroToggle:** Theme or unit toggle using icon rotation animations.
* **HeroHeader:** Branded header with corner decorations and accent underline.
* **DiscoveryIcon:** Themed icon set for places, categories, and unlocks.

### Visual Assets

* **Textures:** Faint grain, notebook paper, elevation shadows.
* **Empty States:** Illustrated icons (compass, rolled map, binoculars).
* **Navigation Icons:** Compass, bootprints, map pins — consistent stroke weight.

---

## 🏗️ UI Style Patterns

### 1. Header & Navigation Bars

* **Background:** `--color-forest-deep`
* **Text/Icon:** `--color-paper-cream`
* **Accent Bar:** 4px bottom border in `--color-sunset-gold` to echo map routes

### 2. Cards & Surfaces

* **Background:** `--color-paper-cream`
* **Shadow:** `0 2px 8px rgba(0,0,0,0.1)`
* **Border:** 1px solid `--color-stone-gray`
* **Inset Glow (Adventure Mode):** 2px glow in `--color-glow-accent`

### 3. Buttons & CTAs

* **Primary BG:** `--color-trail-blue` / **Text:** #FFFFFF
* **Secondary:** transparent BG, `--color-trail-blue` border & text
* **Disabled:** BG `--color-stone-gray`, text `rgba(255,255,255,0.6)`

### 4. Icons & Illustrations

* **Stroke:** 2px, rounded caps
* **Active Fill:** `--color-trail-blue` or `--color-moss-sage`
* **Disabled:** `--color-stone-gray`
* **Spot Art:** Monochrome in `--color-forest-deep` with gold accent for emphasis

### 5. Overlays & Modals

* **Backdrop:** `--color-shadow-overlay`
* **Modal BG:** `--color-paper-cream`, 8px radius
* **Close Icon:** `--color-forest-deep`

### Motion & Interaction

* **Tap Feedback:** 80% → 100% scale bounce with glow accent
* **Discovery Unlock:** 200ms shimmer in sunset-gold across card
* **Route Complete:** Confetti burst in blue & gold
* **Screen Transitions:** Dissolve or map-scroll effect
* **Micro-animations:** gentle elevation and glow on focus

### Spacing System

```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
```

* Card padding: 16px
* Header margin: 24px from top
* Button height: 44px

---

## 🧠 Voice & Tone

| Context     | Tone                   | Example Text                                          |
| ----------- | ---------------------- | ----------------------------------------------------- |
| Onboarding  | Warm, exciting         | "Your first journey starts now. Ready to explore?"    |
| During Walk | Encouraging, observant | "You've discovered a new path — nice find."           |
| Settings    | Calm, clear            | "Change themes or adjust your journey style."         |
| Errors      | Helpful, non-blocking  | "That didn’t quite work — try again or go back."      |
| Milestones  | Celebratory, grounded  | "1000 steps — one small step for you, big win today." |

---

## 🔭 Future Extensions

* **Seasonal Themes:** Sakura petals, autumn leaves overlay, frost shimmer
* **Field Journal Mode:** Route notes with sketch overlay
* **Live Explorer Markers:** Opt‑in map pins for community tracking
* **Merch & Collateral:** Canvas texture patches, leather-bound guidebook mockups

---

> This brand system reflects **Hero's Path’s** dedication to real-world movement, grounded discovery, and subtle delight. Its identity is born from exploration itself — clear, focused, and full of wonder.

*Last updated: July 2025*
