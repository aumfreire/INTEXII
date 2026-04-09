# Haven for Girls — Frontend Design System

> **Purpose:** This file is a complete design reference for AI tools building new pages for the Haven for Girls website. Feed this file as context so that generated pages match the existing look and feel exactly.

## Tech Stack

- **Framework:** React 19, Vite 8, TypeScript 6
- **Styling:** Custom CSS with CSS variables (no Tailwind, no CSS-in-JS, no SCSS)
- **Grid/Utilities:** Bootstrap 5.3 — grid system and display/spacing utilities only (no Bootstrap JS components)
- **Icons:** Lucide React (import icons individually, e.g. `import { Heart } from 'lucide-react'`)
- **Routing:** React Router DOM v7 (`BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`)
- **Fonts:** Google Fonts — Playfair Display (headings), DM Sans (body) — loaded via `index.html`
- **Images:** WebP format, stored in `src/assets/haven/`

---

## 1. Design Tokens

All tokens are defined as CSS custom properties in `src/index.css` `:root`.

### Colors

```css
--color-primary:      #C1603A     /* Burnt orange — brand accent, links, icons, accent borders */
--color-primary-dark:  #ab553a    /* Darker rust — button backgrounds, hover active states, CTA band bg */
--color-primary-light: #D4927A    /* Lighter terracotta — labels, focus rings, stat numbers on dark bg */
--color-cream:         #FAF6F0    /* Warm off-white — alternating section bg, hero text, navbar bg */
--color-sand:          #E8DDD0    /* Warm sand — subtle accents (reserved) */
--color-sage:          #7A9E7E    /* Muted green — success states, positive notes */
--color-dark:          #1C1008    /* Charcoal brown — primary text, headings, footer bg, hero overlay base */
--color-dark-mid:      #2C2420    /* Medium dark — secondary dark text (reserved) */
--color-muted:         #858481    /* Gray — secondary text, descriptions, labels */
--color-light:         #fdfcf8    /* Very light cream — button text on primary bg */
--color-white:         #ffffff    /* Pure white — card backgrounds, default page bg */
--color-blush:         #FFF5F0    /* Light pink — soft bg accent (reserved) */
--color-green-light:   #F0F7F1   /* Light green bg — positive states (reserved) */
--color-light-gray:    #e8e5e0   /* Warm gray — borders, dividers, default input borders */
```

### Typography

```css
--font-heading: 'Playfair Display', Georgia, 'Times New Roman', serif;
--font-body:    'DM Sans', system-ui, -apple-system, sans-serif;
```

| Element | Desktop | Mobile (<=768px) | Weight | Line-height |
|---------|---------|------------------|--------|-------------|
| h1 | 3rem | 2.25rem | 700 | 1.2 |
| h2 | 2.25rem | 1.75rem | 600 | 1.2 |
| h3 | 1.5rem | 1.25rem | 600 | 1.2 |
| Body | 16px (1rem) | 16px | 400 | 1.6 |
| Small text | 0.85–0.95rem | same | 500 | varies |
| Labels | 0.82–0.9rem | same | 500–600 | — |

- All headings use `font-heading` by default (set globally).
- Body text uses `font-body` by default (set on `body`).
- **Exception:** Footer column headings explicitly use `font-family: var(--font-body)`.

### Shadows

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
```

### Border Radii

```css
--radius-sm: 6px;   /* Buttons, inputs, small elements */
--radius-md: 12px;  /* Cards, step cards, modals */
--radius-lg: 20px;  /* Large cards (signup), hero images */
```

### Transitions

```css
--transition-fast:   0.15s ease;  /* Color, border, opacity changes */
--transition-normal: 0.25s ease;  /* Transform, box-shadow, expand/collapse */
```

---

## 2. Global Base Styles

Defined in `src/index.css` and `src/App.css`:

```css
/* Box model */
*, *::before, *::after { box-sizing: border-box; }

/* Scroll */
html { scroll-behavior: smooth; }

/* Body */
body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-dark);
  background-color: var(--color-white);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root { min-height: 100vh; }

/* Headings — all use Playfair Display */
h1–h6 {
  font-family: var(--font-heading);
  color: var(--color-dark);
  margin-top: 0;
  line-height: 1.2;
}

/* Links */
a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}
a:hover { color: var(--color-primary-dark); }

/* Images */
img { max-width: 100%; height: auto; }
```

### Page Shell (App.tsx + App.css)

```
<Router>
  <ScrollToTop />
  <div class="page-wrapper">        ← flex column, min-height: 100vh
    <Navbar />
    <main class="page-content">     ← flex: 1
      <Routes>...</Routes>
    </main>
    <Footer />
  </div>
</Router>
```

New pages are added as `<Route>` entries inside `<Routes>` in `src/App.tsx`. Navbar and Footer wrap every page automatically.

### Loading Spinner

```css
@keyframes spin { to { transform: rotate(360deg); } }
.spin-icon { animation: spin 1s linear infinite; }
```

Used with Lucide `Loader2` icon for button loading states.

---

## 3. UI Components

All located in `src/components/ui/`. Components use **inline styles** with CSS variable references and `onMouseEnter`/`onMouseLeave` handlers for hover effects.

### PrimaryButton

**File:** `src/components/ui/PrimaryButton.tsx`

```typescript
interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;          // renders as <Link> when provided
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;    // adds w-100
  loading?: boolean;      // shows Loader2 spinner, disables
}
```

**Visual specs:**
- Background: `var(--color-primary-dark)`
- Text: `var(--color-light)`, 1rem, weight 600
- Padding: `12px 28px`
- Border: none
- Border-radius: `var(--radius-sm)`
- Display: `inline-flex`, center, gap `8px`
- Hover: bg → `var(--color-primary)`, `translateY(-1px)`, `shadow-md`
- Disabled/Loading: opacity 0.7, cursor not-allowed

### SecondaryButton

**File:** `src/components/ui/SecondaryButton.tsx`

```typescript
interface SecondaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  light?: boolean;        // cream border/text for dark backgrounds
}
```

**Visual specs:**
- Background: transparent
- Border: `2px solid var(--color-primary-dark)` (or `var(--color-cream)` when `light`)
- Text: `var(--color-primary-dark)` (or `var(--color-cream)` when `light`)
- Padding: `12px 28px`
- Border-radius: `var(--radius-sm)`
- Hover: bg → `rgba(193, 96, 58, 0.08)` (or `rgba(255, 255, 255, 0.1)` when light), `translateY(-1px)`

### Card

**File:** `src/components/ui/Card.tsx`

```typescript
interface CardProps {
  icon?: ReactNode;       // Lucide icon, rendered in primary color
  title: string;          // h3, 1.2rem
  description: string;    // p, 0.95rem, muted
  className?: string;
  accentColor?: string;   // top border color (4px solid)
  children?: ReactNode;   // slot for action links below description
}
```

**Visual specs:**
- Background: `var(--color-white)`
- Border-radius: `var(--radius-md)`
- Padding: `28px`
- Shadow: `var(--shadow-sm)`
- Optional top accent border: `4px solid {accentColor}`
- Uses `h-100` Bootstrap class for equal-height grids
- Hover: `translateY(-4px)`, shadow → `var(--shadow-md)`

### FormInput

**File:** `src/components/ui/FormInput.tsx`

```typescript
interface FormInputProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;         // shows red border + error text
  required?: boolean;     // shows * in primary color
  icon?: ReactNode;       // positioned left (12px), shifts input padding
  disabled?: boolean;
  children?: ReactNode;   // positioned right (4px), used for password toggle
}
```

**Visual specs:**
- Wrapper: margin-bottom `16px`
- Label: `0.9rem`, weight 500, `var(--color-dark)`
- Input: full width, padding `10px 12px` (40px left with icon, 44px right with children)
- Border: `1.5px solid var(--color-light-gray)` (or `var(--color-primary)` on error)
- Border-radius: `var(--radius-sm)`
- Focus: border → `var(--color-primary-light)`, box-shadow `0 0 0 3px rgba(193, 96, 58, 0.15)`
- Error text: `0.82rem`, `var(--color-primary)`, margin-top `4px`

### SectionHeading

**File:** `src/components/ui/SectionHeading.tsx`

```typescript
interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  label?: string;          // uppercase text above title
  centered?: boolean;      // default: true
  light?: boolean;         // default: false — white text for dark sections
}
```

**Visual specs:**
- Label: `0.85rem`, weight 600, uppercase, letter-spacing `1.5px`, `var(--color-primary)` (or `primary-light` when light)
- Title: h2, `var(--color-dark)` (or white when light)
- Divider: `50px` wide, `3px` tall, `var(--color-primary)` (or `primary-light`), border-radius `2px`
- Subtitle: `1.1rem`, `var(--color-muted)` (or `rgba(255,255,255,0.85)`), max-width `600px`, line-height `1.7`

### TestimonialCard

**File:** `src/components/ui/TestimonialCard.tsx`

```typescript
interface TestimonialCardProps {
  quote: string;
  name: string;
  role?: string;
}
```

**Visual specs:**
- Background: `var(--color-cream)`
- Border-radius: `var(--radius-md)`
- Padding: `28px`
- Quote icon (Lucide `Quote`): `28px`, `var(--color-primary-light)`, opacity `0.7`
- Quote text: italic, `1rem`, `var(--color-dark)`, line-height `1.7`, wrapped in curly quotes
- Avatar: `40px` circle, `var(--color-primary)` bg, white initials (`0.85rem`, weight 600)
- Name: `0.95rem`, weight 600 | Role: `0.85rem`, muted
- Uses `h-100` for equal-height grids

### CountUpStat

**File:** `src/components/ui/CountUpStat.tsx`

```typescript
interface CountUpStatProps {
  end: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  duration?: number;      // default: 2000ms
}
```

Uses `useCountUp` hook (`src/hooks/useCountUp.ts`): IntersectionObserver (threshold 0.3), ease-out cubic animation via requestAnimationFrame.

**CSS classes** (defined in `src/styles/pages/landing.css`):
- `.impact-stat`: text-align center, padding 20px
- `.stat-number`: Playfair Display, `2.75rem` (2.25rem mobile), weight 700, `var(--color-primary-light)`
- `.stat-label`: `rgba(255,255,255,0.75)`, `0.95rem`, weight 500

### AlertBanner

**File:** `src/components/ui/AlertBanner.tsx`

```typescript
interface AlertBannerProps {
  message: string;
  type?: 'info' | 'success' | 'warning';
  onClose?: () => void;
}
```

**Variants:**
| Type | Background | Border | Icon |
|------|-----------|--------|------|
| info | `rgba(193,96,58,0.08)` | `var(--color-primary-light)` | Info |
| success | `rgba(122,158,126,0.12)` | `var(--color-sage)` | CheckCircle |
| warning | `rgba(193,96,58,0.12)` | `var(--color-primary)` | AlertTriangle |

**Visual specs:** padding `12px 16px`, border-radius `var(--radius-sm)`, font `0.9rem`, gap `12px`, margin-bottom `16px`

### FAQAccordion

**File:** `src/components/ui/FAQAccordion.tsx`

```typescript
interface FAQAccordionProps {
  items: { question: string; answer: string }[];
}
```

**Visual specs:**
- Single open at a time (openIndex state)
- Item border-bottom: `1px solid var(--color-light-gray)`
- Button: full width, flex between, padding `18px 0`, `1.05rem`, weight 500, `var(--font-body)`, color `var(--color-dark)` (note: source uses `var(--color-charcoal)` which is undefined — falls back to inherited dark color)
- ChevronDown: rotates 180deg when open, transition `var(--transition-normal)`
- Answer: max-height `0→500px` + opacity `0→1`, `0.95rem`, muted, line-height `1.7`

---

## 4. Layout Components

### Navbar

**File:** `src/components/layout/Navbar.tsx`

- Position: sticky, top 0, z-index 1000
- Background: `var(--color-cream)`
- Border-bottom: `1px solid rgba(0,0,0,0.06)`
- Box-shadow: `0 1px 4px rgba(0,0,0,0.04)`
- Height: `70px`
- Container: `className="container"` + `padding: 0 24px`

**Logo:** Shield icon (28px, filled, primary) + "Haven" (Playfair Display, 1.35rem, weight 700)

**Desktop nav** (visible at `lg` / 992px+, uses `d-none d-lg-flex`):
- Links: `0.95rem`, weight 500, padding `8px 16px`, radius-sm
- Active link: `var(--color-primary)`, weight 600
- Donate button: primary-dark bg, light text, `10px 22px`, `0.9rem` weight 600
- Donate hover: bg → primary, `translateY(-1px)`

**Mobile:** hamburger (Menu/X icons), collapsible menu with same links stacked vertically

### Footer

**File:** `src/components/layout/Footer.tsx`

- Background: `var(--color-dark)`
- Text: `rgba(255,255,255,0.8)`
- Padding: `60px 0 0`

**Grid:** Bootstrap `row g-4` with columns:
- `col-lg-4 col-md-6` — Brand: logo, mission text, social icons (Globe, MessageCircle, Camera, Play)
- `col-lg-2 col-md-6` — Organization: 5 links
- `col-lg-2 col-md-6` — Get Involved: 5 links (Donate uses React Router `Link`)
- `col-lg-4 col-md-6` — Contact: MapPin/Phone/Mail + newsletter email input + Subscribe button

**Social icons:** 36px circles, bg `rgba(255,255,255,0.1)`, icon color `rgba(255,255,255,0.7)`, hover: bg → primary, color → white

**Column headings:** `font-family: var(--font-body)` (NOT Playfair), `1rem`, weight 600, white

**Links:** `0.9rem`, `rgba(255,255,255,0.7)`, hover → `var(--color-primary-light)`

**Newsletter input:** padding `8px 12px`, border `1px solid rgba(255,255,255,0.2)`, bg `rgba(255,255,255,0.05)`, white text

**Subscribe button:** padding `8px 16px`, primary-dark bg, white text, radius-sm, `0.85rem` weight 600

**Copyright bar:** border-top `1px solid rgba(255,255,255,0.1)`, margin-top `40px`, padding `20px 24px`, `0.85rem`, `rgba(255,255,255,0.5)`

---

## 5. Page Layout Patterns

### LandingPage

**File:** `src/pages/LandingPage.tsx` + `src/styles/pages/landing.css`

**Section sequence:**
1. **Hero** (`.hero-section`) — 85vh min-height, bg image (`hero-main.webp`), dark overlay gradient
2. **Mission** (`.mission-section`) — white bg, 80px padding
3. **Impact** (`.impact-section`) — dark bg, 80px padding
4. **Help** (`.help-section`) — cream bg, 80px padding
5. **Stories** (`.stories-section`) — white bg, 80px padding
6. **CTA Band** (`.cta-band`) — primary-dark bg, 80px padding

**Hero details:**
- Overlay gradient: `linear-gradient(to right, rgba(28,16,8,0.82) 0%, rgba(28,16,8,0.55) 50%, rgba(28,16,8,0.2) 100%)`
- Content: max-width 680px, on the left
- Label pattern: decorative line (40px x 2px, cream 50% alpha) + uppercase text + letter-spacing 2px
- h1: 3.5rem, cream, line-height 1.1 (2.5rem mobile)
- Subtitle: 1.1rem, cream 75% alpha, line-height 1.7
- Buttons row: flex, gap 16px — PrimaryButton + SecondaryButton (light)

**Mission:** SectionHeading + CSS grid `1fr 1fr`, gap 48px (1fr on mobile, gap 32px). Image with radius-lg + shadow-lg. Text in muted, line-height 1.8.

**Impact:** SectionHeading (light) + Bootstrap `row` with 4x `col-6 col-md-3` CountUpStat.

**Help:** SectionHeading + `row g-4` with 3x `col-md-4` Card (with accent border + action links).

**Stories:** SectionHeading + `row g-4` with 3x `col-md-4` TestimonialCard.

**CTA Band:** Centered h2 (cream) + p (cream 85% alpha, max-width 550px) + buttons (cream bg solid + cream border outline).

### DonationPage

**File:** `src/pages/DonationPage.tsx` + `src/styles/pages/donation.css`

**Structure:**
1. **Hero** (`.donation-hero`) — 380px min-height (260px mobile), same overlay pattern
2. **Content** (`.donation-content`) — cream bg, Bootstrap `row` with `col-lg-8` (form) + `col-lg-4` (sidebar)

**Form pattern:** Step cards (`.donate-step-card`) — white bg, radius-md, 32px padding, shadow-sm, 20px margin-bottom. Step titles use numbered format ("1.", "2.") in Playfair 1.2rem.

**Sidebar:** Sticky (top 90px). Gift summary card (dark header + white body rows). Gift supports card (white, shadow-sm).

**Amount grid:** 6-col CSS grid → 3-col at 768px → 2-col at 480px. Selectable buttons with `.selected` class.

**Success state:** Centered, sage CheckCircle 64px, thank you message, PrimaryButton to reset.

### LoginPage

**File:** `src/pages/LoginPage.tsx` + `src/styles/pages/login.css`

**Layout:** Flex row, min-height `calc(100vh - 70px)`. Stacks at 991px.
- **Left panel** (`.login-image-panel`): 45% width, bg image (`login-panel.webp`), overlay gradient (top-to-bottom, 0.55→0.7). Logo, quote (Playfair 1.6rem), welcome text, 3 stat boxes (glass effect: `rgba(255,255,255,0.1)` bg + `backdrop-filter: blur(4px)`).
- **Right panel** (`.login-form-panel`): flex center, white bg, max-width 440px form. Back link, h2, subtitle, FormInputs (email + password with toggle), forgot password link, PrimaryButton fullWidth. Security info box. Signup link.

### SignUpPage

**File:** `src/pages/SignUpPage.tsx` + `src/styles/pages/login.css`

**Layout:** `.signup-page` — centered flex, cream bg, min-height `calc(100vh - 70px)`.
- `.signup-card`: white bg, radius-lg, padding `44px 40px` (32px 28px mobile), shadow-lg, max-width 500px.
- Form: name row (2x `col-6`), email, password + confirm (with toggles), terms checkbox, PrimaryButton. Divider ("or") + Google social button. Login link.

---

## 6. Common Patterns

### Hero Sections

- Full-width bg image: `background-size: cover; background-position: center; background-repeat: no-repeat`
- Image format: WebP, stored in `src/assets/haven/`
- Dark gradient overlay (absolute positioned, inset 0, z-index 1):
  - Content pages (left-to-right): `rgba(28,16,8, 0.82→0.55→0.2)`
  - Login panel (top-to-bottom): `rgba(28,16,8, 0.55→0.7)`
- Content: relative, z-index 2, max-width 620–680px, positioned left
- Label: decorative line (40px x 2px) + uppercase text + letter-spacing 2px

### Section Rhythm

- Standard padding: `80px 0` desktop, `48px 0` mobile (768px breakpoint)
- Container: `<div className="container" style={{ padding: '0 24px' }}>`
- Background alternation: white → cream → dark → cream → white → primary-dark (CTA)
- Start most sections with `<SectionHeading>` (except hero/CTA)

### Card Grids

- Bootstrap `<div className="row g-4">` with `col-md-4` (3-up) or `col-md-6` (2-up)
- Cards use `h-100` via `className` for equal height

### Form Patterns

- Use `FormInput` component for all inputs
- Validation: `errors` state as `Record<string, string>`, clear per-field on change
- Loading: `isSubmitting` boolean → `PrimaryButton loading` prop
- Form element has `noValidate` (custom validation only)
- Password toggle: `Eye`/`EyeOff` icons in `FormInput` children slot

### Responsive Breakpoints

| Breakpoint | Usage |
|------------|-------|
| `max-width: 480px` | Small mobile: donation amount grid → 2-col |
| `max-width: 768px` | Typography scales down, section padding 80→48px, grids collapse to 1-col |
| `max-width: 991px` | Login splits stack, navbar collapses to hamburger at `lg` (992px) |

---

## 7. AI Composition Guidance

### Creating a New Page

1. Create component in `src/pages/NewPage.tsx`
2. Create CSS in `src/styles/pages/newpage.css` (import at top of component)
3. Add route in `src/App.tsx` inside `<Routes>`: `<Route path="/new" element={<NewPage />} />`
4. Page is automatically wrapped by Navbar + Footer via App.tsx
5. Component returns `<>...</>` (fragment) containing `<section>` elements

### Section Structure Template

```tsx
<section className="my-section" style={{ padding: '80px 0', backgroundColor: 'var(--color-cream)' }}>
  <div className="container" style={{ padding: '0 24px' }}>
    <SectionHeading
      label="Section Label"
      title="Section Title"
      subtitle="Optional subtitle text here."
    />
    {/* Content */}
  </div>
</section>
```

### Color Usage Rules

| Color | Use For | Never Use For |
|-------|---------|--------------|
| `primary` / `primary-dark` | CTAs, accent borders, button bg, icons, links | Large background areas (except CTA band) |
| `cream` | Alternating section bg, hero text, navbar bg | Primary text |
| `dark` | Text, headings, footer bg, impact section bg | — |
| `muted` | Secondary text, descriptions, labels, icons | Headings |
| `white` | Card backgrounds, default page bg, button text on dark | — |
| `sage` | Success states, positive indicators | Primary actions |
| `light-gray` | Borders, dividers, default input borders | Text, backgrounds |
| `primary-light` | Labels, focus rings, stat numbers on dark bg, hover accents | Button backgrounds |

### Typography Hierarchy

- **Page title (h1):** Only in hero sections. Playfair Display, cream color on dark overlay.
- **Section title (h2):** Use via `SectionHeading` component. Never use raw h2.
- **Card/subsection title (h3):** 1.2rem when inside cards, default 1.5rem elsewhere.
- **Body text:** DM Sans, `var(--color-muted)` for descriptions, `var(--color-dark)` for primary content.
- **Labels:** Uppercase, 0.82–0.9rem, weight 600, letter-spacing 1.5–2px.

### Hover & Interaction Patterns

- **Buttons:** `translateY(-1px)`, bg color shift, optional shadow-md
- **Cards:** `translateY(-4px)`, shadow-sm → shadow-md
- **Links:** Color shift (primary → primary-dark)
- **Inputs:** Border color + box-shadow ring on focus
- **All transitions** use CSS variable duration (`--transition-fast` or `--transition-normal`)

### Do's

- Use existing UI components from `src/components/ui/` — don't recreate buttons, cards, or form inputs
- Use Bootstrap grid classes (`row`, `col-md-*`, `g-4`) for layouts
- Use Bootstrap display utilities (`d-none`, `d-lg-flex`) for responsive show/hide
- Use inline styles for component-specific styling (matches existing codebase pattern)
- Use CSS files in `src/styles/pages/` for page-level styles with semantic class names (e.g. `.about-hero`, `.about-section`)
- Use Lucide React for all icons (`import { IconName } from 'lucide-react'`)
- Use WebP images stored in `src/assets/haven/`
- Use the container pattern: `<div className="container" style={{ padding: '0 24px' }}>`
- Use CSS variable names (`var(--color-primary)`) — never hardcode hex values
- Add `id` attributes to sections for anchor-link navigation from the navbar

### Don'ts

- Do not add Tailwind, CSS-in-JS libraries, or SCSS
- Do not use Bootstrap component JS (dropdowns, modals, etc.) — only CSS grid/utilities
- Do not use custom fonts beyond Playfair Display and DM Sans
- Do not create global CSS classes that could conflict — prefix with page name (e.g. `.about-hero` not `.hero`)
- Do not use `rem` units below `0.8rem`
- Do not add `!important` rules
- Do not use `styled-components` or `emotion`
- Do not create new shared components for one-off use — inline or use page CSS
- Do not put page CSS in `index.css` or `App.css` — those are global only

---

## 8. Icon Reference

Common Lucide React icons used across the site:

| Category | Icons |
|----------|-------|
| Navigation | `Menu`, `X`, `ArrowLeft`, `ArrowRight`, `ChevronDown` |
| Brand | `Shield` (filled, primary) |
| Actions | `Heart`, `HandHeart`, `Users`, `BookOpen` |
| Form | `Mail`, `Lock`, `User`, `Eye`, `EyeOff`, `CreditCard` |
| Status | `CheckCircle`, `AlertTriangle`, `Info`, `Loader2` |
| Social | `Globe`, `MessageCircle`, `Camera`, `Play` |
| Contact | `Phone`, `MapPin` |
| Misc | `Quote`, `RefreshCw` |

Import individually: `import { Heart, Shield } from 'lucide-react';`
Default sizes: 16–28px depending on context. Color via inline style.

---

## 9. File Structure Reference

```
src/
├── main.tsx                    # Entry: imports Bootstrap CSS + index.css
├── App.tsx                     # Router, page shell (Navbar/Footer wrap)
├── App.css                     # .page-wrapper, .page-content
├── index.css                   # Design tokens + global base styles
├── assets/haven/               # WebP images
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Sticky nav, responsive hamburger
│   │   └── Footer.tsx          # 4-column footer, newsletter
│   └── ui/
│       ├── PrimaryButton.tsx
│       ├── SecondaryButton.tsx
│       ├── Card.tsx
│       ├── FormInput.tsx
│       ├── SectionHeading.tsx
│       ├── TestimonialCard.tsx
│       ├── CountUpStat.tsx
│       ├── AlertBanner.tsx
│       └── FAQAccordion.tsx
├── hooks/
│   └── useCountUp.ts           # IntersectionObserver + rAF animation
├── pages/
│   ├── LandingPage.tsx
│   ├── DonationPage.tsx
│   ├── LoginPage.tsx
│   └── SignUpPage.tsx
└── styles/pages/
    ├── landing.css             # Hero, mission, impact, help, stories, CTA
    ├── donation.css            # Donation hero, step cards, amount grid, sidebar
    └── login.css               # Login split layout, signup card
```
