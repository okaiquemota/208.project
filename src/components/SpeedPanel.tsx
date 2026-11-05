// Lado esquerdo do painel: o velocímetro ou, se não der pra medir,
// o motivo (sem permissão, GPS desligado) com um botão pra resolver.

import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { colors } from '../config/theme';
import type { GpsState } from '../hooks/useGps';
import { toCardinal } from '../lib/geo';
import { BigButton } from './BigButton';
import { Speedometer } from './Speedometer';

type Props = { gps: GpsState };

export function SpeedPanel({ gps }: Props) {
  const [size, setSize] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize(Math.floor(Math.min(width, height)));
  };

  return (
    <View style={styles.root} onLayout={onLayout}>
      <Content gps={gps} size={size} />
    </View>
  );
}

function Content({ gps, size }: Props & { size: number }) {
  const { status, trip } = gps;

  if (status === 'sem-permissao') {
    return (
      <Notice
        title="Sem acesso à localização"
        body="O Painel 208 usa o GPS para mostrar a velocidade e os dados da viagem."
        action={gps.canAskAgain ? 'Permitir localização' : 'Abrir configurações'}
        onAction={gps.requestPermission}
      />
    );
  }

  if (status === 'desligado') {
    return (
      <Notice
        title="GPS desligado"
        body="Ligue a localização do celular para ver a velocidade."
        action="Ligar localização"
        onAction={gps.openLocationSettings}
      />
    );
  }

  if (status === 'iniciando' || status === 'procurando') {
    return (
      <Speedometer
        size={size}
        speedKmh={null}
        caption={status === 'iniciando' ? 'Iniciando GPS…' : 'Procurando GPS…'}
        dimmed
      />
    );
  }

  return (
    <Speedometer
      size={size}
      speedKmh={trip.speedKmh}
      caption={trip.headingDeg === null ? null : toCardinal(trip.headingDeg)}
    />
  );
}

function Notice({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
      <BigButton onPress={onAction} accessibilityLabel={action} style={styles.noticeButton}>
        <Text style={styles.noticeButtonText}>{action}</Text>
      </BigButton>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 14,
  },
  noticeTitle: {
    color: colors.alert,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  noticeBody: {
    color: colors.textDim,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  noticeButton: {
    paddingHorizontal: 24,
    marginTop: 6,
  },
  noticeButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
