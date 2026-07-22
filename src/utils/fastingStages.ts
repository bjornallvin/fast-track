// The biological arc of a fast, keyed by hours since the last meal.
// Stage boundaries follow the commonly cited fasting-physiology timeline
// (fed state → glycogen → metabolic switch → ketosis → autophagy → renewal).
// Times are approximate — everybody's switch flips at its own pace.

export interface FastingStage {
  from: number; // stage begins at this many hours
  name: string;
  body: string; // what is happening in the body right now
  quotes: string[]; // rotating encouragement, one shown per hour
}

export const FASTING_STAGES: FastingStage[] = [
  {
    from: 0,
    name: 'Fed & digesting',
    body: 'Your body is still absorbing the last meal. Insulin is elevated and glucose is the main fuel — energy is being stored, not yet drawn.',
    quotes: [
      'Every fast begins with a single decision — you have already made it.',
      'The journey of the next hours starts quietly, right here.',
    ],
  },
  {
    from: 4,
    name: 'Settling in',
    body: 'Digestion is winding down and insulin is falling. Your body is switching to stored liver glycogen for fuel.',
    quotes: [
      'The calm before the switch — your body knows exactly what to do.',
      'Nothing to do but let your biology work. It has done this for millennia.',
    ],
  },
  {
    from: 8,
    name: 'Tapping the reserves',
    body: 'Liver glycogen is steadily draining, and fat burning is starting to ramp up to fill the gap.',
    quotes: [
      'You are crossing the bridge from sugar to fat.',
      'This is where routine ends and the real fast begins.',
    ],
  },
  {
    from: 12,
    name: 'The metabolic switch',
    body: 'Glycogen is mostly depleted. Fat is becoming your main fuel and the liver is producing its first ketones.',
    quotes: [
      'The switch is flipping — everything from here runs on your own reserves.',
      'Hunger comes in waves, not walls. This one will pass.',
    ],
  },
  {
    from: 16,
    name: 'Early ketosis',
    body: 'Ketone levels are rising and your brain is starting to use them. Many people notice hunger fading and mental clarity improving.',
    quotes: [
      'Your body has found its rhythm — enjoy the clear-headed calm.',
      'What felt hard at hour 12 often feels light at hour 18.',
    ],
  },
  {
    from: 24,
    name: 'Autophagy ramps up',
    body: 'Cellular cleanup accelerates: worn-out proteins and cell parts are being recycled. Growth hormone rises to protect muscle while fat supplies the energy.',
    quotes: [
      'Your cells are spring-cleaning — old parts out, fresh energy in.',
      'A full day. Most people never find out what their body can do — you are finding out now.',
    ],
  },
  {
    from: 48,
    name: 'Deep ketosis & repair',
    body: 'You are fully fat-adapted. Insulin sensitivity is resetting, inflammation is dialing down, and immune-cell recycling is underway.',
    quotes: [
      'Two days in — this is genuine renewal, not just willpower.',
      'Deep waters, steady breath. You have far more reserve than you feel.',
    ],
  },
  {
    from: 72,
    name: 'Profound fast',
    body: 'Deep autophagy continues and the body begins signalling stem-cell-driven regeneration, rebuilding parts of the immune system.',
    quotes: [
      'You are in rare territory. Listen to your body — and be proud.',
      'Beyond three days, the fast is no longer about food at all.',
    ],
  },
];

export function getFastingStage(totalHours: number): {
  stage: FastingStage;
  next: FastingStage | null;
  quote: string;
} {
  let index = 0;
  for (let i = 0; i < FASTING_STAGES.length; i++) {
    if (totalHours >= FASTING_STAGES[i].from) index = i;
  }
  const stage = FASTING_STAGES[index];
  const next = FASTING_STAGES[index + 1] ?? null;
  // Deterministic hourly rotation so the line changes over the fast
  const quote = stage.quotes[Math.floor(Math.max(totalHours, 0)) % stage.quotes.length];
  return { stage, next, quote };
}
