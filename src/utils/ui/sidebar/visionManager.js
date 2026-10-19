"use strict";

/**
 * Vision Manager
 * Handles camera screenshot flash effects and enlarged screenshot lightbox modal.
 */

export function getVisionManagerCode() {
  return `
  // --------------------------------------------------------------------------
  // Screenshot & Vision Manager (Cleaned: no unstyled preview elements in body)
  // --------------------------------------------------------------------------
  const existingModal = document.getElementById("as-screenshot-modal");
  if (existingModal) existingModal.remove();
  const existingFlash = document.getElementById("as-screenshot-flash");
  if (existingFlash) existingFlash.remove();

  function openScreenshotModal(b64) {
    // Enlarged screenshot preview removed to prevent page overflow
  }

  function triggerScreenshotFlash() {
    // Flash effect disabled
  }
  `;
}
