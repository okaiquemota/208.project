import { wazeFavoriteUrl } from '../src/lib/waze';

describe('wazeFavoriteUrl', () => {
  it('rota para Casa e Trabalho pelo deep link oficial', () => {
    expect(wazeFavoriteUrl('home')).toBe('https://waze.com/ul?favorite=home&navigate=yes&utm_source=painel208');
    expect(wazeFavoriteUrl('work')).toContain('favorite=work');
  });
});
