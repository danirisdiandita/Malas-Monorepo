# Mobile Design System

This app follows the Yuzu mobile system in `savor.pen`. The Pencil file is the visual source of truth for composition, color, navigation, and component shape. When a screen is not represented there, use these rules.

## Priority

1. Clarity and readable hierarchy.
2. Consistent spacing, typography, and interaction patterns.
3. Accessible touch targets and contrast.
4. Pencil visual style and polish.

Prefer a clear, familiar native interaction over a decorative interaction. Each screen has one primary action. Keep secondary actions visibly subordinate.

## Colors

Use semantic names rather than ad hoc colors:

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#17211B` | Primary text, primary buttons |
| Paper | `#F7F6F1` | Main screen background |
| Leaf | `#6E9B62` | Accent, selected states, links |
| Sage | `#DDE8D6` | Soft cards, selected surfaces |
| Tomato | `#E87955` | Add actions and food accents |
| Sun | `#F1C75B` | Highlight and upgrade actions |
| Muted | `#6E786F` | Secondary text and inactive controls |
| Line | `#D9E1D7` | Borders and dividers |

Keep body text and controls high contrast against `Paper` and white cards. Do not use color as the only way to communicate state.

## Typography

Use the existing platform sans font unless the screen already loads a specific brand font. Keep text large enough to scan without zooming:

| Role | Size | Weight | Use |
| --- | ---: | --- | --- |
| Screen title | 28–30 | Bold | Main screen heading |
| Section title | 20–22 | Bold | Content group heading |
| Body | 16 | Regular | Explanations and primary content |
| Secondary | 14 | Regular | Supporting descriptions |
| Button label | 14–16 | Bold | Actions |
| Caption | 12 | Regular | Metadata and helper text |
| Eyebrow | 11 | Bold | Uppercase context labels, with letter spacing |

Avoid text below 12px except for non-essential metadata. Support long text, Dynamic Type, and wrapping. Never put important information in an icon or tiny label alone.

## Layout and spacing

- Use a 4px base scale; prefer `4`, `8`, `12`, `16`, `24`, and `32`.
- Use 16–20px horizontal screen padding.
- Use 24–32px between major sections and 8–16px between related items.
- Keep screen titles near the top and the primary action reachable in the lower half.
- Use `SafeAreaView` from `react-native-safe-area-context`.
- Use `ScrollView` when content can exceed a small device height.
- Avoid absolute positioning for normal content.

## Controls

- Minimum interactive target: 44×44px, even when the visible icon is smaller.
- Primary buttons: 48–52px high, `14–16px` radius, Ink background, white label.
- Accent buttons: Sun background with Ink label.
- Soft buttons: Sage background with Leaf label.
- Text links use Leaf and remain readable at 14px or larger.
- Give pressed, disabled, loading, and error states clear visual feedback.
- Use one icon family consistently: Ionicons in the app implementation, matching the simple line icons in Pencil.

## Cards and fields

- Use white cards on Paper with a 1px Line border.
- Use 14–18px corner radii for cards and fields.
- Use 20–24px radii for prominent illustration panels.
- Search fields are at least 44px high with an icon, placeholder, and clear focus state.
- Keep card content concise; use hierarchy instead of adding more decoration.

## Navigation

The bottom navigation follows Pencil’s compact five-item pattern:

- Recipes, Groceries, Add, Planner, Profile.
- Always show both icon and label for every item, selected or not.
- Labels are approximately 10–12px; selected items use Leaf and inactive items use Muted.
- The Add action may use Tomato as its emphasized action.
- Keep the navigation stable across tab screens.

## States and behavior

Every interactive screen must account for loading, empty, success, error, and disabled states when those states are possible. Local mockup actions may use local state or navigation when no backend exists, but they must still provide immediate feedback.

Use confirmation for destructive actions such as sign-out or deletion. Keep authentication and private routes protected regardless of visual state.

## Review checklist

- Is the primary action obvious within two seconds?
- Can the smallest text be read comfortably on a phone?
- Are all controls at least 44px to touch?
- Are selected and unselected states clear without relying only on color?
- Does the screen handle long text without clipping?
- Does the screen match the Pencil composition and semantic tokens?
