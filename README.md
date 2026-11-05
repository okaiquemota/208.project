# Painel 208

App Android que transforma um **Samsung Galaxy M51** numa segunda multimídia para o **Peugeot 208 2014**. O celular fica deitado num suporte no painel, ligado na USB do carro.

Pacote: `br.com.movcode.painel208` · Expo SDK 58 + TypeScript · development build (não roda no Expo Go, porque tem código nativo próprio).

```
┌──── 40% ─────┬──────────────── 60% ─────────────────┐
│              │ 14:32  quinta-feira    🔋 78% carreg. │
│   ╭──────╮   │        5 de novembro   ● GPS ±4 m     │
│  /   87   \  │ [DISTÂNCIA] [TEMPO] [MÉDIA] [MÁXIMA]  │
│     km/h     │ [⏮] [⏯] [⏭]        [−] ▮▮▮▮▯ [+]      │
│      NE      │ [Waze][Maps][Spotify][YTM][Deezer]... │
└──────────────┴───────────────────────────────────────┘
```

## O que tem nesta versão

| Função | Como funciona |
| --- | --- |
| **Velocímetro** | GPS a cada 1 s com precisão máxima (`BestForNavigation`). Arco de 0 a 200 km/h que fica laranja acima de 120. Direção embaixo (N, NE, L, SE, S, SO, O, NO). |
| **Viagem** | Distância, tempo em movimento, média e máxima. **Segure um card por 0,8 s para zerar** (o celular vibra e aparece "ZERADO"). |
| **Relógio e data** | Hora grande e data em português, sem depender de `Intl`. |
| **Bateria** | Mostra a porcentagem e se está carregando. Fica laranja quando está descarregando **ou quando o nível cai mesmo na tomada** ("USB fraca"), porque a USB do carro pode não dar conta. |
| **Música** | Anterior, play/pause, próxima, volume − e +. Controla qualquer player (Spotify, YT Music, Deezer) sem permissão especial. |
| **Atalhos** | Ícone real de cada app. Os que não estão instalados não aparecem. |
| **Tela** | Paisagem pelos dois lados, tela cheia, sempre ligada e fundo preto puro (AMOLED). A cada minuto a interface toda se desloca 1–2 dp pra evitar burn-in. |

## Rodar no M51 pelo cabo USB

### 1. No computador (uma vez só)

- **Node.js** 20 ou mais novo.
- **Android Studio**, que instala o Android SDK, o JDK e o `adb`. Na primeira abertura, aceite instalar o SDK padrão.
- Variável `ANDROID_HOME` apontando pro SDK (no Windows costuma ser `%LOCALAPPDATA%\Android\Sdk`; no macOS, `~/Library/Android/sdk`), com `platform-tools` no `PATH`.

### 2. No M51 (uma vez só)

1. **Configurações → Sobre o telefone → Informações do software** e toque **7 vezes** em **Número de compilação**. Aparece "Modo de desenvolvedor ativado".
2. **Configurações → Opções do desenvolvedor** e ligue **Depuração USB**.
3. Ligue o M51 no computador com um cabo de dados. Na tela do celular, aceite **Permitir depuração USB** (marque "Sempre permitir deste computador").
4. Confira no computador:

```bash
adb devices
```

O M51 tem que aparecer como `device`. Se aparecer `unauthorized`, desbloqueie o celular e aceite o aviso.

### 3. Instalar e rodar

```bash
npm install
```

```bash
npx expo run:android
```

Na primeira vez esse comando gera a pasta `android/` a partir do `app.json` e dos plugins, compila o app (demora alguns minutos), instala no M51 e abre o Metro, o servidor que entrega o JavaScript.

- **Mudou só código TypeScript/React?** Salve o arquivo e o app atualiza sozinho. Pra abrir o servidor de novo outro dia: `npx expo start`.
- **Mudou `app.json`, plugin ou Kotlin?** Rode `npx expo run:android` de novo, porque isso muda o app nativo.
- **Vai usar no carro, longe do computador?** Instale a versão release, que já leva o JavaScript dentro do APK:

```bash
npx expo run:android --variant release
```

## Gerar o APK com o EAS (na nuvem)

O EAS compila o app nos servidores da Expo, sem precisar do Android Studio. O `eas.json` já tem dois perfis, os dois gerando **APK** (instala direto no celular):

| Perfil | Pra quê |
| --- | --- |
| `development` | APK com o "dev client": abre e conecta no `npx expo start` do seu computador (mesmo Wi-Fi). Bom pra desenvolver sem cabo. |
| `preview` | APK final, com o JavaScript dentro. **É o que fica no carro.** |

Passo a passo:

1. Crie uma conta grátis em [expo.dev](https://expo.dev) e entre:

```bash
npx eas-cli@latest login
```

2. Ligue o projeto à sua conta. Isso só grava o `projectId` no `app.json`:

```bash
npx eas-cli@latest init
```

3. Gere o APK:

```bash
npx eas-cli@latest build -p android --profile preview
```

4. No fim aparece um link e um QR code. Abra no M51, baixe o APK e instale. O Android vai pedir pra permitir "instalar apps desconhecidos" pelo navegador; permita.

A cada versão nova que for instalar por cima, aumente `android.versionCode` no `app.json` (1 → 2 → 3…).

## Configurar

Tudo fica no `app.json`, nas opções do plugin `./plugins/withCarLauncher`. Depois de mudar, **gere o app de novo** (`npx expo run:android` ou EAS).

```json
["./plugins/withCarLauncher", {
  "asHomeLauncher": false,
  "sensorLandscape": true,
  "apps": [
    { "label": "Waze", "package": "com.waze" },
    { "label": "Telefone", "package": "com.samsung.android.dialer" }
  ]
}]
```

- **`apps`**: a lista de atalhos, na ordem da tela. É a única lista do projeto. O plugin declara os pacotes no AndroidManifest e repassa a lista pro app. Pra descobrir o pacote de um app instalado:

```bash
adb shell pm list packages | grep -i autokit
```

  Troque `autokit` pelo nome do app que procura. É assim que dá pra pôr o **Autokit** (adaptador Carlinkit) na lista.

- **`asHomeLauncher`**: `true` faz o Painel 208 poder virar a **tela inicial** do M51. Depois de instalar, aperte o botão Início e escolha "Painel 208" → "Sempre". Pra voltar: **Configurações → Aplicativos → Escolher aplicativos padrão → Aplicativo da tela inicial**.
- **`sensorLandscape`**: `true` deixa a paisagem funcionar com a USB de qualquer lado do suporte. Com `false`, vale só a paisagem fixa do `app.json`.

Cores, tamanhos e o limite de 120 km/h ficam em `src/config/theme.ts`.

## Como o projeto está organizado

```
app.json                  nome, pacote, paisagem, permissões, plugins e lista de atalhos
eas.json                  perfis de build do EAS (development e preview → APK)
App.tsx                   raiz: esconde as barras, mantém a tela ligada
plugins/
  withCarLauncher.js      config plugin: <queries>, tela inicial e paisagem
  carLauncherManifest.js  funções que mexem no AndroidManifest (testadas)
modules/media-keys/       módulo Expo local em Kotlin (teclas de mídia e volume)
src/
  config/                 tema e leitura da lista de atalhos
  lib/                    funções puras, sem React, todas com teste
  hooks/                  ligam o app ao sistema (GPS, bateria, música…)
  components/             pedaços da tela
  screens/DashboardScreen.tsx  monta o layout
__tests__/                testes (Jest)
```

### O que cada parte faz, e por quê

**Funções puras (`src/lib/`).** Toda a "inteligência" fica em funções que recebem dados e devolvem dados, sem tocar em GPS ou tela. Dá pra testar cada regra com números inventados, sem celular e sem carro.

- **`trip.ts`** é o coração da viagem. O GPS do celular "treme": parado no semáforo ele acha que você andou, na garagem ele pula, no túnel ele some. A ideia central é uma **âncora**, o último ponto confiável. A distância sempre é medida da âncora até o ponto novo, e ponto ruim não vira âncora. Cada leitura passa por estas regras:
  - **abaixo de 3 km/h é parado**: não soma distância nem tempo, então o tremido do semáforo não conta;
  - **precisão pior que 35 m não soma distância**: o tempo ainda conta se o GPS diz que você está andando;
  - **mais de 10 s sem leitura** (túnel, garagem): os pontos de antes e de depois não são ligados com uma reta;
  - **salto acima de 250 km/h é descartado**: um 208 não se teletransporta;
  - **sem velocidade do GPS** (`speed` null ou negativo): calcula por distância ÷ tempo.
- **`geo.ts`**: distância entre dois pontos (haversine), rumo e conversão de graus pra N/NE/L/….
- **`battery.ts`**: além do "carregando/descarregando" do Android, guarda o maior nível visto desde que plugou. Se cair 2 pontos ainda na tomada, avisa "USB fraca".
- **`burnIn.ts`**: a lista de deslocamentos de 1–2 dp que a tela percorre, um por minuto.
- **`datetime.ts`, `format.ts`, `gauge.ts`, `carApps.ts`**: data em português, números no padrão brasileiro, geometria do arco e validação da lista de atalhos.

**Hooks (`src/hooks/`).** Ligam as funções puras ao celular.

- **`useGps`** pede a permissão, confere a cada 3 s se a localização está ligada e recebe o GPS a cada 1 s. Sem permissão ou com o GPS desligado, o velocímetro dá lugar a um aviso com botão pra resolver.
- **`useBattery`**, **`useClock`** (atualiza exatamente na virada do minuto), **`useBurnInShift`**.
- **`useMediaKeys`** usa o módulo Kotlin. Se o módulo não estiver no build, os botões ficam apagados e o resto continua funcionando.
- **`useInstalledApps`** pede o ícone de cada app da lista. Se o app não existe, ele some da tela. A lista é conferida de novo sempre que você volta pro painel.

**Módulo Kotlin (`modules/media-keys`).** Em vez de falar com um player específico, ele "aperta" as teclas de mídia, as mesmas de um fone Bluetooth (`AudioManager.dispatchMediaKeyEvent`). O Android entrega a tecla pro app que está tocando, então funciona com qualquer player e sem permissão especial. O volume usa `adjustStreamVolume` sem o popup do sistema; o nível aparece na barrinha do próprio painel. O lado JavaScript usa `requireOptionalNativeModule`: se o módulo faltar, devolve `null` em vez de travar o app.

**Config plugin (`plugins/withCarLauncher.js`).** A pasta `android/` é gerada automaticamente e nunca é editada à mão. O plugin é a "receita" que ajusta o AndroidManifest a cada geração. A partir do Android 11, um app só enxerga outros apps que declara em `<queries>`; sem isso, o painel não conseguiria nem saber se o Waze está instalado.

**Tela.** O fundo é preto puro porque, em AMOLED, pixel preto fica apagado: gasta menos bateria, esquenta menos e não marca a tela. Os números usam `tabular-nums` (todos os dígitos com a mesma largura), então "88" → "91" não faz o texto pular. Os botões têm no mínimo 64 dp e não há popups, porque é pra usar dirigindo. A tela respeita o furo da câmera (`react-native-safe-area-context`).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run check` | TypeScript + lint + testes. Rode antes de cada commit. |
| `npm test` | Só os testes (Jest). |
| `npm run android` | O mesmo que `npx expo run:android`. |
| `npm start` | Servidor de desenvolvimento pro dev client. |
| `npm run prebuild` | Gera a pasta `android/` do zero, útil pra conferir o AndroidManifest. |

## Próximos passos (estrutura já pronta)

- **OBD2 (ELM327 Bluetooth)**: RPM, temperatura etc. Entra como um hook novo (`useObd`) + um card na coluna da direita. Cada faixa da tela é um componente independente.
- **"Tocando agora"** (música e capa): entra no mesmo módulo `media-keys`, com um `NotificationListenerService` + `MediaSessionManager`, e o `useMediaKeys` passa a devolver título e capa.
- **CarPlay (Carlinkit + Autokit)**: basta pôr o pacote do Autokit na lista de atalhos (veja "Configurar").
