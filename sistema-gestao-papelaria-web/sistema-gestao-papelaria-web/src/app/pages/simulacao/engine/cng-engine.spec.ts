import { Scenario, Status } from '../models/cng.models';
import { simulate, statusOf, validate, utilization } from './cng-engine';
import { baseScenario, PRESETS } from './cng-presets';

/** Tolerância de 0,1 pontos percentuais da especificação (secção 8.1). */
const PP = 0.001;
const near = (actual: number, expected: number, tol = PP): boolean => Math.abs(actual - expected) <= tol;

interface Row {
  code: string;
  demand: number;
  cap: number;
  compUtil: number;
  hours: number;
  avail: number;
  truckUtil: number;
  bottleneck: 'compressors' | 'trucks';
  compStatus: Status;
  truckStatus: Status;
}

/** Tabela da secção 4 da especificação. */
const TABLE: Row[] = [
  { code: 'A', demand: 14.0, cap: 19.56, compUtil: 0.716, hours: 26.75, avail: 42, truckUtil: 0.637, bottleneck: 'compressors', compStatus: 'OK', truckStatus: 'OK' },
  { code: 'B', demand: 19.0, cap: 19.56, compUtil: 0.972, hours: 33.0, avail: 42, truckUtil: 0.786, bottleneck: 'compressors', compStatus: 'OVERLOAD', truckStatus: 'HIGH' },
  { code: 'C', demand: 19.0, cap: 35.56, compUtil: 0.534, hours: 33.0, avail: 42, truckUtil: 0.786, bottleneck: 'trucks', compStatus: 'OK', truckStatus: 'HIGH' },
  { code: 'D', demand: 14.0, cap: 35.56, compUtil: 0.394, hours: 26.75, avail: 42, truckUtil: 0.637, bottleneck: 'trucks', compStatus: 'UNDER_USED', truckStatus: 'OK' },
  { code: 'E', demand: 14.0, cap: 19.56, compUtil: 0.716, hours: 26.75, avail: 21, truckUtil: 1.274, bottleneck: 'trucks', compStatus: 'OK', truckStatus: 'INSUFFICIENT' },
  { code: 'F', demand: 19.0, cap: 19.56, compUtil: 0.972, hours: 33.0, avail: 21, truckUtil: 1.571, bottleneck: 'trucks', compStatus: 'OVERLOAD', truckStatus: 'INSUFFICIENT' },
  { code: 'G', demand: 14.0, cap: 16.0, compUtil: 0.875, hours: 26.75, avail: 42, truckUtil: 0.637, bottleneck: 'compressors', compStatus: 'HIGH', truckStatus: 'OK' },
  { code: 'H', demand: 19.0, cap: 16.0, compUtil: 1.188, hours: 33.0, avail: 42, truckUtil: 0.786, bottleneck: 'compressors', compStatus: 'INSUFFICIENT', truckStatus: 'HIGH' },
  { code: 'I', demand: 10.0, cap: 19.56, compUtil: 0.511, hours: 13.75, avail: 42, truckUtil: 0.327, bottleneck: 'compressors', compStatus: 'OK', truckStatus: 'UNDER_USED' },
  { code: 'J', demand: 8.9, cap: 19.56, compUtil: 0.456, hours: 11.4, avail: 42, truckUtil: 0.272, bottleneck: 'compressors', compStatus: 'OK', truckStatus: 'UNDER_USED' },
  { code: 'K', demand: 16.9, cap: 19.56, compUtil: 0.865, hours: 30.4, avail: 42, truckUtil: 0.724, bottleneck: 'compressors', compStatus: 'HIGH', truckStatus: 'OK' },
  { code: 'L', demand: 24.7, cap: 35.56, compUtil: 0.695, hours: 42.9, avail: 42, truckUtil: 1.021, bottleneck: 'trucks', compStatus: 'OK', truckStatus: 'INSUFFICIENT' },
  { code: 'M', demand: 28.5, cap: 35.56, compUtil: 0.802, hours: 49.5, avail: 63, truckUtil: 0.786, bottleneck: 'compressors', compStatus: 'HIGH', truckStatus: 'HIGH' }
];

function scenario(code: string): Scenario {
  const p = PRESETS.find(x => x.code === code);
  if (!p) throw new Error('preset em falta: ' + code);
  return p.build();
}

describe('CngEngine — os 13 cenários da especificação', () => {
  for (const row of TABLE) {
    it(`cenário ${row.code}`, () => {
      const r = simulate(scenario(row.code));
      expect(near(r.demand, row.demand, 0.06)).toBe(true);
      expect(near(r.compressorCap, row.cap, 0.01)).toBe(true);
      expect(near(r.compressorUtil, row.compUtil)).toBe(true);
      expect(near(r.truckHoursNeeded, row.hours, 0.06)).toBe(true);
      expect(near(r.truckHoursAvailable, row.avail, 0.001)).toBe(true);
      expect(near(r.truckUtil, row.truckUtil)).toBe(true);
      expect(r.bottleneck).toBe(row.bottleneck);
      expect(r.compressorStatus).toBe(row.compStatus);
      expect(r.truckStatus).toBe(row.truckStatus);
    });
  }

  it('o cenário A reproduz o Excel sem diferenças', () => {
    const r = simulate(baseScenario());
    expect(r.demand).toBeCloseTo(14, 9);
    expect(r.compressorUtil).toBeCloseTo(0.7159090909, 9);
    expect(r.truckHoursNeeded).toBeCloseTo(26.75, 9);
    expect(r.truckUtil).toBeCloseTo(0.6369047619, 9);
    expect(r.inventory.matsFree).toBe(7);
    expect(r.inventory.padsFree).toBe(11);
    expect(r.inventory.prpFree.R200).toBe(1);
    expect(r.inventory.prpFree.R500).toBe(0);
  });
});

describe('CngEngine — margem de crescimento (secção 4.2)', () => {
  const margin = (code: string) => simulate(scenario(code)).growthMargin;

  it('A: +39,7 % nos compressores e +57,0 % nos camiões', () => {
    expect(near(margin('A').compressors, 0.397, 0.0005)).toBe(true);
    expect(near(margin('A').trucks, 0.57, 0.0005)).toBe(true);
  });
  it('B: +2,9 % e +27,3 %', () => {
    expect(near(margin('B').compressors, 0.029, 0.0005)).toBe(true);
    expect(near(margin('B').trucks, 0.273, 0.0005)).toBe(true);
  });
  it('C: +87,1 % e +27,3 %', () => {
    expect(near(margin('C').compressors, 0.871, 0.0005)).toBe(true);
    expect(near(margin('C').trucks, 0.273, 0.0005)).toBe(true);
  });
  it('é negativa quando a operação já não aguenta', () => {
    expect(margin('E').trucks).toBeLessThan(0);
    expect(margin('H').compressors).toBeLessThan(0);
  });
});

describe('CngEngine — teste de esforço', () => {
  it('o cenário A cruza os 100 % dos compressores em +40 % e dos camiões em +57 %', () => {
    const stress = simulate(baseScenario()).stress;
    expect(stress.length).toBe(13);                       // 0 %, 10 %, ... 120 %
    const at = (inc: number) => stress.find(p => Math.abs(p.increase - inc) < 1e-9)!;
    expect(at(0.3).compressorUtil).toBeLessThan(1);
    expect(at(0.4).compressorUtil).toBeGreaterThan(1);
    expect(at(0.5).truckUtil).toBeLessThan(1);
    expect(at(0.6).truckUtil).toBeGreaterThan(1);
    expect(at(0.3).viable).toBe(true);
    expect(at(0.4).viable).toBe(false);
  });

  it('respeita o passo e o intervalo configurados', () => {
    const s = baseScenario();
    s.analysis.stressStep = 25;
    s.analysis.stressMax = 100;
    expect(simulate(s).stress.map(p => p.increase)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });
});

describe('CngEngine — modo viagens inteiras (secção 4.3)', () => {
  const whole = (code: string) => {
    const s = scenario(code);
    s.analysis.tripMode = 'whole';
    return simulate(s);
  };
  it('A sobe de 63,7 % para 67,9 % (28,5 h)', () => {
    const r = whole('A');
    expect(near(r.truckHoursNeeded, 28.5, 1e-9)).toBe(true);
    expect(near(r.truckUtil, 0.679)).toBe(true);
  });
  it('B e C sobem de 78,6 % para 85,7 %', () => {
    expect(near(whole('B').truckUtil, 0.857)).toBe(true);
    expect(near(whole('C').truckUtil, 0.857)).toBe(true);
  });
  it('J sobe de 27,2 % para 40,5 %', () => {
    expect(near(whole('J').truckUtil, 0.405)).toBe(true);
  });
  it('a margem dos camiões continua coerente com a procura que enche o turno', () => {
    const s = scenario('A');
    s.analysis.tripMode = 'whole';
    const f = 1 + simulate(s).growthMargin.trucks;
    const scaled = scenario('A');
    scaled.analysis.tripMode = 'whole';
    scaled.params.demandFactor = 100 * f * 0.999;
    expect(simulate(scaled).truckUtil).toBeLessThanOrEqual(1.0000001);
  });
});

describe('CngEngine — estados e fronteiras (secção 5.1)', () => {
  it('compressores: 40 %, 75 %, 90 % e 100 %', () => {
    expect(statusOf(0.4, 10, 'compressors')).toBe('UNDER_USED');
    expect(statusOf(0.4001, 10, 'compressors')).toBe('OK');
    expect(statusOf(0.75, 10, 'compressors')).toBe('OK');
    expect(statusOf(0.7501, 10, 'compressors')).toBe('HIGH');
    expect(statusOf(0.9, 10, 'compressors')).toBe('HIGH');
    expect(statusOf(0.9001, 10, 'compressors')).toBe('OVERLOAD');
    expect(statusOf(1, 10, 'compressors')).toBe('OVERLOAD');
    expect(statusOf(1.0001, 10, 'compressors')).toBe('INSUFFICIENT');
  });
  it('camiões: a faixa 90–100 % chama-se CRITICAL', () => {
    expect(statusOf(0.95, 10, 'trucks')).toBe('CRITICAL');
    expect(statusOf(1.2, 10, 'trucks')).toBe('INSUFFICIENT');
  });
  it('capacidade zero é OFFLINE', () => {
    expect(statusOf(0, 0, 'compressors')).toBe('OFFLINE');
    expect(statusOf(Infinity, 0, 'trucks')).toBe('OFFLINE');
  });
  it('tolera erros de vírgula flutuante (0,1 + 0,2 + 0,45 = 0,75)', () => {
    expect(statusOf(0.1 + 0.2 + 0.45, 10, 'compressors')).toBe('OK');
  });
  it('respeita limiares personalizados', () => {
    const th = { underUsed: 0.2, high: 0.5, overload: 0.8 };
    expect(statusOf(0.55, 10, 'compressors', th)).toBe('HIGH');
    expect(statusOf(0.85, 10, 'compressors', th)).toBe('OVERLOAD');
  });
});

describe('CngEngine — casos-limite', () => {
  it('sem compressores ativos: OFFLINE e inviável', () => {
    const s = baseScenario();
    s.compressors.forEach(c => (c.active = false));
    const r = simulate(s);
    expect(r.compressorStatus).toBe('OFFLINE');
    expect(r.compressorUtil).toBe(Infinity);
    expect(r.verdict).toBe('UNVIABLE');
    expect(r.coverage).toBe(0);
    expect(r.alerts.some(a => a.id === 'infeasible-compressors')).toBe(true);
  });

  it('sem camiões: OFFLINE e inviável', () => {
    const s = baseScenario();
    s.trucks.forEach(t => (t.available = false));
    const r = simulate(s);
    expect(r.truckStatus).toBe('OFFLINE');
    expect(r.verdict).toBe('UNVIABLE');
    expect(r.truckHoursAvailable).toBe(0);
  });

  it('procura zero: tudo a 0 % e viável', () => {
    const s = baseScenario();
    s.customers.forEach(c => (c.active = false));
    const r = simulate(s);
    expect(r.demand).toBe(0);
    expect(r.compressorUtil).toBe(0);
    expect(r.truckUtil).toBe(0);
    expect(r.bottleneck).toBeNull();
    expect(r.verdict).toBe('VIABLE');
    expect(r.coverage).toBe(1);
    expect(r.growthMargin.compressors).toBe(Infinity);
  });

  it('cliente sem entregas não gera viagens', () => {
    const s = baseScenario();
    s.customers[0].dailyDeliveries = 0;
    const r = simulate(s);
    expect(r.perCustomer[0].tripsPerDay).toBe(0);
    expect(r.perCustomer[0].truckHours).toBe(0);
  });

  it('horas perdidas maiores que o turno não dão capacidade negativa', () => {
    const s = baseScenario();
    s.compressors[1].lostHours = 30;
    s.trucks[0].lostHours = 30;
    const r = simulate(s);
    expect(r.compressorCap).toBe(0);
    expect(r.trucks[0].capacity).toBe(0);
    expect(r.truckHoursAvailable).toBe(21);
  });

  it('o fator de procura global multiplica todas as entregas', () => {
    const s = baseScenario();
    s.params.demandFactor = 150;
    expect(simulate(s).demand).toBeCloseTo(21, 9);
  });

  it('dias de operação por semana reduzem a procura média', () => {
    const s = baseScenario();
    s.customers[0].daysPerWeek = 5;            // SILU: 4 × 5/7
    expect(simulate(s).demand).toBeCloseTo(14 - 4 + (4 * 5) / 7, 9);
  });

  it('com dois camiões de turnos diferentes, ambos ficam com a mesma utilização', () => {
    const s = baseScenario();
    s.trucks[1].shiftHours = 12;               // 9 h úteis contra 21 h
    const r = simulate(s);
    expect(r.trucks[0].util).toBeCloseTo(r.trucks[1].util, 9);
    expect(r.trucks[0].used + r.trucks[1].used).toBeCloseTo(26.75, 9);
  });

  it('utilization() devolve Infinity quando há procura sem capacidade', () => {
    expect(utilization(5, 0)).toBe(Infinity);
    expect(utilization(0, 0)).toBe(0);
  });
});

describe('CngEngine — validações (secção 2.6)', () => {
  const paths = (s: Scenario, level?: 'error' | 'warn') =>
    validate(s).filter(i => !level || i.level === level).map(i => i.path);

  it('o cenário base não tem erros', () => {
    expect(paths(baseScenario(), 'error')).toEqual([]);
  });
  it('MATs dos clientes acima do total', () => {
    const s = baseScenario();
    s.params.totalMats = 20;
    expect(paths(s, 'error')).toContain('params.totalMats');
  });
  it('PADs acima do total', () => {
    const s = baseScenario();
    s.params.totalPads = 10;
    expect(paths(s, 'error')).toContain('params.totalPads');
  });
  it('PRP por tipo acima do total', () => {
    const s = baseScenario();
    s.params.totalPrp.R500 = 2;
    expect(paths(s, 'error')).toContain('params.totalPrpR500');
  });
  it('clientes inativos não contam para os totais', () => {
    const s = baseScenario();                  // LIMAK (6 MATs) está inativa
    s.params.totalMats = 21;
    expect(paths(s, 'error')).toEqual([]);
  });
  it('nomes de clientes repetidos', () => {
    const s = baseScenario();
    s.customers[1].name = 'silu';
    expect(paths(s, 'error')).toContain('customers.1.name');
  });
  it('entregas acima do stock são aviso, não erro', () => {
    const s = baseScenario();
    s.customers[0].dailyDeliveries = 9;
    expect(paths(s, 'warn')).toContain('customers.0.dailyDeliveries');
    expect(paths(s, 'error')).toEqual([]);
  });
});

describe('CngEngine — alertas (secção 5.3)', () => {
  const ids = (code: string) => simulate(scenario(code)).alerts.map(a => a.id);

  it('A: ponto único de falha e N−1 dos camiões a 127,4 %', () => {
    const r = simulate(scenario('A'));
    expect(ids('A')).toContain('spof-compressor');
    const n1 = r.alerts.find(a => a.id === 'n1-trucks')!;
    expect(n1.detail).toContain('127,4%');
  });
  it('B: sem margem, posto-mãe sem folga e N−1 dos camiões a 157,1 %', () => {
    const r = simulate(scenario('B'));
    expect(ids('B')).toContain('no-margin-compressors');
    expect(ids('B')).toContain('mother-station');
    expect(r.alerts.find(a => a.id === 'n1-trucks')!.detail).toContain('157,1%');
  });
  it('D: capacidade ociosa nos compressores', () => {
    expect(ids('D')).toContain('idle-compressors');
  });
  it('E: inviável, faltam 5,75 h/dia', () => {
    const a = simulate(scenario('E')).alerts.find(x => x.id === 'infeasible-trucks')!;
    expect(a.severity).toBe('critical');
    expect(a.detail).toContain('5,75');
  });
  it('F: faltam 12 h/dia', () => {
    const a = simulate(scenario('F')).alerts.find(x => x.id === 'infeasible-trucks')!;
    expect(a.detail).toContain('12,00');
  });
  it('H: défice de 3 MATs/dia nos compressores', () => {
    const a = simulate(scenario('H')).alerts.find(x => x.id === 'infeasible-compressors')!;
    expect(a.detail).toContain('3,0');
  });
  it('I: capacidade ociosa nos camiões', () => {
    expect(ids('I')).toContain('idle-trucks');
  });
  it('K: autonomia curta em SILU e LIMAK', () => {
    const a = simulate(scenario('K')).alerts.find(x => x.id === 'short-autonomy')!;
    expect(a.detail).toContain('SILU');
    expect(a.detail).toContain('LIMAK');
  });
  it('M: nenhum ponto único de falha', () => {
    expect(ids('M')).not.toContain('spof-compressor');
  });
  it('os alertas vêm ordenados por gravidade', () => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    const alerts = simulate(scenario('F')).alerts;
    for (let i = 1; i < alerts.length; i++) {
      expect(order[alerts[i - 1].severity]).toBeLessThanOrEqual(order[alerts[i].severity]);
    }
  });
});

describe('CngEngine — veredito e cobertura', () => {
  it('A é viável, B está no limite, E é inviável', () => {
    expect(simulate(scenario('A')).verdict).toBe('VIABLE');
    expect(simulate(scenario('B')).verdict).toBe('AT_LIMIT');
    expect(simulate(scenario('E')).verdict).toBe('UNVIABLE');
  });
  it('a cobertura é 100 % quando aguenta e 1/utilização quando não aguenta', () => {
    expect(simulate(scenario('A')).coverage).toBe(1);
    expect(simulate(scenario('E')).coverage).toBeCloseTo(1 / 1.27381, 4);
  });
});

describe('CngEngine — carga por cliente', () => {
  it('HEINEKEN concentra 48,6 % das horas de camião no cenário A', () => {
    const r = simulate(scenario('A'));
    const h = r.perCustomer.find(c => c.name === 'HEINEKEN')!;
    expect(h.truckHours).toBe(13);
    expect(near(h.share, 0.486, 0.0005)).toBe(true);
  });
  it('autonomia = MATs instalados / entregas por dia', () => {
    const r = simulate(scenario('A'));
    expect(r.perCustomer.find(c => c.name === 'SILU')!.autonomyDays).toBe(1);
    expect(r.perCustomer.find(c => c.name === 'LIMAK')!.autonomyDays).toBeNull();   // inativa
  });
});
