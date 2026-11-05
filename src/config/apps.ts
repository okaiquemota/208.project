// Lista de atalhos do painel.
//
// A lista em si fica no app.json, nas opções do plugin "./plugins/withCarLauncher".
// Para adicionar ou remover um app, edite só lá e gere o build de novo
// (o Android precisa do pacote declarado em <queries>, que vai no build).
//
// O plugin repassa a lista para `extra.carApps`; aqui só lemos e validamos.

import Constants from 'expo-constants';

import { type CarApp, parseCarApps } from '../lib/carApps';

export const CAR_APPS: CarApp[] = parseCarApps(Constants.expoConfig?.extra?.carApps);

export type { CarApp };
