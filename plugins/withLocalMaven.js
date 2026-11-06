// Config plugin: registra repositórios Maven locais (pastas do projeto) para
// todos os módulos do Gradle.
//
// Uso no app.json:
//   ["./plugins/withLocalMaven", { "paths": ["modules/media-keys/android/maven"] }]
//
// Serve para bibliotecas Android que não estão no Maven Central, como o
// Spotify App Remote: o .aar fica numa pasta do projeto, no formato Maven, e
// o Gradle passa a encontrá-lo. Os caminhos são relativos à raiz do projeto.

const { withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = '// painel208: repositórios Maven locais';

/** Insere os repositórios no bloco allprojects { repositories { … } }. */
function addLocalMavenRepos(contents, paths) {
  if (contents.includes(MARKER)) return contents;
  const lines = paths.map((p) => `    maven { url "$rootDir/../${p.replace(/^\.?\//, '')}" }`).join('\n');
  const anchor = /allprojects\s*\{\s*\n\s*repositories\s*\{\s*\n/;
  if (!anchor.test(contents)) {
    throw new Error('[withLocalMaven] não achei "allprojects { repositories {" no android/build.gradle');
  }
  return contents.replace(anchor, (match) => `${match}    ${MARKER}\n${lines}\n`);
}

const withLocalMaven = (config, props = {}) => {
  const paths = Array.isArray(props.paths) ? props.paths.filter((p) => typeof p === 'string' && p) : [];
  if (paths.length === 0) return config;
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('[withLocalMaven] esperava android/build.gradle em Groovy');
    }
    mod.modResults.contents = addLocalMavenRepos(mod.modResults.contents, paths);
    return mod;
  });
};

module.exports = withLocalMaven;
module.exports.addLocalMavenRepos = addLocalMavenRepos;
