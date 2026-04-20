export { kawaiiThemes } from "./kawaii";
export { lessIsMoreThemes } from "./less-is-more";
export { seventiesThemes } from "./seventies";

import { kawaiiThemes } from "./kawaii";
import { lessIsMoreThemes } from "./less-is-more";
import { seventiesThemes } from "./seventies";

/**
 * All bundled theme families combined into a single array.
 * Includes kawaii, less-is-more, and seventies with all their variants.
 */
export const allBundledThemes = [...kawaiiThemes, ...lessIsMoreThemes, ...seventiesThemes];
