# Painel 208

App Android que transforma um **Samsung Galaxy M51** numa segunda multimídia, no estilo CarPlay, para o **Peugeot 208 2014**. O celular fica deitado num suporte no painel, ligado na USB do carro.

Pacote: `br.com.movcode.painel208` · Expo SDK 58 + TypeScript · development build (não roda no Expo Go, porque tem código nativo próprio).

**Telas** (navegação pela barra lateral):

| Tela | O que tem |
| --- | --- |
| **Início** | Tela modular: um card principal (player, **mapa 3D** ou velocidade grande) e uma coluna com até 3 widgets, escolhidos nos Ajustes. |
| **Música** | O player em coluna e, ao lado, a **escolha de música no Spotify** no estilo do Spotify no CarPlay: abas das seções do Spotify, fileiras de capas grandes e a playlist aberta com **Tocar**, **Aleatório** e a lista de músicas. O que está tocando aparece em verde com barrinhas animadas. |
| **Apps** | Grade de ícones grandes: os apps da lista do `app.json`, os apps de música achados sozinhos e o atalho **Ajustes**. |
| **Mensagens** | Conversas novas do WhatsApp: lista à esquerda, conversa aberta à direita, com respostas rápidas de um toque. Abre pelo ícone do WhatsApp na barra lateral (com o número de conversas novas) ou pelo widget. |
| **Ajustes** | Montar a tela de início, cor de destaque, fundo da tela, cores do mapa, alerta de velocidade e permissões. Tudo fica salvo no celular. |

```
┌──────┬──────────────────────────────────┬──────────────┐
│ 78%  │  (capa desfocada no fundo)       │  widget 1    │
│14:32 │ ┌────────┐ TOCANDO NO SPOTIFY    │              │
│      │ │  capa  │ Céu Aberto            ├──────────────┤
│  ⌂   │ └────────┘ Banda de Exemplo      │  widget 2    │
│  ♫   │ ━━━━━━━━━━●──────────────  -2:09 │              │
│  ▦   │   ♥    ⏮     ( ⏸ )     ⏭    ⤮   ├──────────────┤
│ (W)  │                                  │  widget 3    │
└──────┴──────────────────────────────────┴──────────────┘
```

Em **tela dividida com o Waze** (largura menor que 820 dp), o painel vira o lado direito do CarPlay: barra lateral com a velocidade, **próxima curva** em cima (quando há rota) e a **música** embaixo. Veja "Waze + música lado a lado".

### Widgets da tela de início

Desenhados a partir dos widgets do CarPlay (iOS 26) e do Android Auto, e do painel analógico do próprio 208. Fundo liso, sem títulos e desenhos reconhecíveis. Cor só nos detalhes.

| Widget | O que mostra |
| --- | --- |
| **Velocidade** | Mostrador com marcações a cada 5 km/h que acendem até a velocidade atual. Depois do limite escolhido elas são vermelhas. Mostra também a direção (NE 52°) e o sinal do GPS em barrinhas. Como card principal, vira um velocímetro grande com a escala de 0 a 200. |
| **Viagem** | Distância em destaque e, embaixo, tempo em movimento, média e máxima. Segure 0,8 s para zerar. |
| **Volume** | Volume da música em degraus. |
| **Relógio** | Relógio de ponteiros (o dos segundos na cor de destaque), hora digital e data. |
| **Calendário** | Dia de hoje em destaque e o mês inteiro, com hoje marcado. |
| **Bateria** | Anel de carga (verde carregando, laranja com USB fraca), porcentagem e situação. |
| **Clima** | Cidade, temperatura grande, tempo e máx./mín. do dia ([Open-Meteo](https://open-meteo.com), gratuito, sem cadastro). Atualiza a cada 20 min ou a cada ~10 km. Precisa de internet. |
| **Bússola** | Rosa dos ventos que gira com o carro, direção em graus e altitude. |
| **Mini player** | A música atual em tamanho pequeno (quando o card principal é a velocidade). |
| **Atalhos** | Quatro apps de acesso rápido. |
| **Próxima curva** | Seta, distância e rua da próxima manobra do Waze ou do Maps, lidas da notificação do app de navegação. Tocar volta para a rota no app. |
| **WhatsApp** | A última mensagem (foto, nome, horário) e quantas outras conversas têm mensagem nova. Tocar abre a tela Mensagens. |

Escolher "Nenhum" numa posição faz os outros widgets crescerem para ocupar o espaço.

### Player de música

- Funciona com **qualquer app de música**, não só o Spotify, e é **sempre automático**: o painel mostra o que estiver tocando. Quando nada toca, ele oferece o Spotify.
- Mostra **de onde está tocando** ("Tocando de Músicas Curtidas", "Tocando de Daily Mix 1") quando o Spotify está conectado.
- No estilo do Spotify: capa desfocada no fundo, capa grande, título, artista, barra de progresso, play branco redondo e os botões extras do próprio app (no Spotify: curtir e aleatório/repetir).
- Capa, título e progresso precisam do **Acesso a notificações** (veja abaixo). Sem ele, os botões continuam funcionando.
- **Com o Spotify conectado** (veja abaixo), o player fala direto com o Spotify: capa em alta (720 px), **coração aceso** nas músicas curtidas (tocar curte/descurte), **aleatório** e **repetir** com o estado certo (verdes quando ligados). Funciona mesmo sem o Acesso a notificações. Se outro app estiver tocando, o player mostra esse outro app.
- **Spotify por dentro**: na tela Música, aba **Spotify**, aparecem as mesmas listas que o Spotify mostra em carros (tocadas recentemente, curtidas, Daily Mix, playlists). Toque numa lista para abrir, numa música para tocar, ou em **Tocar** para tocar a lista inteira. Precisa de **Spotify Premium** e de ligar o Spotify uma vez (veja abaixo).

### Mapa 3D

Escolha **Mapa 3D** como card principal nos Ajustes. É um mapa nativo do próprio painel ([MapLibre](https://maplibre.org) com os mapas gratuitos do [OpenFreeMap](https://openfreemap.org), dados do OpenStreetMap; sem chave e sem cadastro), no estilo do Waze no CarPlay:

- **3D**: câmera inclinada, prédios em 3D (mais baixos e translúcidos, para não tapar as ruas) e o botão **2D/3D**;
- **segue o carro e gira com ele**: a seta fica sempre no mesmo lugar, apontando para frente, e o mapa desliza por baixo a cada leitura do GPS. Parado, o mapa não gira;
- **zoom pela velocidade**: de perto na cidade, mais aberto na estrada. Os botões **+/−** ajustam;
- **visual noturno** cinza com ruas mais claras conforme a importância, nomes de ruas e bairros em português, sem ícones de lojas poluindo (nos Ajustes há a versão clara, de dia);
- **próxima curva** (seta, distância e rua) e, embaixo, **chegada, minutos e km**, quando há rota no Waze ou no Maps;
- **velocidade** num círculo (fica vermelha acima do alerta);
- **Casa** e **Trabalho**: começam a rota no Waze na hora (endereços salvos no próprio Waze);
- **botão do Waze**: abre o app de verdade ao lado.

O mapa não arrasta com o dedo (o carro fica sempre no lugar). Rota desenhada, trânsito ao vivo e voz são do app do Waze: para isso, Waze numa metade da tela e o painel na outra (veja abaixo). O mapa usa a internet do celular (dados móveis).

### Mensagens do WhatsApp

- As conversas com mensagem nova aparecem na tela **Mensagens** e no widget **WhatsApp**, com foto, nome e as últimas mensagens.
- **Respostas rápidas** de um toque: "Dirigindo, já respondo 🚗", "Chego em 10 min", "Ok 👍" e "Te ligo depois". Elas usam o botão "Responder" da própria notificação do WhatsApp, então saem como uma resposta normal sua.
- **Lida** marca a conversa como lida; **Abrir** abre a conversa no WhatsApp.
- Nada é salvo: o painel só lê as notificações que estão na barra do celular. Quando a notificação some (você leu no celular), some do painel também.
- Usa o mesmo **Acesso a notificações** do player.

### Outros recursos

- **Bateria**: fica laranja na barra lateral quando está na bateria ou com USB fraca.
- **Fundo**: papel de parede escuro com formas suaves na cor de destaque, como o do CarPlay, e cards de "vidro" escuro por cima. Nos Ajustes dá para trocar pelo preto puro, que economiza a tela AMOLED.
- **Tela**: paisagem pelos dois lados, tela cheia, sempre ligada e deslocamento anti burn-in de 1–2 dp por minuto.

## Primeira vez no M51

### Ativar o "Tocando agora" (uma vez só)

Para mostrar música, artista e capa, a próxima curva e as mensagens do WhatsApp, o Android exige que você libere o Painel 208 em **Acesso a notificações** (um acesso só para tudo isso):

1. No card da música, toque em **Ativar**. Abre a tela certa do Android.
2. Ligue a chave do **Painel 208** e confirme.
3. Volte para o painel. A música aparece em seguida.

Se a chave estiver **cinza** com o aviso "configuração restrita" (acontece no Android 13+ quando o APK é instalado pelo navegador ou pelo gerenciador de arquivos):

1. Vá em **Configurações → Aplicativos → Painel 208**.
2. Toque nos **⋮** (canto superior direito) → **Permitir configurações restritas**.
3. Repita os passos acima.

### Ligar o Spotify (uma vez só)

O painel usa o SDK oficial do Spotify ("App Remote"). Ele conversa com o app do Spotify instalado no celular, então o Spotify precisa estar instalado e logado numa conta **Premium**.

**1. No site do Spotify** ([developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → seu app → **Settings → Edit**):

- **Redirect URIs**: `painel208://spotify-callback`
- **Android packages**: pacote `br.com.movcode.painel208` e o SHA-1 do certificado que assina o APK:
  - APK gerado no computador (`npx expo run:android` ou os APKs enviados no chat): `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
  - APK do EAS: outro certificado. Veja o SHA-1 com `npx eas-cli@latest credentials` e cadastre também (dá para ter os dois).
- **APIs used**: marque **Android**.
- **User Management**: adicione o e-mail da sua conta do Spotify. Em modo de desenvolvimento, só quem está nessa lista consegue usar (até 5 pessoas).

O Client ID fica em `src/config/spotify.ts`. O **Client secret** não é usado e **nunca** deve ir para o código.

**2. No painel:** tela **Música** → aba **Spotify** → **Conectar ao Spotify**. Na primeira vez o próprio Spotify pergunta se você autoriza; aceite. Depois disso o painel reconecta sozinho sempre que abrir.

Se der erro, a mensagem diz o que falta (Spotify não instalado, não logado, cadastro do SHA-1/e-mail no site, versão antiga do Spotify).

### Waze + música lado a lado

Como no painel do CarPlay: o **Waze de verdade** (rota, voz, alertas) numa metade e o painel na outra, com a próxima curva e a música. O Android não deixa colocar o app do Waze *dentro* de outro app, mas a tela dividida faz exatamente isso.

**Com um toque (recomendado).** Ligue uma vez o serviço do painel em Acessibilidade:

1. **Apps → Ajustes → Permissões → "Waze + música (tela dividida)" → Ativar**. Abre a tela de Acessibilidade do Android.
2. Toque em **Aplicativos instalados** → **Painel 208: Waze + música** → ligue e confirme.
3. Se a chave estiver cinza ("configuração restrita"), libere como no Acesso a notificações: **Configurações → Aplicativos → Painel 208 → ⋮ → Permitir configurações restritas**.

Depois disso, tocar no **Waze na barra lateral** (ou no botão do Waze no mapa) abre o Waze à esquerda e o painel à direita. O serviço só usa o comando "dividir tela" do Android: não lê o conteúdo da tela nem o que você digita.

**Sem o serviço: par de apps da Samsung.** O One UI cria um atalho que abre dois apps lado a lado:

1. Abra o **Painel Edge** (a aba na borda da tela) → ⚙ → ative **Apps**.
2. No painel Apps, toque em **Criar par de apps**, escolha **Waze** e depois **Painel 208**, e salve.
3. Um toque nesse par abre os dois lado a lado.

**Na mão.** Abra o Waze → **Recentes** → toque no ícone do Painel 208 em cima do cartão → **Abrir na exibição em tela dividida** → toque no Waze para a outra metade. Arraste a divisória se quiser mais espaço para o Waze.

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
App.tsx                   raiz: barras escondidas, tela ligada, ajustes salvos
plugins/
  withCarLauncher.js      config plugin: <queries>, apps de música, tela inicial e paisagem
  carLauncherManifest.js  funções que mexem no AndroidManifest (testadas)
  withLocalMaven.js       config plugin: repositório Maven local (onde fica o SDK do Spotify)
modules/media-keys/       módulo Expo local em Kotlin: música de qualquer app, volume, tela dividida,
                          Spotify, próxima curva e WhatsApp (pelas notificações)
  android/maven/          SDK "App Remote" do Spotify (.aar oficial, licença Apache 2.0)
src/
  config/                 tema (cores, fonte) e leitura da lista de atalhos
  lib/                    funções puras, sem React, todas com teste
  state/settings.tsx      ajustes salvos no celular, para todas as telas
  hooks/                  ligam o app ao sistema (GPS, bateria, música, clima…)
  components/             barra lateral, player, widgets, grade de apps
  screens/                Início, Música, Mensagens, Ajustes e a "casca" (DashboardScreen)
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
- **`carApps.ts`**: valida a lista de atalhos e escolhe os apps fixos da barra lateral.
- **`settings.ts`**: os ajustes (widgets da tela de início, cor, alerta, player). Valida o que está salvo: um ajuste corrompido volta ao padrão em vez de derrubar o app. Escolher um widget que já está em outra posição troca os dois de lugar.
- **`spotify.ts`**: confere as listas que vêm do Spotify e traduz os erros dele para mensagens em português que dizem o que fazer.
- **`spotifyPlayer.ts`**: o estado do player do Spotify (música, curtida, aleatório, repetir), os botões dele e a regra de quando o card usa o Spotify direto ou a sessão de mídia do Android.
- **`carMap.ts`**: o estilo do mapa 3D (cores do tema, largura de cada tipo de rua por zoom, prédios 3D, nomes em português) e as contas da câmera: zoom pela velocidade (17,3 parado → 15,5 a 120 km/h), direção (segue o GPS andando, fica parada abaixo de 5 km/h) e o espaço em cima que põe o carro a 70% da altura da tela.
- **`waze.ts`**: os links oficiais do Waze que começam a rota para Casa ou Trabalho.
- **`navigation.ts`**: entende a notificação do app de navegação. Cada app escreve de um jeito ("300 m" no título e a rua no texto, ou "Vire à direita em 300 m"), então ela procura a distância em qualquer campo e usa o resto como instrução. Sem distância (ex.: "Waze em execução"), não é curva. Também separa a rua e tira chegada/minutos/km da linha de resumo.
- **`messages.ts`**: valida as conversas do WhatsApp, o horário curto ("agora", "5 min", "ontem") e as respostas rápidas.
- **`weather.ts`**: monta o pedido ao Open-Meteo e traduz o código do tempo para texto e ícone em português.
- **`widgets.ts`**: barrinhas do sinal do GPS, LEDs do velocímetro e degraus do volume.
- **`battery.ts`**: além do "carregando/descarregando" do Android, guarda o maior nível visto desde que plugou. Se cair 2 pontos ainda na tomada, avisa "USB fraca".
- **`geo.ts`, `burnIn.ts`, `datetime.ts`, `format.ts`, `gauge.ts`**: distância e rumo, deslocamento anti burn-in, data em português, números no padrão brasileiro e geometria do anel.

**Módulo Kotlin (`modules/media-keys`).** Faz o que o JavaScript sozinho não consegue:

1. **Acha todos os apps de música.** Procura os apps que oferecem o serviço de mídia (`MediaBrowserService`), do mesmo jeito que o Android Auto. Por isso a lista aparece sozinha, sem configurar nada. Para o Android 11+ deixar o app enxergar esses apps, o plugin declara essa busca em `<queries>`.
2. **Lê o que está tocando.** Com o "Acesso a notificações" liberado, o Android deixa ler a *sessão de mídia* de qualquer player: título, artista, capa, duração e posição. A capa vira um arquivo JPEG e a cor média dela tinge o card. Quando a música troca ou pausa, o Kotlin avisa o JavaScript na hora.
3. **Controla o player.** Com acesso, manda tocar, pausar e pular direto para o player. Sem acesso, "aperta" as teclas de mídia, as mesmas de um fone Bluetooth. O volume muda sem o popup do sistema.
4. **Abre apps ao lado.** Pede ao Android para abrir o app na outra metade da tela quando o painel está em tela dividida. Com o serviço de acessibilidade ligado (`SplitScreenService.kt`), monta a tela dividida sozinho: abre o Waze, pede ao Android "dividir tela" e abre o painel na outra metade.
5. **Spotify por dentro** (`SpotifyModule.kt`). Usa o SDK "App Remote" do Spotify, que fala direto com o app do Spotify do celular (o painel não guarda senha nem token). Ele entrega as listas "para carro" em forma de árvore: cada item pode ser aberto (tem filhos) ou tocado. O Kotlin guarda os itens e o JavaScript só passa o id; as capas viram arquivos JPEG no cache. O SDK não está no Maven Central, por isso o `.aar` fica dentro do módulo e o plugin `withLocalMaven` aponta o Gradle para essa pasta.
6. **Próxima curva e WhatsApp** (`CarNotificationsModule.kt`). O mesmo serviço do "Acesso a notificações" recebe as notificações; o painel guarda na memória só as de navegação (Waze, Maps…) e as conversas do WhatsApp. A seta da manobra e a foto do contato viram PNG. Para responder, o painel aperta o botão "Responder" da própria notificação com o texto escolhido (é o mesmo recurso que relógios e o Android Auto usam).

O lado JavaScript usa `requireOptionalNativeModule`: se o módulo faltar, devolve `null` e o resto do app continua funcionando.

**Config plugin (`plugins/withCarLauncher.js`).** A pasta `android/` é gerada automaticamente e nunca é editada à mão. O plugin ajusta o AndroidManifest a cada geração. A partir do Android 11, um app só enxerga outros apps que declara em `<queries>`; sem isso, o painel nem saberia se o Waze está instalado.

**Movimento.** As animações usam o Reanimated, que roda na thread de interface (fica liso mesmo com o JavaScript ocupado): botões afundam e voltam com mola, o destaque da barra lateral desliza, telas e capas entram em sequência, a barra de progresso anda lisa, a música nova entra deslizando e o coração pulsa ao curtir. Tudo curto (até ~350 ms) para não distrair dirigindo.

**Tela.** Segue o CarPlay/Android Auto: barra lateral preta, cards grandes bem arredondados e a fonte **Inter**, embutida pelo plugin `expo-font`. O fundo é preto porque, em AMOLED, pixel preto fica apagado. Os números usam `tabular-nums` (todos os dígitos com a mesma largura), então "88" → "91" não faz o texto pular. Os botões têm no mínimo 64 dp de área de toque e não há popups, porque é para usar dirigindo. Abaixo de 820 dp de largura (tela dividida), o layout compacto entra sozinho. O player também se ajusta à largura: os botões encolhem e, se faltar espaço, ficam só anterior, play e próxima.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run check` | TypeScript + lint + testes. Rode antes de cada commit. |
| `npm test` | Só os testes (Jest). |
| `npm run android` | O mesmo que `npx expo run:android`. |
| `npm start` | Servidor de desenvolvimento para o dev client. |
| `npm run prebuild` | Gera a pasta `android/` do zero, útil para conferir o AndroidManifest. |

## Próximos passos (estrutura já pronta)

- **Uber/99 para motoristas**: atalho para o Uber Driver (`com.ubercab.driver`) e um card com a última notificação do app (chamada nova, mensagem). Aceitar corrida ou ver ganhos continua só no app deles.
- **OBD2 (ELM327 Bluetooth)**: RPM, temperatura etc., como um card novo com o seu hook (`useObd`).
