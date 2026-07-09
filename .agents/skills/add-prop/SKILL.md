---
name: add-prop
description: Walkthrough of adding a server-driven prop control component to the CAVE static layout engine.
---

# Adding a Prop Component

Prop components are server-driven UI elements rendered dynamically based on layout definitions. Follow these steps to implement a new one.

## Implementation Steps

1. **Create the Prop Component**:
   - Create `src/ui/compound/PropMyThing.js`.
   - Adhere to styling guidelines (Emotion object syntax, `sx` prop) and coding standards (no semicolons, Prop-Types validation, named default export).

2. **Export the Component**:
   - Register and export your new component in `src/ui/compound/index.js`.

3. **Add Enums**:
   - Define a unique identifier for the prop type or variant in `src/utils/enums.js` (e.g., under `propId` or `propVariant`).

4. **Register in `renderProp.js`**:
   - Locate `src/ui/views/common/renderProp.js`.
   - Add a mapping case using `R.cond` to link your enum identifier to your new prop component:
     ```js
     const getMyTypePropRenderFn = R.cond([
       [R.equals(propVariant.MY_VARIANT), R.always(PropMyThing)],
       [R.T, invalidVariant('myType')],
     ])
     ```
   - Reference this render function in the top-level `getPropRenderFn`.

5. **Lint and Validate**:
   - Execute `npm run lint` and verify no ESLint or Prettier warnings remain.
