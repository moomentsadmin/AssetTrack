# Asset Management System - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Modern SaaS Dashboard Pattern

**Justification:** This is a utility-focused, data-heavy enterprise application requiring efficient information presentation, complex forms, and clear visual hierarchy. Drawing inspiration from Linear, Notion, and modern enterprise dashboards for clean data management interfaces.

**Core Principles:**
- Information clarity over visual flair
- Consistent, predictable interactions
- Efficient workflows for power users
- Professional, trustworthy aesthetic

---

## Color Palette

### Dark Mode (Primary)
- **Background Base:** 222 15% 9%
- **Surface Elevated:** 222 15% 12%
- **Surface Overlay:** 222 15% 15%
- **Border Subtle:** 222 10% 20%
- **Border Default:** 222 8% 25%

### Light Mode
- **Background Base:** 0 0% 98%
- **Surface Elevated:** 0 0% 100%
- **Surface Overlay:** 220 20% 97%
- **Border Subtle:** 220 13% 91%
- **Border Default:** 220 13% 85%

### Brand & Accent Colors
- **Primary Brand:** 217 91% 60% (Professional blue for CTAs, active states)
- **Success:** 142 71% 45% (Asset available, completed actions)
- **Warning:** 38 92% 50% (Warranty expiring, pending returns)
- **Danger:** 0 84% 60% (Critical issues, asset lost)
- **Info:** 199 89% 48% (Information badges, help text)

### Text Colors (Dark Mode)
- **Primary Text:** 0 0% 95%
- **Secondary Text:** 0 0% 70%
- **Tertiary Text:** 0 0% 50%
- **Disabled:** 0 0% 35%

---

## Typography

### Font Families
- **Primary:** 'Inter', system-ui, -apple-system, sans-serif
- **Monospace:** 'JetBrains Mono', 'Fira Code', monospace (for serial numbers, IDs)

### Type Scale & Styles
- **H1 (Dashboard Titles):** text-3xl (30px) / font-bold / tracking-tight
- **H2 (Section Headers):** text-2xl (24px) / font-semibold / tracking-tight
- **H3 (Card Titles):** text-lg (18px) / font-semibold
- **Body Large:** text-base (16px) / font-normal
- **Body Default:** text-sm (14px) / font-normal
- **Caption:** text-xs (12px) / font-medium / text-muted
- **Labels:** text-sm (14px) / font-medium / tracking-wide / uppercase (for form labels)

---

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 4, 6, 8, 12, 16, 20, 24**

**Application:**
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Form field spacing: space-y-4
- Table cell padding: px-4 py-3

### Grid & Container
- **Max Container Width:** max-w-7xl mx-auto
- **Dashboard Layout:** Sidebar (240px fixed) + Main content (flex-1)
- **Card Grid:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- **Form Layout:** max-w-2xl for single-column forms, grid-cols-2 gap-6 for multi-column

---

## Component Library

### Navigation
**Sidebar Navigation:**
- Fixed left sidebar (240px) with collapsible option
- Icon + label navigation items
- Active state: bg-surface-elevated + border-l-2 border-primary
- Group sections with subtle dividers
- User profile card at bottom with role badge

**Top Bar:**
- Search bar (global asset search)
- Notification bell with badge counter
- User menu dropdown
- Quick actions button (+ New Asset)

### Data Display

**Tables:**
- Header: bg-surface-elevated, sticky top-0, font-medium text-sm
- Rows: hover:bg-surface-elevated, border-b border-subtle
- Alternating row colors for improved scanning (optional zebra striping)
- Action buttons in row: visible on hover
- Compact mode: py-2 for dense data, py-3 for comfortable
- Column sorting indicators
- Checkbox column for bulk actions

**Cards:**
- Asset Cards: border border-default, rounded-lg, p-6
- Hover state: border-primary, subtle shadow
- Card header: Asset name + status badge
- Card body: Grid layout for key details
- Card footer: Assignment info + action buttons
- Depreciation cards: Visual progress bar for value loss

**Status Badges:**
- Available: bg-success/10 text-success border border-success/20
- Assigned: bg-info/10 text-info border border-info/20
- In Maintenance: bg-warning/10 text-warning border border-warning/20
- Retired/Lost: bg-danger/10 text-danger border border-danger/20
- Pill shape: rounded-full px-3 py-1 text-xs font-medium

### Forms & Inputs

**Input Fields:**
- Background: bg-surface-overlay (dark) / bg-white (light)
- Border: border border-default, focus:border-primary focus:ring-2 focus:ring-primary/20
- Height: h-10 for standard inputs
- Padding: px-4
- Label above input: text-sm font-medium mb-2
- Helper text: text-xs text-tertiary mt-1
- Error state: border-danger, text-danger helper text

**Select & Dropdowns:**
- Match input styling
- Custom dropdown: absolute, bg-surface-elevated, shadow-lg, rounded-lg
- Options: hover:bg-surface-overlay, px-4 py-2

**Textareas (Notes):**
- Min height: min-h-[120px]
- Resize: resize-y

**File Upload:**
- Drag-and-drop zone with dashed border
- CSV/Excel upload: Shows file preview before import
- Upload button: Primary style with icon

**Form Layout:**
- Field groups with clear visual separation (mb-6)
- Required field indicator: Red asterisk
- Action buttons: Right-aligned, Primary + Ghost pairing

### Dashboard Components

**Metric Cards:**
- Grid layout: 4 cards across on desktop
- Large number: text-3xl font-bold
- Label: text-sm text-secondary
- Trend indicator: Small arrow + percentage change
- Icon in top-right: w-8 h-8 opacity-50

**Charts:**
- Depreciation graph: Line chart with gradient fill
- Asset distribution: Donut chart with legend
- Color palette matches status colors
- Tooltips on hover with detailed info

**Activity Feed:**
- Timeline design with connecting line
- Icon indicators for action types
- Timestamp: text-xs text-tertiary
- User avatar + action description

### Modals & Overlays

**Modal Structure:**
- Backdrop: bg-black/50 backdrop-blur-sm
- Container: bg-surface-elevated, max-w-2xl, rounded-xl, shadow-2xl
- Header: border-b border-subtle, p-6
- Body: p-6, max-h-[70vh] overflow-y-auto
- Footer: border-t border-subtle, p-6, flex justify-end gap-3

**Confirmation Dialogs:**
- Warning icon for destructive actions
- Clear primary action (danger for delete)

### Buttons

**Primary:** bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg font-medium
**Secondary:** bg-surface-overlay border border-default hover:bg-surface-elevated
**Ghost:** hover:bg-surface-overlay text-secondary
**Danger:** bg-danger text-white hover:bg-danger/90
**Icon Buttons:** w-9 h-9 rounded-lg hover:bg-surface-overlay

---

## Interactions & Microanimations

**Minimal Animation Approach:**
- Hover transitions: transition-colors duration-150
- Modal entrance: fade-in + scale-up (duration-200)
- Toast notifications: slide-in from top-right
- Loading states: Subtle spinner, skeleton screens for tables
- NO decorative animations

---

## Visual Hierarchy Patterns

**Dashboard Priority:**
1. Key metrics (large, top)
2. Recent activity / alerts
3. Quick actions
4. Detailed tables/lists

**Asset Detail View:**
1. Asset header (name, status, actions)
2. Primary details grid
3. Assignment history timeline
4. Notes & attachments section
5. Depreciation calculator

**Forms:**
1. Form title + description
2. Required fields first
3. Optional/advanced fields in expandable section
4. Actions footer (sticky on scroll)

---

## Responsive Behavior

**Desktop (lg:):** Full sidebar, multi-column layouts, expanded tables
**Tablet (md:):** Collapsible sidebar, 2-column grids, horizontal scroll tables
**Mobile (base):** Hidden sidebar (hamburger menu), single column, card-based lists instead of tables

---

## Accessibility Standards

- WCAG 2.1 AA compliant contrast ratios
- Focus indicators: 2px ring offset-2 ring-primary
- Keyboard navigation for all interactive elements
- ARIA labels for icon-only buttons
- Form validation with screen reader announcements
- Dark mode maintains text contrast (minimum 4.5:1)