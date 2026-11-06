// eslint-disable-next-line @typescript-eslint/no-require-imports
const { addLocalMavenRepos } = require('../plugins/withLocalMaven');

const GRADLE = `buildscript {
  repositories {
    google()
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
  }
}
`;

describe('withLocalMaven', () => {
  it('adiciona o repositório local dentro de allprojects/repositories', () => {
    const out = addLocalMavenRepos(GRADLE, ['modules/media-keys/android/maven']);
    expect(out).toContain('maven { url "$rootDir/../modules/media-keys/android/maven" }');
    const allprojects = out.slice(out.indexOf('allprojects'));
    expect(allprojects.indexOf('modules/media-keys')).toBeLessThan(allprojects.indexOf('google()'));
    // O buildscript não muda.
    expect(out.slice(0, out.indexOf('allprojects'))).not.toContain('modules/media-keys');
  });

  it('rodar duas vezes não duplica', () => {
    const once = addLocalMavenRepos(GRADLE, ['./modules/x/maven']);
    expect(addLocalMavenRepos(once, ['./modules/x/maven'])).toBe(once);
    expect(once).toContain('"$rootDir/../modules/x/maven"');
  });

  it('erro claro se o build.gradle não tiver o bloco esperado', () => {
    expect(() => addLocalMavenRepos('plugins {}', ['a/b'])).toThrow(/allprojects/);
  });
});
