"use strict";

export async function finalResponse({ answer, summary = "" }) {
  return {
    completed: true,
    answer,
    summary,
  };
}
