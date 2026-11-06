/* Fall Jump 1.2.1 — gerador procedural com torres longas e trechos variados.
 * Sem dependências, funciona no navegador e nos testes Node.js.
 */
(function (root, factory) {
  'use strict';
  const generator = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = generator;
  if (root) root.FallJumpLevelGenerator = generator;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const TAU = Math.PI * 2;
  const SPACING = 137;
  const GRAVITY = 0.32;
  const MAX_FALL_SPEED = 14;
  const CONTACT_RADIUS = 13 / 0.86;
  // A validação presume cerca de 9 px de arrasto por frame a 60 Hz.
  // Não limita o controle do usuário; apenas rejeita níveis pouco razoáveis.
  const FAIR_TURN_PER_FRAME = 0.11;
  const GAP_CLEARANCE = 0.09;
  const STAGE_NAMES = ['APRENDIZADO', 'RITMO', 'TÉCNICA', 'DESAFIO', 'RESPIRO'];
  const PATTERN_NAMES = ['spiral', 'zigzag', 'plunge', 'switchback', 'rest', 'precision'];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function signedAngle(value) {
    return ((value + Math.PI) % TAU + TAU) % TAU - Math.PI;
  }
  function randomFromSeed(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) >>> 0;
      let x = state;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function randomSeed() {
    // Não é usado para segurança: somente diversidade das fases.
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const word = new Uint32Array(1);
      crypto.getRandomValues(word);
      return word[0] >>> 0;
    }
    return Math.floor(Math.random() * 4294967296) >>> 0;
  }
  function difficultyFor(level) {
    const n = Math.max(1, Math.floor(level) || 1);
    const phase = (n - 1) % 5;
    const tier = Math.floor((n - 1) / 5);
    const curve = [0.15, 0.34, 0.52, 0.73, 0.37];
    const intensity = clamp(curve[phase] + Math.min(0.18, tier * 0.023), 0, 0.91);
    return { phase, tier, intensity, label: STAGE_NAMES[phase] };
  }
  // Pesos por ciclo: cada etapa possui identidade, não apenas obstáculos
  // aleatórios com a mesma distribuição.
  const PHASE_WEIGHTS = [
    [['plunge', 6], ['rest', 4], ['spiral', 3], ['zigzag', 1]],
    [['plunge', 6], ['spiral', 4], ['zigzag', 3], ['switchback', 1]],
    [['zigzag', 5], ['spiral', 4], ['switchback', 3], ['precision', 3], ['plunge', 2]],
    [['precision', 5], ['switchback', 5], ['zigzag', 4], ['spiral', 2], ['plunge', 2]],
    [['rest', 6], ['plunge', 5], ['spiral', 3], ['zigzag', 2]]
  ];
  const OPENING_PATTERNS = ['plunge', 'plunge', 'zigzag', 'switchback', 'rest'];

  function pickPattern(rng, level, phase, previous) {
    let choices = PHASE_WEIGHTS[phase];
    if (level === 1) choices = choices.filter(pair => pair[0] !== 'zigzag');
    choices = choices.filter(pair => pair[0] !== previous);
    const total = choices.reduce((sum, pair) => sum + pair[1], 0);
    let choice = rng() * total;
    for (const [type, weight] of choices) {
      choice -= weight;
      if (choice < 0) return type;
    }
    return choices[choices.length - 1][0];
  }
  function segmentLength(pattern, rng) {
    if (pattern === 'plunge') return 4 + Math.floor(rng() * 4);
    if (pattern === 'spiral' || pattern === 'zigzag') return 4 + Math.floor(rng() * 3);
    return 3 + Math.floor(rng() * 3);
  }
  function buildCandidate(level, seed, safeMode) {
    const rng = randomFromSeed(seed);
    const difficulty = difficultyFor(level);
    const count = 40 + Math.min(40, 6 * Math.floor((level - 1) / 2));
    const platforms = [];
    const segments = [];
    const intensity = safeMode ? difficulty.intensity * 0.62 : difficulty.intensity;
    let lastAngle = 1.3;
    let lastPattern = null;
    let lastSpecial = -5;
    let lastDanger = -5;
    let i = 0;

    while (i < count) {
      const pattern = i === 0 ? OPENING_PATTERNS[difficulty.phase] : pickPattern(rng, level, difficulty.phase, lastPattern);
      lastPattern = pattern;
      const from = i;
      const length = Math.min(count - i, segmentLength(pattern, rng));
      const direction = rng() < 0.5 ? -1 : 1;
      for (let j = 0; j < length; j++, i++) {
        let change = 0;
        if (pattern === 'spiral') change = direction * (0.38 + rng() * 0.22 + intensity * 0.06);
        else if (pattern === 'zigzag') change = direction * (j % 2 ? -1 : 1) * (0.60 + rng() * 0.22 + intensity * 0.08);
        else if (pattern === 'plunge') change = (rng() - 0.5) * 0.16;
        else if (pattern === 'switchback') change = direction * (j % 2 ? -1 : 1) * (0.70 + rng() * 0.20 + intensity * 0.08);
        else if (pattern === 'rest') change = (rng() - 0.5) * 0.20;
        else if (pattern === 'precision') change = direction * (0.48 + rng() * 0.28 + intensity * 0.08);

        const angle = i === 0 ? 1.3 : signedAngle(lastAngle + change);
        lastAngle = angle;
        const minGap = level === 1 ? 1.15 : 0.80;
        let gap = 1.23 + rng() * 0.23 - intensity * 0.16;
        if (pattern === 'precision' && level >= 3) gap -= 0.12;
        if (pattern === 'rest' || pattern === 'plunge') gap += 0.14;
        gap = clamp(gap, minGap, 1.56);

        let special = null;
        if (i >= 2 && i < count - 1 && i - lastSpecial >= 3) {
          const roll = rng();
          if (level >= 2 && roll < (pattern === 'plunge' ? 0.25 : 0.17)) special = 'bonus';
          else if (level >= 3 && roll < 0.26 + 0.10 * intensity) special = 'fragile';
          if (special) lastSpecial = i;
        }
        let danger = 0;
        if (level >= 2 && i >= 3 && i < count - 1 && i - lastDanger >= 3) {
          const chance = pattern === 'plunge' || pattern === 'rest'
            ? 0.02 : 0.14 + intensity * 0.22 + (pattern === 'precision' ? 0.06 : 0);
          if (rng() < chance) {
            danger = clamp(0.26 + rng() * 0.21 + intensity * 0.12, 0, 0.65);
            lastDanger = i;
          }
        }
        platforms.push({
          y: i * SPACING, angle, gap, danger,
          passed: false, seed: i * 19 + 4 + level * 37,
          special, cracked: false, broken: false
        });
      }
      segments.push({ type: pattern, from, to: i - 1 });
    }

    return {
      level, seed: seed >>> 0, count, label: difficulty.label,
      phase: difficulty.phase, intensity: difficulty.intensity,
      platforms, segments
    };
  }

  // Teste conservador de rota de queda livre: simula a mesma gravidade,
  // velocidade máxima, altura inicial e planos de contato usados no jogo.
  // Um jogador ainda pode quicar ou se corrigir; este teste exige uma rota
  // de passagem por todas as aberturas sem depender dessas facilidades.
  function simulateRoute(plan) {
    const platforms = plan.platforms;
    let y = -76, vy = 0, rotation = 0, index = 0;
    let worstClearance = Infinity;
    for (let frame = 1; frame <= 1200 && index < platforms.length; frame++) {
      const p = platforms[index];
      const delta = signedAngle(-p.angle - rotation);
      rotation = signedAngle(rotation + clamp(delta, -FAIR_TURN_PER_FRAME, FAIR_TURN_PER_FRAME));
      const previous = y;
      vy = Math.min(vy + GRAVITY, MAX_FALL_SPEED);
      y += vy;
      if (previous + CONTACT_RADIUS <= p.y && y + CONTACT_RADIUS >= p.y) {
        const error = Math.abs(signedAngle(-p.angle - rotation));
        const clearance = p.gap / 2 - error;
        worstClearance = Math.min(worstClearance, clearance);
        if (clearance < GAP_CLEARANCE) {
          return { ok: false, failedAt: index, frames: frame, clearance };
        }
        index++;
      }
    }
    return {
      ok: index === platforms.length,
      failedAt: index === platforms.length ? -1 : index,
      frames: index === platforms.length ? Math.ceil((y + 76) / MAX_FALL_SPEED) : 1200,
      clearance: worstClearance
    };
  }

  function validateLevel(plan) {
    if (!plan || !Array.isArray(plan.platforms) || plan.platforms.length !== plan.count) return false;
    if (plan.count < 40 || plan.count > 80) return false;
    for (let i = 0; i < plan.platforms.length; i++) {
      const p = plan.platforms[i];
      if (!Number.isFinite(p.angle) || !Number.isFinite(p.gap) ||
          p.gap < 0.80 || p.gap > 1.56 || p.y !== i * SPACING ||
          p.danger < 0 || p.danger > 0.65) return false;
      if (i < 3 && p.danger !== 0) return false;
      if (i && p.danger && plan.platforms[i - 1].danger) return false;
      if (!['bonus', 'fragile', null].includes(p.special)) return false;
      if (i && p.special && plan.platforms[i - 1].special) return false;
    }
    return simulateRoute(plan).ok;
  }

  function fallbackLevel(level, seed) {
    const plan = buildCandidate(level, seed, true);
    plan.platforms.forEach((p, i) => {
      p.angle = signedAngle(1.3 + i * 0.11);
      p.gap = 1.42;
      p.danger = 0;
      p.special = null;
    });
    plan.segments = [{ type: 'safe', from: 0, to: plan.count - 1 }];
    plan.fallback = true;
    return plan;
  }

  function generateLevel(level, originalSeed) {
    const n = Math.max(1, Math.floor(level) || 1);
    const base = originalSeed === undefined ? randomSeed() : (Number(originalSeed) >>> 0);
    for (let attempt = 0; attempt < 24; attempt++) {
      const candidateSeed = (base + Math.imul(attempt, 0x9e3779b1)) >>> 0;
      const plan = buildCandidate(n, candidateSeed, attempt >= 12);
      if (validateLevel(plan)) {
        plan.attempts = attempt + 1;
        return plan;
      }
    }
    const fallback = fallbackLevel(n, base);
    fallback.attempts = 24;
    return fallback;
  }

  return {
    generateLevel, validateLevel, simulateRoute, difficultyFor,
    randomSeed, signedAngle, SPACING, FAIR_TURN_PER_FRAME
  };
});
