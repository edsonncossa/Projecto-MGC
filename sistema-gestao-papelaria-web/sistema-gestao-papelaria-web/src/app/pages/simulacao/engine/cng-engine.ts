/**
 * Motor de cálculo do simulador CNG — função pura, sem Angular.
 *
 * A versão 1 reproduz as fórmulas do Excel "CNG Simulation – Versão melhorada" (secção 3.1
 * da especificação). Diferenças deliberadas face ao Excel:
 *  - Procura sem capacidade (ex.: nenhum compressor ativo) dá utilização = Infinity e estado
 *    OFFLINE. O Excel usa IFERROR(...;0) e mostraria 0 %, o que esconde o problema.
 *  - Todos os clientes da lista entram nos cálculos (o Excel só lê as linhas 13 a 19 + 24).
 *  - Cada camião recebe horas em proporção às horas que tem disponíveis (o Excel divide por igual).
 */
import {
  Alert,
  AnalysisConfig,
  Compressor,
  Customer,
  CustomerLoad,
  GlobalParams,
  Inventory,
  Issue,
  PrpType,
  ResourceKind,
  ResourceLoad,
  Result,
  Scenario,
  Severity,
  Status,
  StressPoint,
  Thresholds,
  TripMode,
  Truck,
  Verdict
} from '../models/cng.models';
import { fmtNum, fmtPct, fmtSigned } from './cng-format';

export const EPS = 1e-9;
export const DEFAULT_THRESHOLDS: Thresholds = { underUsed: 0.4, high: 0.75, overload: 0.9 };

/** Alertas: margem de crescimento mínima e autonomia mínima (secção 5.3). */
export const MIN_GROWTH_MARGIN = 0.1;
export const MIN_AUTONOMY_DAYS = 1.5;
/** Cliente que concentra mais do que esta fração das horas de camião fica em destaque. */
export const HEAVY_CUSTOMER_SHARE = 0.4;

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

// ───────────── Utilitários ─────────────

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
const fin = (v: unknown): number => (typeof v === 'number' && isFinite(v) ? v : 0);
const PRP_TYPES: PrpType[] = ['R200', 'R500'];

/** used / capacity. Sem uso = 0. Uso sem capacidade = Infinity. */
export function utilization(used: number, capacity: number): number {
  if (used <= EPS) return 0;
  if (capacity <= EPS) return Infinity;
  return used / capacity;
}

/**
 * Estado de um recurso. Segue o Excel: as fronteiras usam ">" (exatamente 40 % ainda é
 * UNDER_USED) e há uma tolerância para erros de vírgula flutuante.
 */
export function statusOf(
  util: number,
  capacity: number,
  kind: ResourceKind,
  th: Thresholds = DEFAULT_THRESHOLDS
): Status {
  if (capacity <= EPS) return 'OFFLINE';
  if (util > 1 + EPS) return 'INSUFFICIENT';
  if (util > th.overload + EPS) return kind === 'compressors' ? 'OVERLOAD' : 'CRITICAL';
  if (util > th.high + EPS) return 'HIGH';
  if (util > th.underUsed + EPS) return 'OK';
  return 'UNDER_USED';
}

// ───────────── Procura e horas ─────────────

function globalFactor(s: Scenario): number {
  return fin(s.params.demandFactor) / 100;
}

/** MATs/dia médios de um cliente, depois do fator global, dos dias de operação e de um fator extra. */
function customerDemand(c: Customer, s: Scenario, extra = 1): number {
  if (!c.active) return 0;
  const days = Math.min(Math.max(fin(c.daysPerWeek), 0), 7);
  return Math.max(fin(c.dailyDeliveries), 0) * globalFactor(s) * (days / 7) * extra;
}

function cycleHours(c: Customer, p: GlobalParams): number {
  return fin(c.roundTripH) + fin(p.loadTimeH) + fin(p.swapTimeH);
}

function tripsFor(deliveries: number, truckCapacity: number, mode: TripMode): number {
  if (deliveries <= EPS || truckCapacity <= 0) return 0;
  const trips = deliveries / truckCapacity;
  return mode === 'whole' ? Math.ceil(trips - EPS) : trips;
}

export function demandAt(s: Scenario, extra = 1): number {
  return sum(s.customers.map(c => customerDemand(c, s, extra)));
}

export function truckHoursAt(s: Scenario, extra = 1): number {
  const k = fin(s.params.truckCapacity);
  return sum(
    s.customers.map(c => tripsFor(customerDemand(c, s, extra), k, s.analysis.tripMode) * cycleHours(c, s.params))
  );
}

export function compressorCapacity(c: Compressor, p: GlobalParams): number {
  if (!c.active) return 0;
  const cycle = fin(c.compressionTimeH) + fin(c.oilDrainH);
  if (cycle <= EPS) return 0;
  return (2 / cycle) * Math.max(fin(p.hoursPerDay) - fin(c.lostHours), 0);
}

export function truckEffectiveHours(t: Truck): number {
  return t.available ? Math.max(fin(t.shiftHours) - fin(t.lostHours), 0) : 0;
}

// ───────────── Margem de crescimento ─────────────

/** f* dos camiões: fator de procura em que as horas necessárias igualam as disponíveis. */
function truckLimitFactor(s: Scenario, totalEff: number): number {
  const hours = truckHoursAt(s);
  if (hours <= EPS) return Infinity;
  if (s.analysis.tripMode === 'fractional') return totalEff / hours;

  // Viagens inteiras: as horas crescem em degraus, por isso não há fórmula fechada.
  const fits = (f: number): boolean => truckHoursAt(s, f) <= totalEff + EPS;
  const HI = 100;
  if (fits(HI)) return HI;
  let lo = 0;
  let hi = HI;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

// ───────────── Teste de esforço ─────────────

function buildStress(s: Scenario, totalCap: number, totalEff: number): StressPoint[] {
  const a: AnalysisConfig = s.analysis;
  const step = fin(a.stressStep) > 0 ? fin(a.stressStep) : 10;
  const max = Math.max(fin(a.stressMax), 0);
  const points: StressPoint[] = [];
  for (let i = 0; i * step <= max + EPS && points.length < 400; i++) {
    const increase = (i * step) / 100;
    const factor = 1 + increase;
    const demand = demandAt(s, factor);
    const compressorUtil = utilization(demand, totalCap);
    const truckUtil = utilization(truckHoursAt(s, factor), totalEff);
    points.push({
      increase,
      demand,
      compressorUtil,
      truckUtil,
      viable: compressorUtil <= 1 + EPS && truckUtil <= 1 + EPS
    });
  }
  return points;
}

// ───────────── Validação (secção 2.6) ─────────────

export function validate(s: Scenario): Issue[] {
  const issues: Issue[] = [];
  const p = s.params;
  const active = s.customers.map((c, i) => ({ c, i })).filter(x => x.c.active);

  const mats = sum(active.map(x => fin(x.c.matsInstalled)));
  if (mats > fin(p.totalMats) + EPS) {
    issues.push({
      level: 'error',
      path: 'params.totalMats',
      message: `Os clientes ativos têm ${fmtNum(mats, 0)} MATs instalados, mais do que o total do sistema (${fmtNum(p.totalMats, 0)}).`
    });
  }

  const pads = sum(active.map(x => fin(x.c.pads)));
  if (pads > fin(p.totalPads) + EPS) {
    issues.push({
      level: 'error',
      path: 'params.totalPads',
      message: `Os clientes ativos usam ${fmtNum(pads, 0)} PADs, mais do que o total do sistema (${fmtNum(p.totalPads, 0)}).`
    });
  }

  for (const type of PRP_TYPES) {
    const used = active.filter(x => x.c.prpType === type).length;
    if (used > fin(p.totalPrp[type]) + EPS) {
      issues.push({
        level: 'error',
        path: `params.totalPrp${type}`,
        message: `Os clientes ativos usam ${used} PRP ${type}, mais do que o total disponível (${fmtNum(p.totalPrp[type], 0)}).`
      });
    }
  }

  const seen = new Set<string>();
  s.customers.forEach((c, i) => {
    const key = c.name.trim().toLowerCase();
    if (!key) return;
    if (seen.has(key)) {
      issues.push({ level: 'error', path: `customers.${i}.name`, message: 'Já existe um cliente com este nome.' });
    }
    seen.add(key);

    const peak = Math.max(fin(c.dailyDeliveries), 0) * globalFactor(s);
    if (c.active && peak > fin(c.matsInstalled) + EPS) {
      issues.push({
        level: 'warn',
        path: `customers.${i}.dailyDeliveries`,
        message: 'Entregas por dia acima dos MATs instalados: o cliente consome mais do que tem em stock.'
      });
    }
  });

  s.compressors.forEach((c, i) => {
    if (c.active && fin(c.lostHours) >= fin(p.hoursPerDay)) {
      issues.push({
        level: 'warn',
        path: `compressors.${i}.lostHours`,
        message: 'Horas perdidas iguais ou acima das horas de operação: a capacidade fica nula.'
      });
    }
  });

  s.trucks.forEach((t, i) => {
    if (t.available && fin(t.lostHours) >= fin(t.shiftHours)) {
      issues.push({
        level: 'warn',
        path: `trucks.${i}.lostHours`,
        message: 'Horas perdidas iguais ou acima do turno: o camião fica sem horas úteis.'
      });
    }
  });

  if (!active.length) issues.push({ level: 'warn', path: 'customers', message: 'Sem clientes ativos: a procura é zero.' });
  if (!s.compressors.some(c => c.active)) issues.push({ level: 'warn', path: 'compressors', message: 'Sem compressores ativos.' });
  if (!s.trucks.some(t => t.available)) issues.push({ level: 'warn', path: 'trucks', message: 'Sem camiões disponíveis.' });

  return issues;
}

// ───────────── Alertas (secção 5.3) ─────────────

interface AlertContext {
  s: Scenario;
  demand: number;
  caps: number[];
  effs: number[];
  totalCap: number;
  totalEff: number;
  truckHours: number;
  compUtil: number;
  truckUtil: number;
  growth: { compressors: number; trucks: number };
  perCustomer: CustomerLoad[];
  inventory: Inventory;
}

function buildAlerts(x: AlertContext): Alert[] {
  const out: Alert[] = [];
  const th = x.s.analysis.thresholds;
  const push = (id: string, severity: Severity, title: string, detail: string): void => {
    out.push({ id, severity, title, detail });
  };

  // 1. Operação inviável
  if (x.demand > EPS && (x.totalCap <= EPS || x.compUtil > 1 + EPS)) {
    push(
      'infeasible-compressors',
      'critical',
      'Operação inviável: compressores',
      x.totalCap <= EPS
        ? 'Não há nenhum compressor ativo para satisfazer a procura.'
        : `Faltam ${fmtNum(x.demand - x.totalCap)} MATs/dia de capacidade (utilização ${fmtPct(x.compUtil)}).`
    );
  }
  if (x.truckHours > EPS && (x.totalEff <= EPS || x.truckUtil > 1 + EPS)) {
    push(
      'infeasible-trucks',
      'critical',
      'Operação inviável: camiões',
      x.totalEff <= EPS
        ? 'Não há nenhum camião com horas úteis para fazer as entregas.'
        : `Faltam ${fmtNum(x.truckHours - x.totalEff, 2)} h/dia de camião (utilização ${fmtPct(x.truckUtil)}).`
    );
  }

  // 2. Sem margem de crescimento
  if (x.demand > EPS && x.compUtil <= 1 + EPS && x.growth.compressors < MIN_GROWTH_MARGIN) {
    push(
      'no-margin-compressors',
      'high',
      'Compressores sem margem',
      `A procura só pode crescer ${fmtSigned(x.growth.compressors)} até saturar os compressores.`
    );
  }
  if (x.truckHours > EPS && x.truckUtil <= 1 + EPS && x.growth.trucks < MIN_GROWTH_MARGIN) {
    push(
      'no-margin-trucks',
      'high',
      'Camiões sem margem',
      `A procura só pode crescer ${fmtSigned(x.growth.trucks)} até saturar os camiões.`
    );
  }

  // 3. Posto-mãe sem folga
  const inv = x.inventory;
  const reasons: string[] = [];
  if (inv.matsFree <= 1) reasons.push(inv.matsFree === 1 ? '1 MAT livre' : `${fmtNum(inv.matsFree, 0)} MATs livres`);
  for (const type of PRP_TYPES) {
    if (inv.prpFree[type] <= 0) reasons.push(`sem PRP ${type} livre`);
  }
  if (reasons.length) push('mother-station', 'high', 'Posto-mãe sem folga', reasons.join('; ') + '.');

  // 4. Entregas acima do stock
  const overStock = x.s.customers.filter(
    c => c.active && Math.max(fin(c.dailyDeliveries), 0) * globalFactor(x.s) > fin(c.matsInstalled) + EPS
  );
  if (overStock.length) {
    push(
      'over-stock',
      'high',
      'Entregas acima do stock',
      overStock
        .map(c => `${c.name}: ${fmtNum(c.dailyDeliveries * globalFactor(x.s))} MATs/dia para ${fmtNum(c.matsInstalled, 0)} instalados`)
        .join(' · ')
    );
  }

  // 5. Ponto único de falha
  const activeCaps = x.caps.filter(c => c > EPS);
  if (activeCaps.length === 1) {
    const name = x.s.compressors[x.caps.findIndex(c => c > EPS)].name;
    push('spof-compressor', 'medium', 'Ponto único de falha nos compressores', `Só o ${name} está ativo.`);
  }

  // 6. Teste N−1 dos camiões
  const activeEffs = x.effs.filter(e => e > EPS);
  if (x.truckHours > EPS && x.truckUtil <= 1 + EPS && activeEffs.length >= 1) {
    const remaining = x.totalEff - Math.max(...activeEffs);
    const u = utilization(x.truckHours, remaining);
    if (u > 1 + EPS) {
      push(
        'n1-trucks',
        'medium',
        'Sem reserva de camiões (teste N−1)',
        remaining <= EPS
          ? 'Há um único camião ativo: se parar, não há entregas.'
          : `Se um camião parar, a utilização sobe para ${fmtPct(u)}.`
      );
    }
  }

  // 7. Teste N−1 dos compressores
  if (x.demand > EPS && x.compUtil <= 1 + EPS && activeCaps.length >= 2) {
    const remaining = x.totalCap - Math.max(...activeCaps);
    if (x.demand > remaining + EPS) {
      push(
        'n1-compressors',
        'medium',
        'Sem reserva de compressores (teste N−1)',
        `Sem o maior compressor, a utilização seria ${fmtPct(utilization(x.demand, remaining))}.`
      );
    }
  }

  // 8. Autonomia curta
  const short = x.perCustomer.filter(c => c.active && c.autonomyDays !== null && c.autonomyDays < MIN_AUTONOMY_DAYS - EPS);
  if (short.length) {
    push(
      'short-autonomy',
      'medium',
      'Autonomia curta nos clientes',
      short.map(c => `${c.name}: ${fmtNum(c.autonomyDays as number)} dias`).join(' · ') + ` (mínimo ${fmtNum(MIN_AUTONOMY_DAYS)} dias).`
    );
  }

  // 9. Capacidade ociosa
  if (x.totalCap > EPS && x.compUtil < th.underUsed - EPS) {
    push('idle-compressors', 'low', 'Capacidade ociosa nos compressores', `Utilização de apenas ${fmtPct(x.compUtil)}.`);
  }
  if (x.totalEff > EPS && x.truckUtil < th.underUsed - EPS) {
    push('idle-trucks', 'low', 'Capacidade ociosa nos camiões', `Utilização de apenas ${fmtPct(x.truckUtil)}.`);
  }

  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ───────────── Simulação ─────────────

export function simulate(s: Scenario): Result {
  const p = s.params;
  const th = s.analysis.thresholds;
  const demand = demandAt(s);

  // Compressores: a procura reparte-se em proporção à capacidade, logo todos têm a mesma utilização.
  const caps = s.compressors.map(c => compressorCapacity(c, p));
  const totalCap = sum(caps);
  const compUtil = utilization(demand, totalCap);
  const compressors: ResourceLoad[] = s.compressors.map((c, i) => {
    const used = totalCap > EPS ? (demand * caps[i]) / totalCap : 0;
    const util = caps[i] > EPS ? used / caps[i] : 0;
    return { id: c.id, name: c.name, active: c.active, capacity: caps[i], used, util, status: statusOf(util, caps[i], 'compressors', th) };
  });

  // Camiões: as horas repartem-se em proporção às horas úteis de cada um.
  const effs = s.trucks.map(truckEffectiveHours);
  const totalEff = sum(effs);
  const truckHours = truckHoursAt(s);
  const truckUtil = utilization(truckHours, totalEff);
  const trucks: ResourceLoad[] = s.trucks.map((t, i) => {
    const used = totalEff > EPS ? (truckHours * effs[i]) / totalEff : 0;
    const util = effs[i] > EPS ? used / effs[i] : 0;
    return { id: t.id, name: t.name, active: t.available, capacity: effs[i], used, util, status: statusOf(util, effs[i], 'trucks', th) };
  });

  // Sistema e gargalo
  const systemUtil = Math.max(compUtil, truckUtil);
  const bottleneck: ResourceKind | null = systemUtil > EPS ? (truckUtil > compUtil ? 'trucks' : 'compressors') : null;
  const compressorStatus = statusOf(compUtil, totalCap, 'compressors', th);
  const truckStatus = statusOf(truckUtil, totalEff, 'trucks', th);
  const operable = totalCap > EPS && totalEff > EPS;
  const systemStatus: Status = !operable
    ? 'OFFLINE'
    : statusOf(systemUtil, 1, bottleneck ?? 'compressors', th);

  const verdict: Verdict =
    (!operable && demand > EPS) || systemUtil > 1 + EPS
      ? 'UNVIABLE'
      : systemUtil > th.overload + EPS
        ? 'AT_LIMIT'
        : 'VIABLE';

  const coverage = demand <= EPS ? 1 : isFinite(systemUtil) ? Math.min(1, 1 / systemUtil) : 0;

  // Margem de crescimento (f* − 1)
  const fTruck = truckLimitFactor(s, totalEff);
  const growth = {
    compressors: demand <= EPS ? Infinity : totalCap / demand - 1,
    trucks: isFinite(fTruck) ? fTruck - 1 : Infinity
  };

  // Carga por cliente
  const k = fin(p.truckCapacity);
  const perCustomer: CustomerLoad[] = s.customers.map(c => {
    const deliveries = customerDemand(c, s);
    const trips = tripsFor(deliveries, k, s.analysis.tripMode);
    const cycleH = cycleHours(c, p);
    const hours = trips * cycleH;
    const peak = Math.max(fin(c.dailyDeliveries), 0) * globalFactor(s);
    return {
      id: c.id,
      name: c.name,
      active: c.active,
      cycleH,
      deliveries,
      tripsPerDay: trips,
      truckHours: hours,
      share: truckHours > EPS ? hours / truckHours : 0,
      autonomyDays: c.active && peak > EPS ? fin(c.matsInstalled) / peak : null
    };
  });

  // Inventário do posto-mãe (os MATs de clientes inativos ficam no posto-mãe)
  const act = s.customers.filter(c => c.active);
  const matsAtCustomers = sum(act.map(c => fin(c.matsInstalled)));
  const padsAtCustomers = sum(act.map(c => fin(c.pads)));
  const prpUsed: Record<PrpType, number> = {
    R200: act.filter(c => c.prpType === 'R200').length,
    R500: act.filter(c => c.prpType === 'R500').length
  };
  const inventory: Inventory = {
    matsFree: fin(p.totalMats) - matsAtCustomers,
    matsAtCustomers,
    padsFree: fin(p.totalPads) - padsAtCustomers,
    padsAtCustomers,
    prpFree: { R200: fin(p.totalPrp.R200) - prpUsed.R200, R500: fin(p.totalPrp.R500) - prpUsed.R500 },
    prpUsed
  };

  return {
    demand,
    compressorCap: totalCap,
    compressorUtil: compUtil,
    truckHoursNeeded: truckHours,
    truckHoursAvailable: totalEff,
    truckUtil,
    systemUtil,
    bottleneck,
    coverage,
    verdict,
    compressorStatus,
    truckStatus,
    systemStatus,
    compressors,
    trucks,
    spare: { compressorMats: totalCap - demand, truckHours: totalEff - truckHours },
    growthMargin: growth,
    perCustomer,
    inventory,
    stress: buildStress(s, totalCap, totalEff),
    alerts: buildAlerts({ s, demand, caps, effs, totalCap, totalEff, truckHours, compUtil, truckUtil, growth, perCustomer, inventory }),
    issues: validate(s)
  };
}
