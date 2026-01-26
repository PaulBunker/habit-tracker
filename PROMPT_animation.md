# FLIP Animation Fix - Close Icon Stagger

## Methodology

**Follow `/capture-animation` skill for the complete process.**
**Consult `/gsap-animation-expert` skill for animation patterns.**

---

## Context

- **Iteration plan:** `.claude/plans/flip-animation-iteration.md`
- **Component:** `packages/frontend/src/components/HabitItem.tsx`
- **Current state:** Clone-based hero animation working well (99% done)

---

## Current Issue

The **X close button** is visible throughout the animation but should:
- **Open**: Hidden initially, then stagger in WITH the content
- **Close**: Stagger out WITH the content, then hidden

Currently the X button just sits there during the morph animation which looks odd.

---

## Expected Animation

**Open:**
1. Card morphs into modal
2. Title clone floats to modal header
3. X button is HIDDEN during morph
4. Clone removed, h2 revealed
5. X button staggers in WITH content (View Calendar button, form fields, etc.)

**Close:**
1. X button staggers out WITH content
2. Title clone created and flies toward card
3. Modal morphs back to card
4. X button should NOT be visible during morph

---

## Implementation Hint

The content stagger already targets `.view-buttons, .settings-form, .settings-actions`. Add `.close-btn` to this selector so the X button staggers with the content.

```tsx
// Open - hide initially, stagger in:
const content = modal.querySelectorAll('.close-btn, .view-buttons, .settings-form, .settings-actions');
gsap.set(content, { opacity: 0, y: 10 });
// ... later stagger them in

// Close - stagger out:
tl.to(modal.querySelectorAll('.close-btn, .view-buttons, .settings-form, .settings-actions'), {
  opacity: 0,
  ...
});
```

---

## Success Criteria

Verify with filmstrip captures:

- [ ] Open: X button NOT visible during morph (frames 0-400ms)
- [ ] Open: X button staggers in WITH content (after ~400ms)
- [ ] Close: X button staggers out WITH content at start
- [ ] Close: X button NOT visible during morph phase
- [ ] Title animation still works correctly (no regressions)

---

## Validation

1. Capture `open` animation - verify X button hidden in early frames, visible in later frames
2. Capture `close` animation - verify X button fades out early, not visible during morph
3. Create frame-by-frame table showing X button state at each timestamp

---

## Exit Conditions

**SUCCESS**: X button properly staggers in/out with content, verified with frame-by-frame evidence.

**STUCK**: After 3 iterations, add `<stuck>NEEDS_HUMAN_REVIEW</stuck>`.
