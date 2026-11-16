import { slidesA } from './slides_a.js';
import { slidesB } from './slides_b.js';

export function buildSlides(W) {
  return [...slidesA(W), ...slidesB(W)];
}
