/**
 * Modelos do simulador de capacidade CNG.
 *
 * Percentagens: Thresholds e todos os campos de Result são FRAÇÕES (0,75 = 75 %).
 * Exceções, para coincidirem com a especificação e com o ecrã, estão em % :
 * GlobalParams.demandFactor, AnalysisConfig.stressStep e AnalysisConfig.stressMax.
 */

export type PrpType = 'R200' | 'R500';
export type TripMode = 'fractional' | 'whole';
export type ResourceKind = 'compressors' | 'trucks';
export type Status = 'OFFLINE' | 'UNDER_USED' | 'OK' | 'HIGH' | 'OVERLOAD' | 'CRITICAL' | 'INSUFFICIENT';
export type Verdict = 'VIABLE' | 'AT_LIMIT' | 'UNVIABLE';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

// ───────────── Inputs ─────────────

export interface GlobalParams {
  hoursPerDay: number;                       // h, 1–24
  truckCapacity: number;                     // MATs por viagem
  loadTimeH: number;                         // carga/descarga no cliente
  swapTimeH: number;                         // troca no posto-mãe
  totalMats: number;
  totalPads: number;
  totalPrp: Record<PrpType, number>;
  demandFactor: number;                      // %, 100 = sem alteração
}

export interface Customer {
  id: string;
  name: string;
  roundTripH: number;                        // viagem ida e volta, sem cargas
  matsInstalled: number;
  dailyDeliveries: number;                   // MATs/dia (aceita decimais)
  prpType: PrpType;
  pads: number;
  active: boolean;
  daysPerWeek: number;                       // 1–7
}

export interface Compressor {
  id: string;
  name: string;
  compressionTimeH: number;                  // por 2 MATs
  oilDrainH: number;                         // purga de óleo por 2 MATs
  lostHours: number;                         // horas perdidas por dia
  active: boolean;
}

export interface Truck {
  id: string;
  name: string;
  shiftHours: number;
  lostHours: number;
  available: boolean;
}

/** Limiares como frações. Acima de 100 % é sempre INSUFFICIENT. */
export interface Thresholds {
  underUsed: number;                         // até aqui: UNDER_USED (0,40)
  high: number;                              // até aqui: OK (0,75)
  overload: number;                          // até aqui: HIGH (0,90); depois OVERLOAD / CRITICAL
}

export interface AnalysisConfig {
  stressStep: number;                        // %, passo do teste de esforço
  stressMax: number;                         // %, aumento máximo da procura
  tripMode: TripMode;
  thresholds: Thresholds;
}

export interface Scenario {
  id: string;
  name: string;
  params: GlobalParams;
  customers: Customer[];
  compressors: Compressor[];
  trucks: Truck[];
  analysis: AnalysisConfig;
}

// ───────────── Resultados ─────────────

export interface ResourceLoad {
  id: string;
  name: string;
  active: boolean;
  capacity: number;                          // MATs/dia (compressor) ou h/dia (camião)
  used: number;
  util: number;                              // fração; Infinity = procura sem capacidade
  status: Status;
}

export interface CustomerLoad {
  id: string;
  name: string;
  active: boolean;
  cycleH: number;                            // viagem + carga + troca
  deliveries: number;                        // MATs/dia médios, depois dos fatores
  tripsPerDay: number;
  truckHours: number;
  share: number;                             // fração das horas de camião
  autonomyDays: number | null;               // MATs instalados / entregas por dia
}

export interface Inventory {
  matsFree: number;
  matsAtCustomers: number;
  padsFree: number;
  padsAtCustomers: number;
  prpFree: Record<PrpType, number>;
  prpUsed: Record<PrpType, number>;
}

export interface StressPoint {
  increase: number;                          // fração: 0,3 = +30 %
  demand: number;
  compressorUtil: number;
  truckUtil: number;
  viable: boolean;                           // ambas as utilizações ≤ 100 %
}

export interface Alert {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

export interface Issue {
  level: 'error' | 'warn';
  path: string;                              // igual ao caminho do controlo no formulário
  message: string;
}

export interface Result {
  demand: number;                            // MATs/dia
  compressorCap: number;                     // MATs/dia
  compressorUtil: number;
  truckHoursNeeded: number;
  truckHoursAvailable: number;
  truckUtil: number;
  systemUtil: number;                        // utilização do gargalo
  bottleneck: ResourceKind | null;           // null = sem procura
  coverage: number;                          // fração da procura que a operação consegue servir
  verdict: Verdict;
  compressorStatus: Status;
  truckStatus: Status;
  systemStatus: Status;
  compressors: ResourceLoad[];
  trucks: ResourceLoad[];
  spare: { compressorMats: number; truckHours: number };   // negativo = défice
  growthMargin: { compressors: number; trucks: number };   // fração; Infinity = sem procura
  perCustomer: CustomerLoad[];
  inventory: Inventory;
  stress: StressPoint[];
  alerts: Alert[];
  issues: Issue[];
}
