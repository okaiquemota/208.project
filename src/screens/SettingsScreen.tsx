// Ajustes: montar a tela de início, cor de destaque, alerta de velocidade e
// permissões. Tudo é salvo na hora, no celular.
// (É usada com o carro parado, então pode rolar a tela.)

import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CheckIcon } from '../components/icons';
import { Touch } from '../components/Touch';
import { colors, font, sizes } from '../config/theme';
import type { GpsState } from '../hooks/useGps';
import type { MediaState } from '../hooks/useMedia';
import type { SplitScreenState } from '../hooks/useSplitScreen';
import {
  ACCENTS,
  type AccentId,
  MAIN_INFO,
  MAIN_WIDGETS,
  setMainWidget,
  setSideWidget,
  SIDE_SLOTS,
  sideOptions,
  SPEED_ALERT_OPTIONS,
  WIDGET_INFO,
} from '../lib/settings';
import { useAccent, useSettings } from '../state/settings';

type Props = {
  gps: GpsState;
  media: MediaState;
  split: SplitScreenState;
  onDone: () => void;
};

export function SettingsScreen({ gps, media, split, onDone }: Props) {
  const { settings, update } = useSettings();
  const accent = useAccent();
  const { main, side } = settings.home;
  const options = sideOptions(main);
  const version = Constants.expoConfig?.version ?? '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={font(26, '800')}>Ajustes</Text>
        <Touch onPress={onDone} accessibilityLabel="Voltar ao início" style={[styles.doneButton, { backgroundColor: accent.main }]}>
          <Text style={font(15, '800')}>Pronto</Text>
        </Touch>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="Tela de início">
          <Label>Card principal</Label>
          <Chips>
            {MAIN_WIDGETS.map((w) => (
              <Chip
                key={w}
                label={MAIN_INFO[w].nome}
                selected={main === w}
                onPress={() => update((s) => setMainWidget(s, w))}
              />
            ))}
          </Chips>

          {Array.from({ length: SIDE_SLOTS }, (_, i) => (
            <View key={i}>
              <Label>{`Coluna da direita · ${i + 1}º widget`}</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                <Chip
                  label="Nenhum"
                  selected={side[i] === null}
                  onPress={() => update((s) => setSideWidget(s, i, null))}
                />
                {options.map((w) => (
                  <Chip
                    key={w}
                    label={WIDGET_INFO[w].nome}
                    selected={side[i] === w}
                    onPress={() => update((s) => setSideWidget(s, i, w))}
                  />
                ))}
              </ScrollView>
            </View>
          ))}
          <Text style={[font(12, '600', colors.text3), styles.hint]}>
            Escolher um widget que já está em outra posição troca os dois de lugar.
          </Text>
        </Section>

        <Section title="Cor de destaque">
          <View style={styles.colors}>
            {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
              <Touch
                key={id}
                onPress={() => update((s) => ({ ...s, accent: id }))}
                accessibilityLabel={`Cor ${ACCENTS[id].nome}`}
                style={styles.colorItem}
              >
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: ACCENTS[id].main },
                    settings.accent === id && styles.colorDotSelected,
                  ]}
                >
                  {settings.accent === id && <CheckIcon size={22} color={colors.text} />}
                </View>
                <Text style={font(12, '600', colors.text2)}>{ACCENTS[id].nome}</Text>
              </Touch>
            ))}
          </View>
        </Section>

        <Section title="Fundo da tela">
          <Chips>
            <Chip
              label="Papel de parede"
              selected={settings.background === 'papel'}
              onPress={() => update((s) => ({ ...s, background: 'papel' }))}
            />
            <Chip
              label="Preto (economiza tela AMOLED)"
              selected={settings.background === 'preto'}
              onPress={() => update((s) => ({ ...s, background: 'preto' }))}
            />
          </Chips>
        </Section>

        <Section title="Mapa do Waze">
          <Chips>
            <Chip
              label="Escuro (noturno)"
              selected={settings.mapTheme === 'escuro'}
              onPress={() => update((s) => ({ ...s, mapTheme: 'escuro' }))}
            />
            <Chip
              label="Claro (original)"
              selected={settings.mapTheme === 'claro'}
              onPress={() => update((s) => ({ ...s, mapTheme: 'claro' }))}
            />
          </Chips>
          <Text style={[font(12, '600', colors.text3), styles.hint]}>
            Escolha “Mapa ao vivo (Waze)” no card principal. O mapa usa a internet do celular.
          </Text>
        </Section>

        <Section title="Alerta de velocidade">
          <Label>A velocidade fica vermelha acima de:</Label>
          <Chips>
            {SPEED_ALERT_OPTIONS.map((v) => (
              <Chip
                key={v}
                label={v === 0 ? 'Desligado' : `${v} km/h`}
                selected={settings.speedAlertKmh === v}
                onPress={() => update((s) => ({ ...s, speedAlertKmh: v }))}
              />
            ))}
          </Chips>
        </Section>

        <Section title="Permissões">
          <Permission
            title="Localização"
            detail="Velocidade, viagem, bússola e clima"
            ok={gps.status !== 'sem-permissao'}
            action={gps.canAskAgain ? 'Permitir' : 'Abrir configurações'}
            onAction={gps.requestPermission}
          />
          <Permission
            title="Acesso a notificações"
            detail="Música, próxima curva e WhatsApp"
            ok={media.hasAccess}
            action="Liberar"
            onAction={media.openAccessSettings}
          />
          {split.available && (
            <Permission
              title="Waze + música (tela dividida)"
              detail="Tocar no Waze abre o Waze e o painel lado a lado"
              ok={split.enabled}
              action="Ativar"
              onAction={split.openSettings}
            />
          )}
          <Permission
            title="GPS ligado"
            detail="A localização do celular precisa estar ativa"
            ok={gps.status !== 'desligado'}
            action="Ligar"
            onAction={gps.openLocationSettings}
          />
        </Section>

        <Text style={[font(12, '600', colors.text3), styles.about]}>{`Painel 208 · versão ${version}`}</Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={font(18, '800')}>{title}</Text>
      {children}
    </View>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={[font(13, '700', colors.text2), styles.label]}>{children}</Text>;
}

function Chips({ children }: { children: ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const accent = useAccent();
  return (
    <Touch
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.chip, selected && { backgroundColor: accent.main, borderColor: accent.main }]}
    >
      <Text style={font(14, '700', selected ? colors.text : colors.text2)} allowFontScaling={false}>
        {label}
      </Text>
    </Touch>
  );
}

function Permission({
  title,
  detail,
  ok,
  action,
  onAction,
}: {
  title: string;
  detail: string;
  ok: boolean;
  action: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.permission}>
      <View style={[styles.statusDot, { backgroundColor: ok ? colors.green : colors.orange }]} />
      <View style={styles.flex1}>
        <Text style={font(15, '700')}>{title}</Text>
        <Text style={font(12, '600', colors.text2)}>{ok ? `Liberado · ${detail}` : detail}</Text>
      </View>
      {!ok && (
        <Touch onPress={onAction} accessibilityLabel={action} style={styles.permissionButton}>
          <Text style={font(14, '800', '#000')}>{action}</Text>
        </Touch>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  doneButton: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  label: {
    marginTop: 6,
  },
  hint: {
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  colorItem: {
    alignItems: 'center',
    gap: 6,
    minWidth: 64,
  },
  colorDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  permission: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.fill,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  flex1: {
    flex: 1,
  },
  permissionButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  about: {
    textAlign: 'center',
    marginTop: 8,
  },
});
