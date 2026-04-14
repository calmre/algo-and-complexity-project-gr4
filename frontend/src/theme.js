/**
 * ─────────────────────────────────────────────
 *  THEME — edit colors here, save, and refresh
 * ─────────────────────────────────────────────
 *
 *  Every value maps to a CSS variable used across the app.
 *  Accepts any valid CSS color: hex, rgb(), hsl(), etc.
 */

const theme = {

  // ── Backgrounds ──────────────────────────────
  '--bg-page':          '#0f0f13',   // page / body background
  '--bg-surface':       '#1a1a28',   // cards, inputs, panels
  '--bg-surface-deep':  '#12121e',   // deeper inset areas (modal form bg)
  '--bg-overlay':       '#22203a',   // selected calendar cell, hover states

  // ── Borders ───────────────────────────────────
  '--border-subtle':    '#2a2a3a',   // default borders
  '--border-hover':     '#4a4a6a',   // hovered borders

  // ── Brand / Accent ────────────────────────────
  '--accent':           '#6c5ce7',   // primary purple — buttons, active states, dots
  '--accent-hover':     '#7d6ef0',   // accent on hover
  '--accent-glow':      'rgba(108, 92, 231, 0.5)',  // FAB shadow
  '--accent-glow-hover':'rgba(108, 92, 231, 0.7)',  // FAB shadow on hover

  // ── Text ──────────────────────────────────────
  '--text-primary':     '#e0e0f0',   // main body text
  '--text-secondary':   '#aaa',      // secondary / muted text
  '--text-muted':       '#888',      // placeholders, labels
  '--text-faint':       '#666',      // very dim text, loading
  '--text-disabled':    '#555',      // strikethrough / done tasks
  '--text-heading':     '#c8b8ff',   // header h1, modal title, calendar detail heading

  // ── Scrollbar ─────────────────────────────────
  '--scrollbar-track':  '#1a1a24',
  '--scrollbar-thumb':  '#3a3a52',

  // ── Danger ────────────────────────────────────
  '--danger':           '#e74c3c',   // delete hover, recording state

  // ── Toggle / Nav buttons ──────────────────────
  '--toggle-bg':        '#1a1a28',   // pill background for display/time toggles
  '--toggle-active-bg': '#6c5ce7',   // active pill fill  (defaults to accent)
  '--toggle-active-text': '#fff',

  // ── Calendar ──────────────────────────────────
  '--cal-today-border': '#6c5ce7',   // today cell border
  '--cal-day-label':    '#555',      // Mon Tue Wed labels
  '--cal-dot':          '#6c5ce7',   // task dot color
  '--cal-dot-done':     '#444',      // completed task dot

  // ── FAB (floating add button) ─────────────────
  '--fab-bg':           '#6c5ce7',
  '--fab-text':         '#fff',

}

export default theme
