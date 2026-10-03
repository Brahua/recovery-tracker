// Mock data for the three demo patients (docs/specs/demo-mode-spec.md). Pure and deterministic:
// the same profile and the same "today" always give the same data, and every date is relative to
// today, so the demo never looks stale. Plain ESM so it runs under `node`; covered by
// scripts/demo/seed-data.test.mjs, which checks every row against the database constraints.

/** @typedef {"knee" | "ankle" | "shoulder"} ProfileId */

const LIMA_UTC_OFFSET = "-05:00";

// ---------------------------------------------------------------- dates and randomness

export function limaToday(now = new Date()) {
  return new Date(now.getTime() - 5 * 3_600_000).toISOString().slice(0, 10);
}

export function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday. */
function weekday(dateKey) {
  return (new Date(`${dateKey}T00:00:00.000Z`).getUTCDay() + 6) % 7;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (from, to, t) => from + (to - from) * t;
const pad = (value) => String(value).padStart(2, "0");

// ------------------------------------------------------------------------ exercise doses

// A dose is a [start, end] range that moves with the recovery progress p (0 = first day of the
// data, 1 = yesterday). `from`/`to` limit the progress range in which the exercise is practiced.
//   sets, reps, weight (kg), hold (s), minutes, km
function dose(spec, p) {
  const at = (range) => (Array.isArray(range) ? lerp(range[0], range[1], p) : range);
  const sets = [];
  if (spec.sets) {
    const setCount = Math.round(at(spec.sets));
    for (let position = 0; position < setCount; position += 1) {
      const set = { position };
      if (spec.reps) set.reps = Math.round(at(spec.reps));
      if (spec.weight) {
        const weight = Math.round(at(spec.weight) * 2) / 2;
        if (weight > 0) set.weightKg = weight;
      }
      if (spec.hold) set.holdSeconds = Math.max(5, Math.round(at(spec.hold) / 5) * 5);
      sets.push(set);
    }
  }
  return {
    sets,
    durationMinutes: spec.minutes ? Math.round(at(spec.minutes)) : undefined,
    distanceKm: spec.km ? Math.round(at(spec.km) * 10) / 10 : undefined,
  };
}

const isIsometric = (spec) => Boolean(spec.hold);

// ---------------------------------------------------------------------------- profile data

/**
 * Per profile: the catalog, the weekly plan, the pain curves and the free text. `plan(p, day)`
 * returns that day's sessions; the physio treatments and the notes are picked by recovery phase.
 */
const profiles = {
  knee: {
    span: 47,
    pain: [6.5, 1.5],
    stiffness: [2.6, 0.6],
    sleepHours: [6.0, 7.6],
    sleepQuality: [2.0, 4.0],
    energy: [2.4, 4.0],
    flares: [{ daysAgo: 22, length: 3, bump: 2.2, note: "Me pasé caminando y se hinchó." }],
    catalog: {
      heel_slide: {
        name: "Deslizamiento de talón",
        sets: 3,
        reps: [10, 15],
        to: 0.45,
        archived: true,
      },
      slr: { name: "Elevación de pierna recta", sets: 3, reps: [10, 15], weight: [0, 2] },
      tke: { name: "Extensión terminal con banda", sets: 3, reps: [12, 15] },
      bike: { name: "Bicicleta estática", minutes: [8, 20], from: 0.1 },
      bridge: { name: "Puente de glúteos", sets: 3, reps: [10, 15], weight: [0, 10], from: 0.1 },
      wall_sit: { name: "Sentadilla en pared", sets: 3, hold: [15, 45], from: 0.25 },
      mini_squat: { name: "Mini sentadilla", sets: 3, reps: [8, 12], weight: [0, 10], from: 0.35 },
      step_up: { name: "Step-up", sets: 3, reps: [6, 10], weight: [0, 6], from: 0.55 },
      balance: { name: "Equilibrio en una pierna", sets: 3, hold: [15, 45], from: 0.4 },
      rdl: { name: "Peso muerto rumano", sets: 3, reps: [8, 10], weight: [8, 20], from: 0.65 },
      leg_press: {
        name: "Prensa de piernas",
        sets: 3,
        reps: [10, 12],
        weight: [20, 50],
        from: 0.6,
      },
      ham_stretch: { name: "Estiramiento de isquiotibiales", sets: 2, hold: 30 },
      walk: { name: "Caminata", minutes: [15, 40], km: [1, 3.2] },
    },
    routines: [
      {
        name: "Casa · fuerza de rodilla",
        keys: ["slr", "tke", "bridge", "wall_sit", "mini_squat"],
      },
      { name: "Gimnasio · piernas", keys: ["bike", "leg_press", "rdl", "step_up", "balance"] },
    ],
    plan(p, day) {
      const home = ["heel_slide", "slr", "tke", "bridge", "wall_sit", "mini_squat", "ham_stretch"];
      const gym = ["bike", "leg_press", "rdl", "step_up", "balance"];
      if (day === 0) return [{ type: "HOME", at: [8, 30], keys: home }];
      if (day === 1 || day === 3)
        return [{ type: "PHYSIOTHERAPY", at: [17, 0], keys: ["bike", "slr", "tke", "wall_sit"] }];
      if (day === 2)
        return [
          { type: p > 0.6 ? "GYM" : "HOME", at: [p > 0.6 ? 19 : 8, 0], keys: p > 0.6 ? gym : home },
        ];
      if (day === 4)
        return [
          { type: "HOME", at: [8, 15], keys: home },
          ...(p > 0.2 ? [{ type: "WALK", at: [18, 30], keys: ["walk"] }] : []),
        ];
      if (day === 5) return [{ type: "WALK", at: [10, 0], keys: ["walk"] }];
      return [];
    },
    treatments(p, day) {
      const base = [
        {
          category: "PHYSICAL_AGENT",
          modality: "CRYOTHERAPY",
          bodyZone: "Rodilla anterior",
          minutes: 10,
        },
        {
          category: "MANUAL_THERAPY",
          modality: "JOINT_MOBILIZATION",
          bodyZone: "Rodilla anterior",
          minutes: 15,
        },
      ];
      if (p < 0.35) {
        return [
          ...base,
          {
            category: "PHYSICAL_AGENT",
            modality: "ELECTROTHERAPY",
            bodyZone: "Cuádriceps",
            minutes: 15,
          },
          ...(day === 1
            ? [
                {
                  category: "MANUAL_THERAPY",
                  modality: "LYMPHATIC_DRAINAGE",
                  bodyZone: "Rodilla anterior",
                  minutes: 15,
                },
              ]
            : []),
        ];
      }
      if (p < 0.7) {
        return [
          {
            category: "PHYSICAL_AGENT",
            modality: "TECAR",
            bodyZone: "Rodilla medial",
            minutes: 15,
          },
          { category: "MANUAL_THERAPY", modality: "MASSAGE", bodyZone: "Cuádriceps", minutes: 10 },
          base[1],
        ];
      }
      return [
        {
          category: "PHYSICAL_AGENT",
          modality: "TECAR",
          bodyZone: "Tendón rotuliano",
          minutes: 10,
        },
        {
          category: "MANUAL_THERAPY",
          modality: "MASSAGE",
          bodyZone: "Isquiotibiales",
          minutes: 10,
        },
        ...(day === 3
          ? [{ category: "TAPING", modality: "KINESIO_TAPE", bodyZone: "Rodilla anterior" }]
          : []),
      ];
    },
    therapistNotes: [
      "Mantener la pierna elevada después de la sesión. Hielo 15 minutos, dos veces al día. Evitar giros con el pie apoyado.",
      "Subir a 3 series de sentadilla en pared. Revisar la hinchazón por la tarde.",
      "Puede empezar step-up bajo. Progresar la carga de a poco, sin pasar de dolor 3.",
    ],
    sessionNotes: [
      "Sin dolor durante los ejercicios.",
      "Sentí tirantez al final, se calmó con hielo.",
      "Hoy la rodilla estaba más suelta.",
      "Hinchazón leve a la tarde.",
      "Terminé cansada pero contenta.",
    ],
    closeoutNotes: [
      "Día tranquilo, la rodilla respondió bien.",
      "Me costó bajar escaleras.",
      "Un poco de rigidez al levantarme.",
      "Dormí con una almohada bajo la rodilla.",
      "Caminé más de lo planeado, mañana descanso.",
    ],
    goals: [
      { title: "Caminar 30 minutos seguidos", createdDaysAgo: 40, achievedDaysAgo: 12 },
      { title: "Dormir sin molestia en la rodilla", createdDaysAgo: 40, achievedDaysAgo: 5 },
      { title: "Subir escaleras sin dolor", createdDaysAgo: 40, achievedDaysAgo: null },
      { title: "Hacer una sentadilla completa", createdDaysAgo: 30, achievedDaysAgo: null },
      { title: "Volver a trotar suave", createdDaysAgo: 20, achievedDaysAgo: null },
    ],
  },

  ankle: {
    span: 36,
    pain: [7.0, 1.8],
    stiffness: [2.4, 0.8],
    sleepHours: [6.4, 7.6],
    sleepQuality: [2.4, 4.0],
    energy: [2.6, 4.0],
    flares: [{ daysAgo: 13, length: 2, bump: 2.4, note: "Pisé mal en una vereda y se hinchó." }],
    catalog: {
      abc: { name: "Alfabeto con el pie", sets: 2, reps: [2, 3], to: 0.5 },
      circles: { name: "Círculos de tobillo", sets: 3, reps: [10, 20] },
      towel: { name: "Arrastre de toalla con los dedos", sets: 3, reps: [10, 15], to: 0.6 },
      iso_wall: { name: "Isométrico de tobillo contra la pared", sets: 3, hold: [10, 20], to: 0.5 },
      dorsi: { name: "Dorsiflexión con banda", sets: 3, reps: [12, 15], from: 0.1 },
      evers: { name: "Eversión con banda", sets: 3, reps: [10, 15], from: 0.25 },
      invers: { name: "Inversión con banda", sets: 3, reps: [10, 15], from: 0.25 },
      calf_raise: {
        name: "Elevación de talones",
        sets: 3,
        reps: [8, 15],
        weight: [0, 10],
        from: 0.3,
      },
      balance: { name: "Equilibrio en una pierna", sets: 3, hold: [10, 60], from: 0.3 },
      unstable: {
        name: "Equilibrio sobre superficie inestable",
        sets: 3,
        hold: [15, 40],
        from: 0.55,
      },
      bike: { name: "Bicicleta estática", minutes: [8, 20], from: 0.2 },
      squat: { name: "Sentadilla", sets: 3, reps: [10, 12], weight: [0, 12], from: 0.45 },
      hop: { name: "Saltos suaves en el lugar", sets: 3, reps: [8, 12], from: 0.8 },
      calf_stretch: { name: "Estiramiento de gemelos", sets: 2, hold: 30, from: 0.15 },
      pool_walk: { name: "Caminata en piscina", minutes: [15, 25], from: 0.3, to: 0.85 },
      walk: { name: "Caminata", minutes: [10, 35], km: [0.5, 2.5], from: 0.1 },
    },
    routines: [
      { name: "Banda y movilidad", keys: ["circles", "dorsi", "evers", "invers", "calf_stretch"] },
      { name: "Equilibrio y fuerza", keys: ["calf_raise", "balance", "unstable", "squat"] },
    ],
    plan(p, day) {
      const early = ["abc", "circles", "towel", "iso_wall", "dorsi", "calf_stretch"];
      const band = [
        "circles",
        "dorsi",
        "evers",
        "invers",
        "calf_raise",
        "balance",
        "unstable",
        "calf_stretch",
      ];
      const strength = ["bike", "squat", "calf_raise", "balance", "unstable", "hop"];
      const home = p < 0.3 ? early : band;
      if (day === 0 || day === 2) return [{ type: "HOME", at: [8, 0], keys: home }];
      if (day === 1 || day === 3)
        return [
          {
            type: "PHYSIOTHERAPY",
            at: [16, 30],
            keys: ["circles", "dorsi", "evers", "invers", "balance"],
          },
        ];
      if (day === 4)
        return [
          {
            type: p > 0.75 ? "GYM" : "HOME",
            at: [p > 0.75 ? 18 : 8, 0],
            keys: p > 0.75 ? strength : home,
          },
        ];
      if (day === 5) {
        return p > 0.3 && p < 0.85
          ? [{ type: "HYDROTHERAPY", at: [10, 30], keys: ["pool_walk"] }]
          : p >= 0.85
            ? [{ type: "WALK", at: [10, 0], keys: ["walk"] }]
            : [];
      }
      return p > 0.5 ? [{ type: "WALK", at: [17, 0], keys: ["walk"] }] : [];
    },
    treatments(p, day) {
      if (p < 0.3) {
        return [
          { category: "PHYSICAL_AGENT", modality: "CRYOTHERAPY", bodyZone: "Tobillo", minutes: 10 },
          {
            category: "MANUAL_THERAPY",
            modality: "LYMPHATIC_DRAINAGE",
            bodyZone: "Tobillo",
            minutes: 15,
          },
          {
            category: "PHYSICAL_AGENT",
            modality: "ULTRASOUND",
            bodyZone: "Ligamento lateral del tobillo",
            minutes: 8,
          },
          { category: "TAPING", modality: "FUNCTIONAL_TAPE", bodyZone: "Tobillo" },
        ];
      }
      if (p < 0.7) {
        return [
          { category: "PHYSICAL_AGENT", modality: "TECAR", bodyZone: "Tobillo", minutes: 15 },
          {
            category: "MANUAL_THERAPY",
            modality: "JOINT_MOBILIZATION",
            bodyZone: "Tobillo",
            minutes: 15,
          },
          ...(day === 3
            ? [
                {
                  category: "MANUAL_THERAPY",
                  modality: "MASSAGE",
                  bodyZone: "Gemelos",
                  minutes: 10,
                },
              ]
            : []),
        ];
      }
      return [
        { category: "MANUAL_THERAPY", modality: "MASSAGE", bodyZone: "Gemelos", minutes: 10 },
        {
          category: "PHYSICAL_AGENT",
          modality: "ELECTROTHERAPY",
          bodyZone: "Peroneos",
          minutes: 12,
        },
        ...(day === 1
          ? [{ category: "TAPING", modality: "FUNCTIONAL_TAPE", bodyZone: "Tobillo" }]
          : []),
      ];
    },
    therapistNotes: [
      "Cargar según tolerancia con la bota y elevar el pie al descansar. Hielo 10 minutos si se hincha.",
      "Ya puede caminar sin bota en superficies planas. Empezar con la banda elástica y el equilibrio.",
      "Progresar a superficies inestables. Evitar giros bruscos todavía.",
    ],
    sessionNotes: [
      "Se sintió estable.",
      "Un pinchazo leve al hacer eversión.",
      "Hinchazón al final del día.",
      "Mejor equilibrio que la semana pasada.",
      "Usé la tobillera para caminar afuera.",
    ],
    closeoutNotes: [
      "El tobillo amaneció menos hinchado.",
      "Me dolió al bajar de la vereda.",
      "Pude estar de pie más rato en el trabajo.",
      "Un poco de calor y dolor por la tarde.",
      "Caminé sin cojear por primera vez.",
    ],
    goals: [
      { title: "Caminar sin muletas", createdDaysAgo: 34, achievedDaysAgo: 20 },
      { title: "Estar de pie en el trabajo sin dolor", createdDaysAgo: 30, achievedDaysAgo: 4 },
      { title: "Pararme en una pierna un minuto", createdDaysAgo: 25, achievedDaysAgo: null },
      { title: "Bajar escaleras sin miedo", createdDaysAgo: 25, achievedDaysAgo: null },
      { title: "Volver al fútbol de los domingos", createdDaysAgo: 15, achievedDaysAgo: null },
    ],
  },

  shoulder: {
    span: 70,
    pain: [6.0, 3.0],
    stiffness: [2.8, 1.2],
    sleepHours: [5.2, 7.0],
    sleepQuality: [1.5, 3.5],
    energy: [2.2, 3.6],
    flares: [{ daysAgo: 30, length: 4, bump: 1.8, note: "Dormí mal y cargué una bolsa pesada." }],
    catalog: {
      pendulum: { name: "Péndulo de Codman", sets: 2, reps: [15, 20], to: 0.55 },
      scap_ret: { name: "Retracción escapular", sets: 3, reps: [12, 15] },
      wall_slide: { name: "Deslizamiento en pared", sets: 3, reps: [8, 12], from: 0.1 },
      iso_rot: { name: "Isométrico de rotadores en pared", sets: 3, hold: [10, 20], to: 0.55 },
      er_band: { name: "Rotación externa con banda", sets: 3, reps: [10, 15], from: 0.1 },
      ir_band: { name: "Rotación interna con banda", sets: 3, reps: [10, 15], from: 0.15 },
      row: { name: "Remo con banda", sets: 3, reps: [12, 15], from: 0.2 },
      front_raise: {
        name: "Elevación frontal con mancuerna",
        sets: 3,
        reps: [8, 12],
        weight: [0.5, 3],
        from: 0.3,
      },
      scaption: {
        name: "Elevación en plano escapular",
        sets: 3,
        reps: [8, 12],
        weight: [0.5, 3],
        from: 0.35,
      },
      face_pull: { name: "Face pull con banda", sets: 3, reps: [12, 15], from: 0.45 },
      wall_pushup: { name: "Flexiones en pared", sets: 3, reps: [8, 15], from: 0.6 },
      lat_pull: {
        name: "Jalón al pecho ligero",
        sets: 3,
        reps: [10, 12],
        weight: [10, 20],
        from: 0.7,
      },
      cross_stretch: { name: "Estiramiento de cápsula posterior", sets: 3, hold: 30 },
      bike: { name: "Bicicleta estática", minutes: [10, 20], from: 0.2 },
      breathing: { name: "Respiración diafragmática", minutes: [5, 10] },
      walk: { name: "Caminata", minutes: [20, 40], km: [1.5, 3.5] },
    },
    routines: [
      { name: "Banda · manguito", keys: ["er_band", "ir_band", "row", "face_pull", "scap_ret"] },
      { name: "Movilidad matutina", keys: ["pendulum", "wall_slide", "cross_stretch"] },
    ],
    plan(p, day) {
      const band = [
        "scap_ret",
        "er_band",
        "ir_band",
        "row",
        "front_raise",
        "scaption",
        "face_pull",
        "wall_pushup",
      ];
      const early = ["scap_ret", "iso_rot", "wall_slide", "er_band", "cross_stretch"];
      const gym = ["bike", "lat_pull", "row", "face_pull", "scaption", "wall_pushup"];
      if (day === 0) return [{ type: "HOME", at: [7, 45], keys: p < 0.3 ? early : band }];
      if (day === 1 || day === 3)
        return [
          {
            type: "PHYSIOTHERAPY",
            at: [18, 0],
            keys: ["pendulum", "wall_slide", "er_band", "ir_band"],
          },
        ];
      if (day === 2)
        return [
          { type: "MOBILITY", at: [7, 30], keys: ["pendulum", "wall_slide", "cross_stretch"] },
          { type: "BREATHING", at: [22, 0], keys: ["breathing"] },
        ];
      if (day === 4)
        return [
          {
            type: p > 0.7 ? "GYM" : "HOME",
            at: [p > 0.7 ? 19 : 7, 45],
            keys: p > 0.7 ? gym : p < 0.3 ? early : band,
          },
        ];
      if (day === 5) return [{ type: "WALK", at: [9, 30], keys: ["walk"] }];
      return [{ type: "BREATHING", at: [21, 45], keys: ["breathing"] }];
    },
    treatments(p, day) {
      if (p < 0.35) {
        return [
          {
            category: "PHYSICAL_AGENT",
            modality: "ULTRASOUND",
            bodyZone: "Manguito rotador",
            minutes: 8,
          },
          {
            category: "PHYSICAL_AGENT",
            modality: "ELECTROTHERAPY",
            bodyZone: "Hombro posterior",
            minutes: 15,
          },
          {
            category: "MANUAL_THERAPY",
            modality: "MYOFASCIAL_RELEASE",
            bodyZone: "Trapecio",
            minutes: 15,
          },
        ];
      }
      if (p < 0.7) {
        return [
          {
            category: "PHYSICAL_AGENT",
            modality: "TECAR",
            bodyZone: "Manguito rotador",
            minutes: 15,
          },
          {
            category: "MANUAL_THERAPY",
            modality: "JOINT_MOBILIZATION",
            bodyZone: "Hombro anterior",
            minutes: 15,
          },
          ...(day === 1
            ? [
                {
                  category: "INVASIVE",
                  modality: "DRY_NEEDLING",
                  bodyZone: "Trapecio",
                  minutes: 10,
                },
              ]
            : []),
        ];
      }
      return [
        {
          category: "PHYSICAL_AGENT",
          modality: "THERMOTHERAPY",
          bodyZone: "Trapecio",
          minutes: 10,
        },
        {
          category: "MANUAL_THERAPY",
          modality: "MYOFASCIAL_RELEASE",
          bodyZone: "Omóplato",
          minutes: 15,
        },
        ...(day === 3
          ? [{ category: "TAPING", modality: "KINESIO_TAPE", bodyZone: "Hombro" }]
          : []),
      ];
    },
    therapistNotes: [
      "Evitar elevar el brazo por encima del hombro y cargar peso. Dormir con una almohada bajo el brazo.",
      "Progresar a banda elástica suave. El dolor al elevar no debe pasar de 4.",
      "Empezar con mancuerna liviana en el plano escapular. Mantener la movilidad de cada mañana.",
    ],
    sessionNotes: [
      "Sin dolor por debajo de la altura del hombro.",
      "Molestia al pasar la horizontal.",
      "Usé la banda amarilla, la roja todavía pesa.",
      "El hombro estaba más suelto después del calor.",
      "Sentí un chasquido leve, sin dolor.",
    ],
    closeoutNotes: [
      "Me costó dormir de lado.",
      "Pude peinarme sin dolor.",
      "Dolor sordo por la tarde en el trabajo.",
      "Noche mejor, sin despertares.",
      "Cargué la mochila y lo noté en la noche.",
    ],
    goals: [
      { title: "Peinarme sin dolor", createdDaysAgo: 60, achievedDaysAgo: 18 },
      { title: "Dormir de lado sin despertarme", createdDaysAgo: 60, achievedDaysAgo: null },
      { title: "Alcanzar el estante alto de la cocina", createdDaysAgo: 45, achievedDaysAgo: null },
      { title: "Cargar mi mochila con los dos brazos", createdDaysAgo: 30, achievedDaysAgo: null },
    ],
  },
};

// ------------------------------------------------------------------------------ builders

const rebound = ["NONE", "MILD", "MODERATE", "STRONG"];

function pick(random, list) {
  return list[Math.floor(random() * list.length) % list.length];
}

/** Cardio and walking sessions have one exercise without sets; the rest list sets. */
function buildExercises(config, keys, p, random) {
  const exercises = [];
  for (const key of keys) {
    const spec = config.catalog[key];
    if (!spec || (spec.from ?? 0) > p || (spec.to ?? 1) < p) continue;
    const planned = dose(spec, clamp(p + (random() - 0.5) * 0.06, 0, 1));
    exercises.push({
      key,
      position: exercises.length,
      isIsometric: isIsometric(spec),
      durationMinutes: planned.durationMinutes,
      distanceKm: planned.distanceKm,
      sets: planned.sets,
    });
  }
  return exercises;
}

/**
 * @param {ProfileId} profileId
 * @param {string} [today] Lima day, "YYYY-MM-DD".
 */
export function buildDemoDataset(profileId, today = limaToday()) {
  const config = profiles[profileId];
  if (!config) throw new Error(`Unknown demo profile: ${profileId}`);

  const random = mulberry32(hashString(`${profileId}:${today}`));
  const sessions = [];
  const closeouts = [];

  for (let daysAgo = config.span; daysAgo >= 1; daysAgo -= 1) {
    const date = addDays(today, -daysAgo);
    const p = (config.span - daysAgo) / (config.span - 1);
    const flare = config.flares.find(
      (item) => daysAgo <= item.daysAgo && daysAgo > item.daysAgo - item.length,
    );
    const bump = flare ? flare.bump * (daysAgo === flare.daysAgo ? 1 : 0.6) : 0;
    const base =
      lerp(config.pain[0], config.pain[1], 1 - (1 - p) ** 1.8) + bump + (random() - 0.5) * 0.8;

    const day = weekday(date);
    // Rest days happen: a few planned home sessions are skipped, but never the physio visits.
    const planned = config
      .plan(p, day)
      .filter((item) => item.type === "PHYSIOTHERAPY" || random() > 0.1 || Boolean(flare));

    let lastAfter;
    planned.forEach((item, index) => {
      const exercise = item.type !== "BREATHING";
      const before = clamp(Math.round(base + (random() - 0.5) * 1.2), 0, 10);
      const during = exercise
        ? clamp(before + (random() < 0.6 ? 1 : 0) + (flare ? 1 : 0), 0, 10)
        : null;
      const drift =
        item.type === "PHYSIOTHERAPY" || item.type === "BREATHING" || item.type === "HYDROTHERAPY"
          ? -1 - (random() < 0.4 ? 1 : 0)
          : random() < 0.55
            ? 0
            : random() < 0.5
              ? -1
              : 1;
      const after = clamp(before + drift + (flare && drift >= 0 ? 1 : 0), 0, 10);
      lastAfter = after;
      const load = clamp(
        Math.round(
          {
            HOME: 2.6,
            PHYSIOTHERAPY: 2.4,
            GYM: 3.6,
            WALK: 2,
            HYDROTHERAPY: 2,
            MOBILITY: 1.6,
            BREATHING: 1,
          }[item.type] +
            p * 0.8 +
            (random() - 0.5),
        ),
        1,
        5,
      );
      const hour = item.at[0];
      const minute = clamp(item.at[1] + Math.floor(random() * 25), 0, 59);
      const physio = item.type === "PHYSIOTHERAPY";
      const treatments = physio ? config.treatments(p, day) : [];
      const notePool = flare && index === 0 ? [flare.note] : config.sessionNotes;
      const noteChance = flare ? 1 : 0.25;
      const therapistNotes =
        physio && (day === 1 || p > 0.8)
          ? config.therapistNotes[p < 0.35 ? 0 : p < 0.7 ? 1 : 2]
          : undefined;

      sessions.push({
        date,
        occurredAt: `${date}T${pad(hour)}:${pad(minute)}:00${LIMA_UTC_OFFSET}`,
        type: item.type,
        painBefore: before,
        painDuring: during,
        painAfter: after,
        perceivedLoad: load,
        finalState: after < before ? "BETTER" : after > before ? "WORSE" : "SAME",
        notes: random() < noteChance ? pick(random, notePool) : undefined,
        therapistNotes,
        exercises: buildExercises(config, item.keys, p, random),
        treatments: treatments.map((treatment, position) => ({ ...treatment, position })),
      });
    });

    // The closeout skips the odd night, except yesterday's and around a flare.
    if (!flare && daysAgo > 1 && random() < 0.08) continue;
    const endPain = clamp(
      Math.round(base + (planned.length > 0 ? 0.3 : 0) + (random() - 0.5)),
      0,
      10,
    );
    const diff = endPain - (lastAfter ?? endPain);
    const closedHour = 21 + Math.floor(random() * 3);
    closeouts.push({
      date,
      endOfDayPain: endPain,
      energy: clamp(
        Math.round(
          lerp(config.energy[0], config.energy[1], p) - (flare ? 1 : 0) + (random() - 0.5) * 1.4,
        ),
        1,
        5,
      ),
      sleepHours: clamp(
        Math.round(
          (lerp(config.sleepHours[0], config.sleepHours[1], p) -
            (flare ? 0.8 : 0) +
            (random() - 0.5) * 1.4) *
            2,
        ) / 2,
        3,
        10,
      ),
      sleepQuality: clamp(
        Math.round(
          lerp(config.sleepQuality[0], config.sleepQuality[1], p) -
            (flare ? 1 : 0) +
            (random() - 0.5) * 1.4,
        ),
        1,
        5,
      ),
      reboundPainLevel: rebound[clamp(diff + (flare ? 1 : 0), 0, 3)],
      stiffnessLevel:
        rebound[
          clamp(
            Math.round(
              lerp(config.stiffness[0], config.stiffness[1], p) +
                (flare ? 1 : 0) +
                (random() - 0.5) * 1.2,
            ),
            0,
            3,
          )
        ],
      closedTime: `${pad(closedHour)}:${pad(Math.floor(random() * 60))}:00`,
      notes:
        flare && daysAgo === flare.daysAgo
          ? flare.note
          : random() < 0.22
            ? pick(random, config.closeoutNotes)
            : undefined,
    });
  }

  // The catalog shows the current plan (progress 1), plus what each exercise is called.
  const catalog = Object.entries(config.catalog).map(([key, spec]) => {
    const current = dose(spec, 1);
    return {
      key,
      name: spec.name,
      isIsometric: isIsometric(spec),
      archived: Boolean(spec.archived),
      defaultSetCount: current.sets.length || undefined,
      defaultReps: current.sets[0]?.reps,
      defaultHoldSeconds: current.sets[0]?.holdSeconds,
      defaultWeightKg: current.sets[0]?.weightKg,
      defaultDurationMinutes: current.durationMinutes,
      defaultDistanceKm: current.distanceKm,
    };
  });

  const routines = config.routines.map((routine) => ({
    name: routine.name,
    exercises: routine.keys.map((key, position) => {
      const spec = config.catalog[key];
      const planned = dose(spec, 0.85);
      return {
        key,
        position,
        isIsometric: isIsometric(spec),
        durationMinutes: planned.durationMinutes,
        distanceKm: planned.distanceKm,
        sets: planned.sets,
      };
    }),
  }));

  const goals = config.goals.map((goal) => ({
    title: goal.title,
    createdAt: `${addDays(today, -goal.createdDaysAgo)}T10:00:00${LIMA_UTC_OFFSET}`,
    achievedAt:
      goal.achievedDaysAgo === null
        ? null
        : `${addDays(today, -goal.achievedDaysAgo)}T20:00:00${LIMA_UTC_OFFSET}`,
  }));

  return { catalog, routines, sessions, closeouts, goals };
}
