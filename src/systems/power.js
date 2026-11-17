import { PETAL_COUNT } from '../architecture/petals.js';

/** Peak nameplate capacity for 24 perovskite petals (kW). */
const PEAK_KW = 186;

/**
 * Instantaneous generation from irradiance and mean petal-sun alignment.
 */
export function computePowerKW(irradiance, alignment) {
  const thermalDerate = 0.92; // highland cool air advantage
  const inverterEff = 0.97;
  const kw = PEAK_KW * irradiance * Math.max(0.05, alignment) * thermalDerate * inverterEff;
  return Math.round(kw * 10) / 10;
}

export function formatPower(kw) {
  return `${kw.toFixed(1)} kW`;
}

export { PEAK_KW, PETAL_COUNT };
