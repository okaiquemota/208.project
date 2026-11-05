# Painel 208

App Android que transforma um **Samsung Galaxy M51** numa segunda multimídia, no estilo CarPlay, para o **Peugeot 208 2014**. O celular fica deitado num suporte no painel, ligado na USB do carro.

Pacote: `br.com.movcode.painel208` · Expo SDK 58 + TypeScript · development build (não roda no Expo Go, porque tem código nativo próprio).

**Tela cheia:** o player é o card principal; velocidade, viagem e volume ficam em widgets ao lado.

```
┌──────┬──────────────────────────────────┬──────────────┐
│ 78%  │  (capa desfocada no fundo)       │ ➤NE  ▂▄▆ ±4 m│
│14:32 │ ┌────────┐ TOCANDO NO SPOTIFY    │ 87 km/h      │
│qui, 5│ │  capa  │ Céu Aberto            │ ▮▮▮▮▮▮▯▯▯▯▯▯ │
│ (W)  │ └────────┘ Banda de Exemplo      ├──────────────┤
│ (S)  │ ━━━━━━━━━━●──────────────  -2:09 │ VIAGEM (2×2) │
│ (Z)  │   ♥    ⏮     ( ⏸ )     ⏭    ⤮   ├──────────────┤
│  ▦   │                                  │ 🔈 ▁▂▃▅▆▇ 🔊 │
└──────┴──────────────────────────────────┴──────────────┘
```

**Em tela dividida com o Waze** (o Waze na outra metade): barra lateral com a velocidade + o player, com o volume nos botões dos lados.

## O que tem nesta versão

| Função | Como funciona |
| --- | --- |
| **Tocando agora** | No estilo do Spotify: a capa desfocada vira o fundo do card, capa grande, título, artista, barra de progresso, play branco redondo e os botões extras do próprio player (no Spotify: **curtir** e **aleatório/repetir**, com os ícones dele). Funciona com Spotify, YT Music, Deezer ou qualquer player. Precisa liberar o **Acesso a notificações** uma vez (veja abaixo). |
| **Controles de música** | Anterior, play/pause, próxima e um widget de volume com barra em degraus. Funcionam mesmo sem o acesso liberado. |
| **Velocidade** | GPS a cada 1 s com precisão máxima. Número grande, barra de "LEDs" que fica laranja/vermelha acima de 120 km/h, bússola (N, NE, L, SE, S, SO, O, NO) e sinal do GPS em barrinhas. |
| **Viagem** | Distância, tempo em movimento, média e máxima, cada uma com seu ícone. **Segure o widget por 0,8 s para zerar** (o celular vibra). |
| **Barra lateral** | Bateria, hora e 3 apps fixos (um de navegação, um de música, um de comunicação). O botão de baixo alterna entre o painel e a grade com todos os apps. |
| **Bateria** | Fica laranja quando está **na bateria** ou quando o nível cai mesmo na tomada (**USB fraca**), porque a USB do carro pode não dar conta. |
| **Tela dividida** | Com o Waze ao lado, o painel encolhe para a barra lateral (com a velocidade) e o player. |
| **Tela** | Paisagem pelos dois lados, tela cheia, sempre ligada e fundo preto (AMOLED). A cada minuto a interface se desloca 1–2 dp para evitar burn-in. |

## Primeira vez no M51

### Ativar o "Tocando agora" (uma vez só)

Para mostrar música, artista e capa, o Android exige que você libere o Painel 208 em **Acesso a notificações**:

1. No card da música, toque em **Ativar**. Abre a tela certa do Android.
2. Ligue a chave do **Painel 208** e confirme.
3. Volte para o painel. A música aparece em seguida.

Se a chave estiver **cinza** com o aviso "configuração restrita" (acontece no Android 13+ quando o APK é instalado pelo navegador ou pelo gerenciador de arquivos):

1. Vá em **Configurações → Aplicativos → Painel 208**.
2. Toque nos **⋮** (canto superior direito) → **Permitir configurações restritas**.
3. Repita os passos acima.

### Waze de um lado, música do outro

1. Abra o **Waze**.
2. Abra os **Recentes** (botão ▢ ou o gesto de deslizar e segurar).
3. Toque no **ícone do Painel 208**, em cima do cartão dele, e escolha **Abrir na exibição em tela dividida**. Depois toque no Waze para ele ocupar a outra metade.
4. Arraste a divisória para dar mais espaço ao Waze, se quiser.

Com o painel já em tela dividida, tocar no Waze (ou no Maps) da barra lateral abre o app na outra metade.

## Rodar no M51 pelo cabo USB ou Wi-Fi

### 1. No computador (uma vez só)

- **Node.js** 20 ou mais novo.
- **Android Studio**, que instala o Android SDK, o JDK e o `adb`. Na primeira abertura, aceite instalar o SDK padrão.
- Variável `ANDROID_HOME` apontando para o SDK (no Windows costuma ser `%LOCALAPPDATA%\Android\Sdk`), com `platform-tools` no `PATH`.

Só para **instalar um APK pronto**, basta o [platform-tools](https://developer.android.com/tools/releases/platform-tools) (o `adb`), sem o Android Studio.

### 2. No M51 (uma vez só)

1. **Configurações → Sobre o telefone → Informações do software** e toque **7 vezes** em **Número de compilação**.
2. **Configurações → Opções do desenvolvedor**: ligue **Depuração USB** (cabo) ou **Depuração sem fio** (Wi-Fi).
3. **Pelo cabo:** ligue o celular no computador e aceite **Permitir depuração USB**.
4. **Pelo Wi-Fi** (celular e computador na mesma rede):
   1. Em **Depuração sem fio → Parear dispositivo com código de pareamento**, pegue o IP, a porta e o código, e rode:
   ```bash
   adb pair IP_DO_CELULAR:PORTA_DE_PAREAMENTO
   ```
   2. Normalmente o celular já conecta sozinho. Se não, use o IP e a porta da tela principal de **Depuração sem fio**:
   ```bash
   adb connect IP_DO_CELULAR:PORTA
   ```
5. Confira se o M51 aparece como `device`:

```bash
adb devices
```

### 3. Instalar e rodar

```bash
npm install
```

```bash
npx expo run:android
```

Na primeira vez esse comando gera a pasta `android/` a partir do `app.json` e dos plugins, compila o app (demora alguns minutos), instala no M51 e abre o Metro, o servidor que entrega o JavaScript.

- **Mudou só código TypeScript/React?** Salve o arquivo e o app atualiza sozinho. Para abrir o servidor de novo outro dia: `npx expo start`.
- **Mudou `app.json`, plugin ou Kotlin?** Rode `npx expo run:android` de novo, porque isso muda o app nativo.
- **Vai usar no carro, longe do computador?** Instale a versão release, que já leva o JavaScript dentro do APK:

```bash
npx expo run:android --variant release
```

Para instalar um APK pronto:

```bash
adb install -r painel-208.apk
```

## Gerar o APK com o EAS (na nuvem)

O EAS compila o app nos servidores da Expo, sem precisar do Android Studio. O `eas.json` já tem dois perfis, os dois gerando **APK**:

| Perfil | Pra quê |
| --- | --- |
| `development` | APK com o "dev client": abre e conecta no `npx expo start` do seu computador (mesmo Wi-Fi). |
| `preview` | APK final, com o JavaScript dentro. **É o que fica no carro.** |

1. Crie uma conta grátis em [expo.dev](https://expo.dev) e entre:

```bash
npx eas-cli@latest login
```

2. Ligue o projeto à sua conta (só grava o `projectId` no `app.json`):

```bash
npx eas-cli@latest init
```

3. Gere o APK:

```bash
npx eas-cli@latest build -p android --profile preview
```

4. No fim aparece um link e um QR code. Abra no M51, baixe e instale.

A cada versão nova, aumente `android.versionCode` no `app.json`. Um APK do EAS tem assinatura diferente de um APK gerado no computador: para trocar de um para o outro, desinstale o app antes.

## Configurar

Tudo fica no `app.json`, nas opções do plugin `./plugins/withCarLauncher`. Depois de mudar, **gere o app de novo** (`npx expo run:android` ou EAS).

```json
["./plugins/withCarLauncher", {
  "asHomeLauncher": false,
  "sensorLandscape": true,
  "apps": [
    { "label": "Waze", "package": "com.waze", "tipo": "navegacao" },
    { "label": "Spotify", "package": "com.spotify.music", "tipo": "musica" },
    { "label": "Telefone", "package": "com.samsung.android.dialer", "tipo": "comunicacao" }
  ]
}]
```

- **`apps`**: a lista de atalhos, na ordem da tela. É a única lista do projeto.
  - **`tipo`** pode ser `navegacao`, `musica`, `comunicacao` ou `outro`. A barra lateral mostra o primeiro app de navegação, o primeiro de música e o primeiro de comunicação. O card da música usa o primeiro app de `musica` quando nada está tocando.
  - Para descobrir o pacote de um app instalado (troque `uber` pelo nome que procura):
  ```bash
  adb shell pm list packages | grep -i uber
  ```
  Exemplos: Uber Driver é `com.ubercab.driver`; o Autokit (adaptador Carlinkit) também entra assim.
- **`asHomeLauncher`**: `true` faz o Painel 208 poder virar a **tela inicial** do M51. Depois de instalar, aperte o botão Início e escolha "Painel 208" → "Sempre". Para voltar: **Configurações → Aplicativos → Escolher aplicativos padrão → Aplicativo da tela inicial**.
- **`sensorLandscape`**: `true` deixa a paisagem funcionar com a USB de qualquer lado do suporte.

Cores, tamanhos, a fonte e o limite de 120 km/h ficam em `src/config/theme.ts`.

## Como o projeto está organizado

```
app.json                  nome, pacote, paisagem, fonte Inter, plugins e lista de atalhos
eas.json                  perfis de build do EAS (development e preview → APK)
App.tsx                   raiz: esconde as barras, mantém a tela ligada
plugins/
  withCarLauncher.js      config plugin: <queries>, tela inicial e paisagem
  carLauncherManifest.js  funções que mexem no AndroidManifest (testadas)
modules/media-keys/       módulo Expo local em Kotlin: música, volume, tela dividida
src/
  config/                 tema (cores, fonte) e leitura da lista de atalhos
  lib/                    funções puras, sem React, todas com teste
  hooks/                  ligam o app ao sistema (GPS, bateria, música…)
  components/             Rail, NowPlayingCard, InstrumentCards, AppGrid…
  screens/DashboardScreen.tsx  monta o layout (tela cheia ou dividida)
__tests__/                testes (Jest)
```

### O que cada parte faz, e por quê

**Funções puras (`src/lib/`).** Toda a "inteligência" fica em funções que recebem dados e devolvem dados, sem tocar em GPS ou tela. Dá para testar cada regra com números inventados, sem celular e sem carro.

- **`trip.ts`** é o coração da viagem. O GPS do celular "treme": parado no semáforo ele acha que você andou, na garagem ele pula, no túnel ele some. A ideia central é uma **âncora**, o último ponto confiável. A distância sempre é medida da âncora até o ponto novo, e ponto ruim não vira âncora. As regras:
  - **abaixo de 3 km/h é parado**: não soma distância nem tempo;
  - **precisão pior que 35 m não soma distância**: o tempo ainda conta se o GPS diz que você está andando;
  - **mais de 10 s sem leitura** (túnel, garagem): os pontos de antes e de depois não são ligados com uma reta;
  - **salto acima de 250 km/h é descartado**;
  - **sem velocidade do GPS** (`speed` null ou negativo): calcula por distância ÷ tempo.
- **`nowPlaying.ts`**: confere os dados do player, calcula onde a música está agora (a barra anda sozinha entre uma leitura e outra) e tira a cor de fundo da capa, escurecida para o texto branco continuar legível.
- **`carApps.ts`**: valida a lista de atalhos e escolhe os 3 apps da barra lateral.
- **`battery.ts`**: além do "carregando/descarregando" do Android, guarda o maior nível visto desde que plugou. Se cair 2 pontos ainda na tomada, avisa "USB fraca".
- **`geo.ts`, `burnIn.ts`, `datetime.ts`, `format.ts`, `gauge.ts`**: distância e rumo, deslocamento anti burn-in, data em português, números no padrão brasileiro e geometria do anel.

**Módulo Kotlin (`modules/media-keys`).** Faz três coisas que o JavaScript sozinho não consegue:

1. **Lê o que está tocando.** Com o "Acesso a notificações" liberado, o Android deixa ler a *sessão de mídia* de qualquer player: título, artista, capa, duração e posição. A capa vira um arquivo JPEG e a cor média dela tinge o card. Quando a música troca ou pausa, o Kotlin avisa o JavaScript na hora.
2. **Controla o player.** Com acesso, manda tocar, pausar e pular direto para o player. Sem acesso, "aperta" as teclas de mídia, as mesmas de um fone Bluetooth. O volume muda sem o popup do sistema.
3. **Abre apps ao lado.** Pede ao Android para abrir o app na outra metade da tela quando o painel está em tela dividida.

O lado JavaScript usa `requireOptionalNativeModule`: se o módulo faltar, devolve `null` e o resto do app continua funcionando.

**Config plugin (`plugins/withCarLauncher.js`).** A pasta `android/` é gerada automaticamente e nunca é editada à mão. O plugin ajusta o AndroidManifest a cada geração. A partir do Android 11, um app só enxerga outros apps que declara em `<queries>`; sem isso, o painel nem saberia se o Waze está instalado.

**Tela.** Segue o CarPlay/Android Auto: barra lateral preta, cards grandes bem arredondados e a fonte **Inter**, embutida pelo plugin `expo-font`. O fundo é preto porque, em AMOLED, pixel preto fica apagado. Os números usam `tabular-nums` (todos os dígitos com a mesma largura), então "88" → "91" não faz o texto pular. Os botões têm no mínimo 64 dp de área de toque e não há popups, porque é para usar dirigindo. Abaixo de 700 dp de largura (tela dividida), o layout compacto entra sozinho.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run check` | TypeScript + lint + testes. Rode antes de cada commit. |
| `npm test` | Só os testes (Jest). |
| `npm run android` | O mesmo que `npx expo run:android`. |
| `npm start` | Servidor de desenvolvimento para o dev client. |
| `npm run prebuild` | Gera a pasta `android/` do zero, útil para conferir o AndroidManifest. |

## Próximos passos (estrutura já pronta)

- **Playlists do Spotify dentro do painel** (Curtidas, playlists, recomendações), com o SDK oficial "App Remote" do Spotify. Precisa cadastrar o app em developer.spotify.com (pacote `br.com.movcode.painel208`, redirect `painel208://spotify-callback` e o SHA-1 do certificado que assina o APK) para ter um Client ID.
- **Waze e música lado a lado com um toque**: um serviço de acessibilidade pode ligar a tela dividida sozinho. Precisa de mais uma liberação nas Configurações.
- **Próxima curva do Waze/Maps no painel**: o mesmo "Acesso a notificações" permite ler a notificação de navegação e mostrar a próxima manobra num card.
- **Uber/99 para motoristas**: atalho para o Uber Driver (`com.ubercab.driver`) e um card com a última notificação do app (chamada nova, mensagem). Aceitar corrida ou ver ganhos continua só no app deles.
- **OBD2 (ELM327 Bluetooth)**: RPM, temperatura etc., como um card novo com o seu hook (`useObd`).
