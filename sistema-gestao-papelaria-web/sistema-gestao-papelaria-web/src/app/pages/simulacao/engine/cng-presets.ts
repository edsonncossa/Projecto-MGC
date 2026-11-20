import { Customer, Compressor, PrpType, Scenario, Truck } from '../models/cng.models';
import { DEFAULT_THRESHOLDS } from './cng-engine';

let seq = 0;
/** Identificador único e estável dentro da sessão (usado como chave nas listas). */
export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}${seq}`;
}

export function newCustomer(
  name: string,
  roundTripH: number,
  matsInstalled: number,
  dailyDeliveries: number,
  prpType: PrpType,
  active = true
): Customer {
  return {
    id: uid('cust'),
    name,
    roundTripH,
    matsInstalled,
    dailyDeliveries,
    prpType,
    pads: matsInstalled + 1,          // por defeito MATs + 1, editável
    active,
    daysPerWeek: 7
  };
}

export function newCompressor(name: string, compressionTimeH: number, active: boolean): Compressor {
  return { id: uid('comp'), name, compressionTimeH, oilDrainH: 0.25, lostHours: 2, active };
}

export function newTruck(name: string, available = true): Truck {
  return { id: uid('truck'), name, shiftHours: 24, lostHours: 3, available };
}

/** Cenário A — a configuração exata do Excel. Dá 14 MATs/dia, 71,6 %, 26,75 h e 63,7 %. */
export function baseScenario(): Scenario {
  return {
    id: uid('scn'),
    name: 'Base (Excel)',
    params: {
      hoursPerDay: 24,
      truckCapacity: 2,
      loadTimeH: 0.25,
      swapTimeH: 0.25,
      totalMats: 28,
      totalPads: 38,
      totalPrp: { R200: 4, R500: 3 },
      demandFactor: 100
    },
    customers: [
      newCustomer('SILU', 2.5, 4, 4, 'R500'),
      newCustomer('SOCIMOL', 2.5, 4, 2, 'R500'),
      newCustomer('HEINEKEN', 6, 6, 4, 'R500'),
      newCustomer('EDO', 2.5, 3, 2, 'R200'),
      newCustomer('COMPAL', 2, 2, 1, 'R200'),
      newCustomer('FESCO', 0.5, 2, 1, 'R200'),
      newCustomer('LIMAK', 2, 6, 5, 'R200', false)
    ],
    compressors: [newCompressor('Galileo', 2.5, false), newCompressor('IMW', 2, true)],
    trucks: [newTruck('Truck 1'), newTruck('Truck 2')],
    analysis: {
      stressStep: 10,
      stressMax: 120,
      tripMode: 'fractional',
      thresholds: { ...DEFAULT_THRESHOLDS }
    }
  };
}

// ───────────── Cenários de exemplo (secção 4 da especificação) ─────────────

function customer(s: Scenario, name: string): Customer {
  const c = s.customers.find(x => x.name === name);
  if (!c) throw new Error(`Cliente não encontrado: ${name}`);
  return c;
}
function compressor(s: Scenario, name: string): Compressor {
  const c = s.compressors.find(x => x.name === name);
  if (!c) throw new Error(`Compressor não encontrado: ${name}`);
  return c;
}
function truck(s: Scenario, name: string): Truck {
  const t = s.trucks.find(x => x.name === name);
  if (!t) throw new Error(`Camião não encontrado: ${name}`);
  return t;
}

/**
 * Médias diárias de MATs entregues, folha "MAT Dispatch", 1 jan a 30 abr 2026 (120 dias).
 * Totais no período: LIMAK 532, SOCIMOL 206, EDO 197, FESCO 89, COMPAL 45  →  8,908 MATs/dia.
 */
const HISTORY_DAYS = 120;
const HISTORY_AVG: Record<string, number> = {
  LIMAK: 532 / HISTORY_DAYS,
  SOCIMOL: 206 / HISTORY_DAYS,
  EDO: 197 / HISTORY_DAYS,
  FESCO: 89 / HISTORY_DAYS,
  COMPAL: 45 / HISTORY_DAYS
};

function withHistory(s: Scenario): void {
  for (const name of Object.keys(HISTORY_AVG)) {
    const c = customer(s, name);
    c.dailyDeliveries = HISTORY_AVG[name];
    c.active = true;
  }
  customer(s, 'SILU').active = false;
  customer(s, 'HEINEKEN').active = false;
}

export interface Preset {
  code: string;
  name: string;
  description: string;
  build: () => Scenario;
}

function preset(code: string, name: string, description: string, change: (s: Scenario) => void): Preset {
  return {
    code,
    name,
    description,
    build: () => {
      const s = baseScenario();
      change(s);
      s.name = `${code} · ${name}`;
      return s;
    }
  };
}

export const PRESETS: Preset[] = [
  preset('A', 'Base (Excel)', 'LIMAK e Galileo desligados, 2 camiões.', () => undefined),
  preset('B', 'LIMAK ativa', 'Liga a LIMAK (+5 MATs/dia): os compressores quase saturam.', s => {
    customer(s, 'LIMAK').active = true;
  }),
  preset('C', 'LIMAK + Galileo', 'Com o Galileo o gargalo passa para os camiões.', s => {
    customer(s, 'LIMAK').active = true;
    compressor(s, 'Galileo').active = true;
  }),
  preset('D', 'Galileo ligado', 'Sem a LIMAK, o Galileo fica sub-utilizado.', s => {
    compressor(s, 'Galileo').active = true;
  }),
  preset('E', 'Um camião', 'Truck 2 indisponível: um só camião não chega.', s => {
    truck(s, 'Truck 2').available = false;
  }),
  preset('F', 'LIMAK + um camião', 'LIMAK ativa e só um camião.', s => {
    customer(s, 'LIMAK').active = true;
    truck(s, 'Truck 2').available = false;
  }),
  preset('G', 'Avaria do IMW', 'IMW parado e Galileo ligado: ponto único de falha.', s => {
    compressor(s, 'IMW').active = false;
    compressor(s, 'Galileo').active = true;
  }),
  preset('H', 'Avaria do IMW + LIMAK', 'IMW parado, Galileo ligado e LIMAK ativa: não aguenta.', s => {
    compressor(s, 'IMW').active = false;
    compressor(s, 'Galileo').active = true;
    customer(s, 'LIMAK').active = true;
  }),
  preset('I', 'Sem HEINEKEN', 'A viagem de 6 h do HEINEKEN pesa 13 das 26,75 h de camião.', s => {
    customer(s, 'HEINEKEN').active = false;
  }),
  preset('J', 'Histórico real', '5 clientes com a média de jan–abr 2026 (8,9 MATs/dia), sem SILU nem HEINEKEN.', s => {
    withHistory(s);
  }),
  preset('K', 'Histórico + novos', 'Cenário J mais SILU e HEINEKEN: o mais próximo da realidade esperada.', s => {
    withHistory(s);
    customer(s, 'SILU').active = true;
    customer(s, 'HEINEKEN').active = true;
  }),
  preset('L', 'LIMAK + 30%', 'LIMAK e Galileo ativos, procura × 1,3: faltam camiões.', s => {
    customer(s, 'LIMAK').active = true;
    compressor(s, 'Galileo').active = true;
    s.params.demandFactor = 130;
  }),
  preset('M', 'Expansão', 'LIMAK e Galileo ativos, 3 camiões, procura × 1,5.', s => {
    customer(s, 'LIMAK').active = true;
    compressor(s, 'Galileo').active = true;
    s.trucks.push(newTruck('Truck 3'));
    s.params.demandFactor = 150;
  })
];
