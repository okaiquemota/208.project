// Mapa ao vivo do Waze (embed oficial embed.waze.com) dentro do painel.
//
// O embed é uma página do Waze. Para ele seguir o carro sem recarregar,
// trocamos o GPS do navegador da página pelo GPS do painel (um "calço" de
// navigator.geolocation) e apertamos o botão "minha localização" do próprio
// mapa quando o carro anda. Aqui ficam só textos e contas, sem React.

import { distanceMeters, type LatLng } from './geo';

export const WAZE_EMBED_HOST = 'embed.waze.com';
export type MapTheme = 'escuro' | 'claro';

/** Andou mais que isso desde a última centralização: centraliza de novo. */
export const RECENTER_AFTER_M = 120;
/** Depois de um toque no mapa (arrastar, zoom), espera isso para voltar a seguir. */
export const TOUCH_PAUSE_MS = 20_000;

export type MapPosition = LatLng & {
  /** Direção em graus (0 = norte), se souber. */
  heading?: number | null;
  /** Velocidade em m/s, se souber. */
  speed?: number | null;
  accuracy?: number | null;
};

const fixed = (n: number) => Number(n.toFixed(6));

/** Destinos salvos no próprio Waze (Casa e Trabalho). */
export type WazeFavorite = 'home' | 'work';

/**
 * Deep link oficial do Waze que já começa a rota para Casa ou Trabalho
 * (os endereços salvos no app do Waze).
 */
export function wazeFavoriteUrl(favorite: WazeFavorite): string {
  return `https://waze.com/ul?favorite=${favorite}&navigate=yes&utm_source=painel208`;
}

/** Endereço do embed centrado na posição (zoom 17: de perto, como dirigindo). */
export function wazeEmbedUrl(pos: LatLng, zoom = 17): string {
  return `https://${WAZE_EMBED_HOST}/iframe?zoom=${zoom}&lat=${fixed(pos.latitude)}&lon=${fixed(pos.longitude)}`;
}

/** Posição no formato do navegador (coords do Geolocation API). */
function coords(pos: MapPosition) {
  return {
    latitude: fixed(pos.latitude),
    longitude: fixed(pos.longitude),
    accuracy: pos.accuracy ?? 10,
    heading: pos.heading ?? null,
    speed: pos.speed ?? null,
    altitude: null,
    altitudeAccuracy: null,
  };
}

/**
 * Mapa noturno no estilo do Waze no CarPlay: cada tom de cinza do mapa claro
 * vira outro (tabela de 17 pontos, do preto ao branco). Os nomes (escuros)
 * ficam claros, o fundo (bege) vira cinza-escuro e as ruas (brancas) ficam um
 * cinza mais claro que o fundo. Alertas e trânsito não passam pelo filtro.
 */
export const NIGHT_TABLE = {
  r: '0.94 0.92 0.90 0.87 0.84 0.80 0.75 0.69 0.62 0.54 0.45 0.36 0.27 0.20 0.18 0.205 0.345',
  g: '0.96 0.94 0.92 0.89 0.86 0.82 0.77 0.71 0.64 0.56 0.47 0.38 0.29 0.21 0.19 0.215 0.36',
  b: '0.98 0.96 0.94 0.91 0.88 0.84 0.79 0.73 0.66 0.58 0.49 0.40 0.31 0.23 0.21 0.235 0.38',
} as const;

/** Cor de fundo do mapa noturno (também usada no card enquanto carrega). */
export const NIGHT_BG = '#2A2D31';

/**
 * CSS por cima da página do Waze: tira a busca, o "Expandir mapa", a barra
 * de cima e os links do rodapé (inúteis dirigindo). O "© Waze" e o
 * "powered by Waze" continuam. No tema escuro, aplica o filtro noturno nos
 * pedaços do mapa e escurece os controles.
 */
export function mapCss(theme: MapTheme): string {
  const hide = '.wm-search,.js-livemap-link,.wz-iframe-header,.wz-map-black-link{display:none!important}';
  if (theme !== 'escuro') return hide;
  return (
    hide +
    `html,body,.olMap{background:${NIGHT_BG}!important}` +
    '.olTileImage{filter:url(#painel-noite)}' +
    '.wz-map-ol-footer{background:rgba(20,22,25,.6)!important;color:#9aa0a6!important}' +
    '.wz-iframe-attribution-link__content{background:#202326!important}' +
    '.wz-attribution-link{color:#9aa0a6!important}' +
    '.olControlZoom,.wz-control-button,.wm-corner-logo-control{filter:invert(.88) hue-rotate(180deg)}'
  );
}

/**
 * Script que roda antes da página do Waze: troca o GPS do navegador pelo do
 * painel, aplica o CSS e avisa o app quando o mapa é tocado.
 */
export function mapBootScript(pos: MapPosition, theme: MapTheme): string {
  return `(function () {
  var pos = ${JSON.stringify(coords(pos))};
  var watchers = {}; var nextId = 1;
  function snap() { return { coords: Object.assign({}, pos), timestamp: Date.now() }; }
  var geo = {
    getCurrentPosition: function (ok) { setTimeout(function () { ok(snap()); }, 0); },
    watchPosition: function (ok) { var id = nextId++; watchers[id] = ok; setTimeout(function () { ok(snap()); }, 0); return id; },
    clearWatch: function (id) { delete watchers[id]; }
  };
  try { Object.defineProperty(navigator, 'geolocation', { configurable: true, get: function () { return geo; } }); } catch (e) {}
  try { Object.defineProperty(navigator, 'permissions', { configurable: true, get: function () { return { query: function () { return Promise.resolve({ state: 'granted', onchange: null }); } }; } }); } catch (e) {}
  window.__painelSetPos = function (p) { pos = Object.assign(pos, p); for (var k in watchers) { try { watchers[k](snap()); } catch (e) {} } };
  window.__painelRecenter = function () { var b = document.querySelector('.wz-control-button'); if (b) { b.click(); return true; } return false; };
  function addCss() {
    var s = document.createElement('style'); s.textContent = ${JSON.stringify(mapCss(theme))};
    (document.head || document.documentElement).appendChild(s);
    ${theme === 'escuro' ? `addNightFilter(${JSON.stringify(NIGHT_TABLE)});` : ''}
  }
  // Filtro SVG do mapa noturno (montado peça por peça: a página do Waze não aceita innerHTML).
  function addNightFilter(t) {
    var ns = 'http://www.w3.org/2000/svg';
    function mk(tag, attrs, parent) { var el = document.createElementNS(ns, tag); for (var k in attrs) el.setAttribute(k, attrs[k]); parent.appendChild(el); return el; }
    var svg = mk('svg', { width: '0', height: '0', style: 'position:absolute' }, document.body || document.documentElement);
    var f = mk('filter', { id: 'painel-noite', 'color-interpolation-filters': 'sRGB' }, svg);
    mk('feColorMatrix', { type: 'saturate', values: '0' }, f);
    var ct = mk('feComponentTransfer', {}, f);
    mk('feFuncR', { type: 'table', tableValues: t.r }, ct);
    mk('feFuncG', { type: 'table', tableValues: t.g }, ct);
    mk('feFuncB', { type: 'table', tableValues: t.b }, ct);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addCss); else addCss();
  function send(m) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m); }
  document.addEventListener('touchstart', function () { send('toque'); }, { passive: true, capture: true });
  window.addEventListener('load', function () {
    var tries = 0;
    var t = setInterval(function () { tries++; if (window.__painelRecenter() || tries > 20) { clearInterval(t); send('pronto'); } }, 500);
  });
})();
true;`;
}

/** Script para mandar a posição nova ao mapa (e, se pedir, centralizar). */
export function updatePositionScript(pos: MapPosition, recenter: boolean): string {
  const set = `window.__painelSetPos && window.__painelSetPos(${JSON.stringify(coords(pos))});`;
  return recenter ? `${set} window.__painelRecenter && window.__painelRecenter(); true;` : `${set} true;`;
}

/**
 * Centraliza o mapa no carro agora? Sim se nunca centralizou ou se andou
 * mais de RECENTER_AFTER_M, desde que ninguém tenha mexido no mapa há pouco.
 */
export function shouldRecenter(
  lastCenter: LatLng | null,
  pos: LatLng,
  lastTouchMs: number,
  nowMs: number,
): boolean {
  if (nowMs - lastTouchMs < TOUCH_PAUSE_MS) return false;
  if (!lastCenter) return true;
  return distanceMeters(lastCenter, pos) > RECENTER_AFTER_M;
}

/**
 * O mapa pode abrir este endereço? Só o próprio embed do Waze (e o que ele
 * carrega por dentro, como o reCAPTCHA). Links para fora não abrem no painel.
 */
export function isAllowedMapUrl(url: string, isTopFrame: boolean): boolean {
  if (!isTopFrame) return true;
  if (url === 'about:blank') return true;
  const m = /^https:\/\/([^/?#:]+)/i.exec(url);
  return !!m && m[1]?.toLowerCase() === WAZE_EMBED_HOST;
}
