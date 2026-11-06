/* Fall Jump 1.3 — regras puras da habilidade Fever.
 * Passagens pelas aberturas carregam a energia. A habilidade permite destruir
 * discos não perigosos temporariamente, sem alterar a colisão ou a velocidade.
 */
(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.FallJumpFever = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  const GAP_TARGET = 5;
  const DURATION_FRAMES = 240; // 4 segundos de simulação a 60 Hz
  const SCORE_MULTIPLIER = 2;

  function create() { return { charge: 0, remaining: 0, activations: 0 }; }
  function active(state) { return state.remaining > 0; }
  function reset(state) {
    state.charge = 0;
    state.remaining = 0;
    state.activations = 0;
  }
  function onGap(state) {
    if (active(state)) return false;
    state.charge = Math.min(GAP_TARGET, state.charge + 1);
    if (state.charge !== GAP_TARGET) return false;
    state.charge = 0;
    state.remaining = DURATION_FRAMES;
    state.activations++;
    return true;
  }
  function onBounce(state) {
    // O Fever que já começou continua ativo até acabar seu tempo.
    // Uma quicada normal zera somente o progresso incompleto.
    if (!active(state)) state.charge = 0;
  }
  function tick(state) {
    if (!active(state)) return false;
    state.remaining--;
    return state.remaining === 0;
  }
  function progress(state) {
    return active(state) ? state.remaining / DURATION_FRAMES : state.charge / GAP_TARGET;
  }
  function multiplier(state) { return active(state) ? SCORE_MULTIPLIER : 1; }
  function contact(state, { gap, danger, fragile }) {
    if (gap) return 'gap';
    if (danger) return 'lose'; // O Fever não imuniza contra zonas escuras.
    if (fragile || active(state)) return 'smash';
    return 'bounce';
  }
  return { create, active, reset, onGap, onBounce, tick, progress, multiplier, contact,
    GAP_TARGET, DURATION_FRAMES, SCORE_MULTIPLIER };
});
