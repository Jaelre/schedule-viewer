# UI Rationalization: Top Bar & Navigation

## 1. Context & Problem Statement

The current `ScheduleApp` top bar acts as the command center for the application, housing critical controls:
- **Navigation:** `MonthNav` (Month selection).
- **Configuration:** `DensityToggle` (Row height/font size).
- **View Control:** View Mode (Shift-centric vs. Person-centric).
- **Information/Feedback:** `LegendModal` trigger and `FeedbackButton`.

### Current Implementation Analysis
The current layout uses a simple flexbox strategy that does not scale elegantly:

```tsx
// Abstracted current layout
<div className="flex flex-col sm:flex-row ...">
  <MonthNav />       // Left
  <FeedbackButton /> // Center
  <RightControls />  // Right (Density + View Mode)
</div>
```

**Identified Issues:**
1.  **Mobile (< 640px):** The layout stacks vertically into 3 logical rows (Month, Feedback, Density/View), consuming excessive vertical screen real estate. This pushes the actual schedule content (the primary value) down, forcing users to scroll before seeing data.
2.  **Tablet / Mid-size (640px - 1024px):** The layout attempts a single row, but the combined width of components often exceeds the viewport width.
    - `DensityToggle` with its label and 3 text buttons is very wide (~350px+).
    - `MonthNav` is ~200px.
    - `FeedbackButton` centered creates risk of overlap or crushing neighboring elements.
3.  **Visual Noise:** "Densità:" label and long button text ("Ultra compatta", "Confortevole") add unnecessary cognitive load and width.

## 2. Rationalization Strategy

The goal is to maximize the viewable area for the schedule while keeping controls accessible.

### Design Principles
1.  **Content First:** The Top Bar should be as compact as possible to prioritize the grid.
2.  **Adaptive Complexity:** Show full controls on large screens; collapse secondary controls into menus/icons on small screens.
3.  **Grouping:** Logically group "Navigation" (Time) separate from "View Settings" (Density, Mode, Legend).

## 3. Proposed Layouts

### A. Mobile Layout (< 640px)
*Goal: Maximum visibility for critical actions without menus. Two tight rows.*

**Constraint Checklist:**
- [x] Feedback: Prominent text button (Top priority).
- [x] Navigation: Accessible.
- [x] Controls: Visible (No burger menu).
- [x] Density/Legend: Compact (Single letter/Icon).

**Layout Structure:**
```
Row 1 (Primary): [MonthNav (Compact)] [Spacer] [Feedback Button]
Row 2 (Controls): [View Toggle] [Spacer] [Density (U/C/C)] [Legend (?)]
```

*Visual:*
```
+---------------------------------------+
| [<] Jan '26 [>]            [Feedback] |
+---------------------------------------+
| [People/Shifts]        [U|C|C]  [?]   |
+---------------------------------------+
```

- **Row 1:** High-value interaction.
    - `MonthNav`: Reduced to `< MMM 'YY >`.
    - `FeedbackButton`: Full "Feedback" text, high contrast.
- **Row 2:** Display configuration.
    - `View Toggle`: Segmented control, possibly just icons or shortened text "Ppl | Sfts".
    - `Density`: Segmented control showing `U | C | C` (Ultra/Compact/Comfortable).
    - `Legend`: Simple `?` or `i` icon button.

### B. Tablet / Mid Layout (640px - 1024px)
*Goal: Single row, high density.*

**Layout:**
```
[MonthNav] [Spacer] [View Toggle] [Density (Compact)] [Legend (?)] [Feedback]
```

- **Density:** Use the compact "Single Letter" version from mobile to save space.
- **Legend:** Icon only.
- **Feedback:** Full Button.

### C. Desktop Layout (> 1024px)
*Goal: Standard ergonomic spacing.*

**Layout:**
```
[MonthNav] [Spacer] [View Toggle] [Density (Full Text)] [Legend (Text+Icon)] [Feedback]
```

## 4. Component Redesign Proposals

### 1. `ResponsiveTopBar` (New Wrapper)
A dedicated layout component to manage the flex/grid behavior.

```tsx
<div className="flex flex-col gap-2 p-2 bg-card border-b border-border">
  {/* Mobile Row 1 / Desktop Left & Right split */}
  <div className="flex items-center justify-between gap-2">
     <MonthNav />
     <div className="hidden sm:flex ...">...desktop controls...</div>
     <FeedbackButton className="sm:hidden" /> {/* Mobile only position */}
  </div>
  
  {/* Mobile Row 2 */}
  <div className="flex sm:hidden items-center justify-between gap-2">
     <ViewToggle />
     <div className="flex items-center gap-1">
       <DensityToggle mode="compact" />
       <LegendTrigger mode="icon" />
     </div>
  </div>
</div>
```

### 2. `DensityToggle` (Refactor)
Add `variant` prop.
- `full`: "Ultra compatta", "Compatta", "Confortevole" (Desktop).
- `compact`: "U", "C", "C" (Mobile/Tablet).

### 3. `ViewToggle` (Refactor)
Extract from `ScheduleApp.tsx` into its own component.
- Needs `variant` prop or CSS container queries.
- Mobile: "Ppl | Sfts" or Icons.
- Desktop: "Vista medici | Vista turni".

### 4. `LegendTrigger` (Refactor)
Extract the button logic.
- Mobile: Circle button with `?`.
- Desktop: Button "Legenda".

## 5. Implementation Roadmap

1.  **Refactor `DensityToggle`:** Accept a `mode` prop to support a compact rendering (dropdown or simple select).
2.  **Move Feedback Button:** Remove the layout logic that centers it. Group it with the right-side controls.
3.  **Create `MobileMenu`:** Implement a simple toggle state that shows the secondary controls in a absolute positioned panel or simple expansion area.
4.  **Update `ScheduleApp` Layout:** Apply the `flex justify-between` pattern:
    - Left: `MonthNav`
    - Right: `ControlsContainer` (flex row gap-2)

### Detailed Visual Spec (Draft)

**Mobile:**
```
+---------------------------------------+
| [<] Jan 2026 [>]           [Settings] |
+---------------------------------------+
```
*(Clicking Settings reveals)*
```
+---------------------------------------+
| Mode: [People] | [Shifts]           |
| Density: [Ultra] [Compact] [Comfy]  |
| [Legend] [Feedback]                   |
+---------------------------------------+
```

**Desktop:**
```
+-----------------------------------------------------------------------+
| [<] Jan 2026 [>]      [People/Shifts]  [Density: U|C|C]  [Legend] [?] |
+-----------------------------------------------------------------------+
```

## 6. Open Questions
- **Icon System:** Do we have an icon set (e.g., Lucide, Heroicons) available for the "Settings"/"Menu" button? *Action: Check `package.json` or `node_modules`.*
- **Feedback Importance:** Is "Feedback" critical enough to be top-level on mobile? *Assumption: No, can be in menu.*
