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

| Trait       | Expression                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| Adventurous | Navigational themes, discovery-based prompts, route progression indicators |
| Grounded    | Earthy tones, field journal textures, analog aesthetic                     |
| Encouraging | Friendly language, progress affirmations, celebratory milestone moments    |
| Clear       | Predictable UX, accessible layouts, minimal jargon                         |
| Focused     | Reduced visual clutter, meaningful typography, frictionless motion         |

---

## 🎨 Visual Identity System

### Color Palette ("Field Guide")

```css
--trail-blue: #4A90E2       /* Primary actions */
--sunset-gold: #F5A623      /* Discovery highlights */
--earth-slate: #2C3E50      /* Primary background */
--rock-gray: #7F8C8D        /* Borders, dividers */
--sky-white: #ECF0F1        /* High contrast text */
--moss-green: #8DA58C       /* Progress indicators */
--path-sand: #DAD2C8        /* Surfaces, cards */
--error-crimson: #C0392B    /* Errors, warnings */
```

Color naming should reflect **natural exploration** rather than IP references. Extend semantic tokens accordingly:

```css
--color-primary
--color-surface
--color-text-default
--color-accent-discovery
--color-map-path
--color-border-subtle
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

* **HeroButton:** Primary CTA with themed border/shadow
* **HeroCard:** Standard info unit with optional texture overlay
* **HeroToggle:** Theme or unit toggle using icon rotation
* **HeroHeader:** Branded header with optional corner decorations
* **DiscoveryIcon:** Themed icons for places, categories, and unlocks

### Visual Assets

* **Textures:** Faint grain, notebook paper, elevation shadows
* **Empty States:** Illustrated icons (e.g., compass, rolled map, binoculars)
* **Navigation:** Icon system reflecting tools (e.g., compass, bootprints, pins)

---

## 📱 UX Patterns

### Motion

* **Subtle only** – glow, elevation, slight translation
* **Screen transitions:** dissolve or map scroll effect
* **Discovery Unlock:** shimmer + vibration

### Spacing & Layout

```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
```

* Card padding: 16px
* Header spacing: 24px from top
* Button height: 44px

### Sound & Haptics

* **Discovery Ping:** chime
* **Route Complete:** low drumbeat or footstep echo
* **Toggle:** satisfying click or rustle

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

* **Seasonal Themes:** Sakura, autumn leaves, frost overlay
* **Field Journal Mode:** Route notes + sketch overlay system
* **Live Map Markers:** Other explorers (opt-in only)
* **Merch Style:** Earth-toned explorer patches, canvas textures

---

> This brand system is designed to reflect Hero's Path’s commitment to real-world movement, curiosity, and grounded discovery. While inspired by fantasy games, its true identity is rooted in exploration, clarity, and joyful movement.

*Last updated: 17 July 2025*
