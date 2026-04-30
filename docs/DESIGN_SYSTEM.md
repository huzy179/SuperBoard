# SuperBoard Design System

## 1. Visual Tone: Refined Technical Minimalism 🎯

The current aesthetic direction for SuperBoard is **Refined Technical Minimalism**. It is inspired by modern developer tools like Linear and Vercel, focusing on speed, clarity, and intentionality.

### Core Principles

1. **Precise**: Every pixel serves a purpose; no decorative clutter.
2. **Technical**: A powerful tool for power users, embracing data density without feeling overwhelming.
3. **Fluid**: Real-time updates and optimistic UI make the interface feel alive and responsive.
4. **Information Density with Breathing Room**: Use a precise 4pt spacing scale to keep things dense but never crowded.
5. **Typography as Hierarchy**: Rely on font weight, size, and careful spacing instead of borders and shadows.
6. **Perceptual Color Consistency**: Use OKLCH for all color tokens to maintain visual harmony across light and dark themes.

### References & Anti-references

- **References**: Linear, Vercel, modern dev tools.
- **Anti-references**: Cluttered legacy Jira, generic "AI-generated" bubbly gradients, large radii (`rounded-[3rem+]`).

---

## 2. Legacy Design Context (Notion-inspired) 🏛️

_Note: This section is kept for historical context and reference. The project is migrating towards the Technical Minimalism standards defined above._

### Notion-inspired Atmosphere

The original design system was built on warm neutrals rather than cold grays, creating an approachable minimalism.

- **Palette**: Warm neutrals (`#f6f5f4`, `#31302e`, `#615d59`).
- **Text**: Near-black `rgba(0,0,0,0.95)` instead of pure black.
- **Borders**: Ultra-thin `1px solid rgba(0,0,0,0.1)` (whisper-weight).
- **Shadows**: Multi-layer stacks with cumulative opacity < 0.05.
- **Typography**: NotionInter (modified Inter) with negative letter-spacing at display sizes.

---

## 3. Implementation Guidelines

- **Theme**: Adaptive (respects system preferences), focus on high-contrast dark mode.
- **Spacing**: 4pt base unit.
- **Motion**: Framer Motion for state transitions (e.g., drawer openings, task movements).
- **Color Tokens**: Standardized in `packages/ui`.
