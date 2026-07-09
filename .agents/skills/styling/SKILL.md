---
name: styling
description: Style components using Emotion object syntax, MUI sx prop, custom themes, and dark-mode styling rules.
---

# Styling Guidelines

`cave_static` uses MUI v9 and Emotion CSS-in-JS. Follow these strict rules to keep the styling system consistent.

## General Rules

1. **Object Syntax Only**:
   - Emotion CSS-in-JS must use object syntax only.
   - Template literals (e.g. `css`backtick`) are banned.
   - Example of correct styling:
     ```js
     const styles = {
       root: {
         display: 'flex',
         gap: 1, // MUI spacing unit
       },
     }
     ```

2. **MUI `sx` Prop**:
   - Use the `sx` prop for element-level styling instead of inline `style={{ ... }}` objects.
   - Define a top-level `styles` object before the component.
   - If merging external `sx` props and internal styles, use an array:
     ```js
     <Box sx={[styles.root, ...forceArray(sx)]} />
     ```

3. **No Deep Imports**:
   - Avoid deep imports (e.g. `@mui/material/styles/createTheme` or `@mui/material/Box/Box` is banned).
   - Import directly from `@mui/material` or `@mui/x-data-grid` / `@mui/x-date-pickers`.

4. **Rich & Harmonious Aesthetics**:
   - Avoid plain primary colors. Use custom themes and palette values like `greyscale` or `background.paper`.
   - The application enforces a consistent Dark Mode palette.
