import {
  isAllowedMapUrl,
  mapBootScript,
  mapCss,
  RECENTER_AFTER_M,
  shouldRecenter,
  TOUCH_PAUSE_MS,
  updatePositionScript,
  wazeEmbedUrl,
  wazeFavoriteUrl,
} from '../src/lib/wazeMap';

describe('wazeFavoriteUrl', () => {
  it('rota para Casa e Trabalho pelo deep link oficial', () => {
    expect(wazeFavoriteUrl('home')).toBe('https://waze.com/ul?favorite=home&navigate=yes&utm_source=painel208');
    expect(wazeFavoriteUrl('work')).toContain('favorite=work');
  });
});

const sp = { latitude: -23.5617123456, longitude: -46.656 };

describe('wazeEmbedUrl', () => {
  it('centra o embed na posição com 6 casas', () => {
    expect(wazeEmbedUrl(sp)).toBe('https://embed.waze.com/iframe?zoom=17&lat=-23.561712&lon=-46.656');
    expect(wazeEmbedUrl(sp, 14)).toContain('zoom=14');
  });
});

describe('mapCss', () => {
  it('esconde a busca nos dois temas e usa o filtro noturno só no escuro', () => {
    expect(mapCss('claro')).toContain('.wm-search');
    expect(mapCss('claro')).not.toContain('painel-noite');
    expect(mapCss('escuro')).toContain('url(#painel-noite)');
  });

  it('mantém os créditos do Waze', () => {
    expect(mapCss('escuro')).not.toContain('wz-attribution-link{display:none');
    expect(mapCss('escuro')).not.toContain('wz-map-ol-footer{display:none');
  });
});

describe('scripts', () => {
  it('o script de início tem a posição, o CSS e termina com true', () => {
    const s = mapBootScript({ ...sp, heading: 90, speed: 12 }, 'escuro');
    expect(s).toContain('"latitude":-23.561712');
    expect(s).toContain('"heading":90');
    expect(s).toContain('addNightFilter({');
    expect(s.trim().endsWith('true;')).toBe(true);
    expect(mapBootScript(sp, 'claro')).not.toContain('addNightFilter({');
  });

  it('o script de posição só centraliza quando pedido', () => {
    expect(updatePositionScript(sp, false)).not.toContain('__painelRecenter');
    expect(updatePositionScript(sp, true)).toContain('__painelRecenter');
  });

  it('textos estranhos não quebram o script (vão como JSON)', () => {
    expect(() => new Function(mapBootScript(sp, 'claro'))).not.toThrow();
    expect(() => new Function(updatePositionScript(sp, true))).not.toThrow();
  });
});

describe('shouldRecenter', () => {
  const now = 1_000_000;
  const old = now - TOUCH_PAUSE_MS - 1;
  const perto = { latitude: sp.latitude + 0.0005, longitude: sp.longitude }; // ~55 m
  const longe = { latitude: sp.latitude + 0.002, longitude: sp.longitude }; // ~220 m

  it('primeira vez: centraliza', () => {
    expect(shouldRecenter(null, sp, 0, now)).toBe(true);
  });
  it('andou pouco: não', () => {
    expect(shouldRecenter(sp, perto, old, now)).toBe(false);
  });
  it(`andou mais de ${RECENTER_AFTER_M} m: sim`, () => {
    expect(shouldRecenter(sp, longe, old, now)).toBe(true);
  });
  it('mexeram no mapa há pouco: espera', () => {
    expect(shouldRecenter(sp, longe, now - 1000, now)).toBe(false);
    expect(shouldRecenter(null, sp, now - 1000, now)).toBe(false);
  });
});

describe('isAllowedMapUrl', () => {
  it('só o embed do Waze abre na tela inteira do mapa', () => {
    expect(isAllowedMapUrl('https://embed.waze.com/iframe?zoom=16', true)).toBe(true);
    expect(isAllowedMapUrl('https://www.waze.com/live-map', true)).toBe(false);
    expect(isAllowedMapUrl('https://embed.waze.com.evil.com/', true)).toBe(false);
    expect(isAllowedMapUrl('http://embed.waze.com/iframe', true)).toBe(false);
    expect(isAllowedMapUrl('about:blank', true)).toBe(true);
  });
  it('o que carrega por dentro (reCAPTCHA) pode', () => {
    expect(isAllowedMapUrl('https://www.google.com/recaptcha/api2/anchor', false)).toBe(true);
  });
});
