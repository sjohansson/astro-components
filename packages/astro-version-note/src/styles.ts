/**
 * Default styles for <version-note>. They sit in the `version-note` cascade layer, so any unlayered site rule wins,
 * and inside `:where()`, so specificity never gets in the way. To put them under Tailwind's utilities too, declare the
 * layer first: `@layer version-note;` before `@import "tailwindcss";`.
 *
 * Every timing and size is a custom property. Reduced motion sets the durations to 0s, so a site that wants the
 * animation regardless sets them again on `version-note`.
 */
export const VERSION_NOTE_STYLES = `
@layer version-note {
  :where(version-note) {
    --version-note-duration: 0.5s;
    --version-note-line-duration: 0.4s;
    --version-note-easing: cubic-bezier(0.4, 0, 0.2, 1);
    --version-note-max-height: 8rem;
    --version-note-gap: 1.25rem;
    --version-note-font-size: 0.625rem;
    --version-note-line-color: currentColor;
    --version-note-line-size: 1px;
    display: block;
    max-height: 0;
    overflow: hidden;
    visibility: hidden;
    opacity: 0;
    transition:
      max-height var(--version-note-duration) var(--version-note-easing),
      opacity var(--version-note-duration),
      visibility 0s linear var(--version-note-duration);
  }

  @media (prefers-reduced-motion: reduce) {
    :where(version-note) {
      --version-note-duration: 0s;
      --version-note-line-duration: 0s;
    }
  }

  :where(version-note[open]) {
    max-height: var(--version-note-max-height);
    visibility: visible;
    opacity: 1;
    transition-delay: 0s;
  }

  :where(version-note .version-note) {
    position: relative;
    display: flex;
    gap: var(--version-note-gap);
    align-items: center;
    padding-block: 0.5rem;
    margin-bottom: 0.5rem;
  }

  /* The underline grows from the centre once the panel has opened, and goes first when it closes. */
  :where(version-note .version-note)::after {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 100%;
    height: var(--version-note-line-size);
    content: "";
    background-color: var(--version-note-line-color);
    transform: translateX(-50%) scaleX(0);
    transform-origin: center;
    transition: transform var(--version-note-line-duration) ease-out;
  }

  :where(version-note[open] .version-note)::after {
    transform: translateX(-50%) scaleX(1);
    transition-delay: var(--version-note-duration);
  }

  :where(version-note .version-note__close) {
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    background: none;
    border: 0;
  }

  :where(version-note .version-note__list) {
    display: grid;
    grid-template-columns: auto auto;
    column-gap: var(--version-note-gap);
    margin: 0;
    font-size: var(--version-note-font-size);
  }

  :where(version-note .version-note__label, version-note .version-note__value) {
    margin: 0;
  }
}
`;
