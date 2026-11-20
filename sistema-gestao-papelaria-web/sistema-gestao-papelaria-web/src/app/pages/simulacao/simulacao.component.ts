import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { Compressor, Customer, Issue, ResourceKind, ResourceLoad, Result, Scenario, Truck } from './models/cng.models';
import { HEAVY_CUSTOMER_SHARE, MIN_AUTONOMY_DAYS, simulate } from './engine/cng-engine';
import { SEVERITY_LABEL, STATUS_LABEL, VERDICT_LABEL, fmtNum, fmtPct, fmtSigned } from './engine/cng-format';
import { PRESETS, baseScenario, newCompressor, newCustomer, newTruck } from './engine/cng-presets';

type Tab = 'geral' | 'clientes' | 'compressores' | 'camioes' | 'analise';
type KpiKey = 'comp' | 'truck' | 'system' | 'coverage';

interface ChartModel {
  w: number;
  h: number;
  plotL: number;
  plotR: number;
  plotT: number;
  plotB: number;
  y100: number;
  xTicks: { x: number; label: string }[];
  yTicks: { y: number; label: string }[];
  comp: string;
  truck: string;
  markers: { kind: ResourceKind; x: number; label: string }[];
}

const integer: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  const v = c.value;
  return v === null || v === '' || Number.isInteger(Number(v)) ? null : { integer: true };
};

/** Limiares por ordem crescente e intervalo do teste de esforço coerente. */
const analysisValidator: ValidatorFn = (g: AbstractControl): ValidationErrors | null => {
  const n = (k: string): number => Number(g.get(k)?.value);
  const errors: ValidationErrors = {};
  if (!(n('underUsed') < n('high') && n('high') < n('overload') && n('overload') < 100)) errors['thresholdOrder'] = true;
  if (n('stressMax') < n('stressStep')) errors['stressRange'] = true;
  return Object.keys(errors).length ? errors : null;
};

@Component({
  selector: 'app-simulacao',
  templateUrl: './simulacao.component.html',
  styleUrls: ['./simulacao.component.scss']
})
export class SimulacaoComponent implements OnInit, OnDestroy {
  // Disponíveis no template
  readonly presets = PRESETS;
  readonly fmtNum = fmtNum;
  readonly fmtPct = fmtPct;
  readonly fmtSigned = fmtSigned;
  readonly statusLabel = STATUS_LABEL;
  readonly verdictLabel = VERDICT_LABEL;
  readonly severityLabel = SEVERITY_LABEL;
  readonly heavyShare = HEAVY_CUSTOMER_SHARE;
  readonly minAutonomy = MIN_AUTONOMY_DAYS;
  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'geral', label: 'Geral' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'compressores', label: 'Compressores' },
    { id: 'camioes', label: 'Camiões' },
    { id: 'analise', label: 'Análise' }
  ];

  form!: FormGroup;
  tab: Tab = 'geral';
  presetCode = 'A';

  /** Último resultado calculado com o formulário válido. */
  result!: Result;
  /** O formulário tem campos inválidos: o resultado mostrado já não corresponde aos valores escritos. */
  stale = false;
  chart!: ChartModel;
  strip: { label: string; used: number; total: number; over: boolean }[] = [];
  reference: { name: string; result: Result } | null = null;
  pulse: Record<KpiKey, boolean> = { comp: false, truck: false, system: false, coverage: false };

  private issueMap: Record<string, Issue> = {};
  private scenarioId = '';
  private formSub?: Subscription;
  private pulseTimer?: ReturnType<typeof setTimeout>;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.load(baseScenario());
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
    if (this.pulseTimer) clearTimeout(this.pulseTimer);
  }

  // ───────────── Acesso aos controlos (para o template) ─────────────

  get customers(): FormArray {
    return this.form.get('customers') as FormArray;
  }
  get compressors(): FormArray {
    return this.form.get('compressors') as FormArray;
  }
  get trucks(): FormArray {
    return this.form.get('trucks') as FormArray;
  }
  get thresholdOrderError(): boolean {
    return !!this.form.get('analysis')?.errors?.['thresholdOrder'];
  }
  get stressRangeError(): boolean {
    return !!this.form.get('analysis')?.errors?.['stressRange'];
  }

  ctl(path: string): FormControl {
    return this.form.get(path) as FormControl;
  }
  fc(group: AbstractControl, key: string): FormControl {
    return group.get(key) as FormControl;
  }

  // ───────────── Carregar e construir o formulário ─────────────

  private load(s: Scenario): void {
    this.scenarioId = s.id;
    this.form = this.buildForm(s);
    this.formSub?.unsubscribe();
    this.formSub = this.form.valueChanges.subscribe(() => this.recalc());
    this.recalc(true);
  }

  private num(value: number, ...extra: ValidatorFn[]): FormControl {
    return new FormControl(value, [Validators.required, ...extra]);
  }

  private buildForm(s: Scenario): FormGroup {
    return this.fb.group({
      name: [s.name, [Validators.required, Validators.maxLength(80)]],
      params: this.fb.group({
        hoursPerDay: this.num(s.params.hoursPerDay, Validators.min(1), Validators.max(24)),
        truckCapacity: this.num(s.params.truckCapacity, Validators.min(1), integer),
        loadTimeH: this.num(s.params.loadTimeH, Validators.min(0)),
        swapTimeH: this.num(s.params.swapTimeH, Validators.min(0)),
        totalMats: this.num(s.params.totalMats, Validators.min(0), integer),
        totalPads: this.num(s.params.totalPads, Validators.min(0), integer),
        totalPrpR200: this.num(s.params.totalPrp.R200, Validators.min(0), integer),
        totalPrpR500: this.num(s.params.totalPrp.R500, Validators.min(0), integer),
        demandFactor: this.num(s.params.demandFactor, Validators.min(50), Validators.max(300))
      }),
      customers: this.fb.array(s.customers.map(c => this.customerGroup(c))),
      compressors: this.fb.array(s.compressors.map(c => this.compressorGroup(c))),
      trucks: this.fb.array(s.trucks.map(t => this.truckGroup(t))),
      analysis: this.fb.group(
        {
          stressStep: this.num(s.analysis.stressStep, Validators.min(1), Validators.max(100)),
          stressMax: this.num(s.analysis.stressMax, Validators.min(10), Validators.max(300)),
          tripMode: [s.analysis.tripMode, Validators.required],
          underUsed: this.num(Math.round(s.analysis.thresholds.underUsed * 100), Validators.min(1), Validators.max(99)),
          high: this.num(Math.round(s.analysis.thresholds.high * 100), Validators.min(1), Validators.max(99)),
          overload: this.num(Math.round(s.analysis.thresholds.overload * 100), Validators.min(1), Validators.max(99))
        },
        { validators: analysisValidator }
      )
    });
  }

  private customerGroup(c: Customer): FormGroup {
    const g = this.fb.group({
      id: [c.id],
      name: [c.name, [Validators.required, Validators.maxLength(60)]],
      roundTripH: this.num(c.roundTripH, Validators.min(0)),
      matsInstalled: this.num(c.matsInstalled, Validators.min(1), integer),
      dailyDeliveries: this.num(c.dailyDeliveries, Validators.min(0)),
      prpType: [c.prpType, Validators.required],
      pads: this.num(c.pads, Validators.min(0), integer),
      padsAuto: [c.pads === c.matsInstalled + 1],
      active: [c.active],
      daysPerWeek: this.num(c.daysPerWeek, Validators.min(1), Validators.max(7))
    });
    // PADs acompanham MATs + 1 enquanto o utilizador não os editar à mão
    g.get('matsInstalled')!.valueChanges.subscribe((v: unknown) => {
      if (g.get('padsAuto')!.value && v !== null && v !== '' && isFinite(Number(v))) {
        g.get('pads')!.setValue(Number(v) + 1, { emitEvent: false });
      }
    });
    return g;
  }

  private compressorGroup(c: Compressor): FormGroup {
    return this.fb.group({
      id: [c.id],
      name: [c.name, [Validators.required, Validators.maxLength(60)]],
      compressionTimeH: this.num(c.compressionTimeH, Validators.min(0.01)),
      oilDrainH: this.num(c.oilDrainH, Validators.min(0)),
      lostHours: this.num(c.lostHours, Validators.min(0)),
      active: [c.active]
    });
  }

  private truckGroup(t: Truck): FormGroup {
    return this.fb.group({
      id: [t.id],
      name: [t.name, [Validators.required, Validators.maxLength(60)]],
      shiftHours: this.num(t.shiftHours, Validators.min(0), Validators.max(24)),
      lostHours: this.num(t.lostHours, Validators.min(0)),
      available: [t.available]
    });
  }

  /** Formulário → cenário para o motor. Campos vazios valem 0 (só chega aqui com o formulário válido). */
  private toScenario(): Scenario {
    const v = this.form.getRawValue();
    const n = (x: unknown): number => {
      const y = Number(x);
      return isFinite(y) ? y : 0;
    };
    const a = v.analysis;
    return {
      id: this.scenarioId,
      name: String(v.name ?? '').trim() || 'Cenário',
      params: {
        hoursPerDay: n(v.params.hoursPerDay),
        truckCapacity: n(v.params.truckCapacity),
        loadTimeH: n(v.params.loadTimeH),
        swapTimeH: n(v.params.swapTimeH),
        totalMats: n(v.params.totalMats),
        totalPads: n(v.params.totalPads),
        totalPrp: { R200: n(v.params.totalPrpR200), R500: n(v.params.totalPrpR500) },
        demandFactor: n(v.params.demandFactor)
      },
      customers: v.customers.map(
        (c: any): Customer => ({
          id: c.id,
          name: String(c.name ?? '').trim(),
          roundTripH: n(c.roundTripH),
          matsInstalled: n(c.matsInstalled),
          dailyDeliveries: n(c.dailyDeliveries),
          prpType: c.prpType,
          pads: n(c.pads),
          active: !!c.active,
          daysPerWeek: n(c.daysPerWeek)
        })
      ),
      compressors: v.compressors.map(
        (c: any): Compressor => ({
          id: c.id,
          name: String(c.name ?? '').trim(),
          compressionTimeH: n(c.compressionTimeH),
          oilDrainH: n(c.oilDrainH),
          lostHours: n(c.lostHours),
          active: !!c.active
        })
      ),
      trucks: v.trucks.map(
        (t: any): Truck => ({
          id: t.id,
          name: String(t.name ?? '').trim(),
          shiftHours: n(t.shiftHours),
          lostHours: n(t.lostHours),
          available: !!t.available
        })
      ),
      analysis: {
        stressStep: n(a.stressStep),
        stressMax: n(a.stressMax),
        tripMode: a.tripMode,
        thresholds: { underUsed: n(a.underUsed) / 100, high: n(a.high) / 100, overload: n(a.overload) / 100 }
      }
    };
  }

  // ───────────── Recálculo ─────────────

  private recalc(initial = false): void {
    this.stale = this.form.invalid;
    if (this.stale) return;          // mantém o último resultado válido, marcado como desatualizado

    const scenario = this.toScenario();
    const previous = initial ? null : this.result;
    this.result = simulate(scenario);

    this.issueMap = {};
    for (const i of this.result.issues) {
      const old = this.issueMap[i.path];
      if (!old || (i.level === 'error' && old.level === 'warn')) this.issueMap[i.path] = i;
    }

    const inv = this.result.inventory;
    const p = scenario.params;
    this.strip = [
      { label: 'MATs', used: inv.matsAtCustomers, total: p.totalMats, over: inv.matsAtCustomers > p.totalMats },
      { label: 'PADs', used: inv.padsAtCustomers, total: p.totalPads, over: inv.padsAtCustomers > p.totalPads },
      { label: 'PRP R200', used: inv.prpUsed.R200, total: p.totalPrp.R200, over: inv.prpUsed.R200 > p.totalPrp.R200 },
      { label: 'PRP R500', used: inv.prpUsed.R500, total: p.totalPrp.R500, over: inv.prpUsed.R500 > p.totalPrp.R500 }
    ];

    this.chart = this.buildChart(this.result);
    if (previous) this.flash(previous, this.result);
  }

  /** Dá um pequeno destaque aos indicadores que mudaram com a última alteração. */
  private flash(a: Result, b: Result): void {
    const differs = (x: number, y: number): boolean => !(x === y || Math.abs(x - y) < 1e-6);
    const changed: KpiKey[] = [];
    if (differs(a.compressorUtil, b.compressorUtil)) changed.push('comp');
    if (differs(a.truckUtil, b.truckUtil)) changed.push('truck');
    if (differs(a.systemUtil, b.systemUtil) || a.bottleneck !== b.bottleneck) changed.push('system');
    if (differs(a.coverage, b.coverage)) changed.push('coverage');
    if (!changed.length) return;

    for (const k of changed) this.pulse[k] = true;
    if (this.pulseTimer) clearTimeout(this.pulseTimer);
    this.pulseTimer = setTimeout(() => {
      this.pulse = { comp: false, truck: false, system: false, coverage: false };
    }, 500);
  }

  // ───────────── Mensagens junto aos campos ─────────────

  issueLevel(path: string): 'error' | 'warn' | null {
    return this.issueMap[path]?.level ?? null;
  }

  msgFor(c: AbstractControl | null, path: string): string | null {
    const e = c?.errors;
    if (e) {
      if (e['required']) return 'Obrigatório';
      if (e['min']) return `Mínimo ${e['min'].min}`;
      if (e['max']) return `Máximo ${e['max'].max}`;
      if (e['integer']) return 'Use um número inteiro';
      if (e['maxlength']) return 'Demasiado longo';
    }
    return this.issueMap[path]?.message ?? null;
  }

  hasErr(c: AbstractControl | null, path: string): boolean {
    return !!c?.invalid || this.issueLevel(path) === 'error';
  }

  /** Bolinha no separador: vermelha se houver erro, âmbar se só houver avisos. */
  tabState(tab: Tab): 'error' | 'warn' | null {
    const groupOf: Record<Tab, string> = {
      geral: 'params',
      clientes: 'customers',
      compressores: 'compressors',
      camioes: 'trucks',
      analise: 'analysis'
    };
    const key = groupOf[tab];
    if (this.form.get(key)?.invalid) return 'error';
    const own = this.result.issues.filter(i => i.path === key || i.path.startsWith(key + '.'));
    if (own.some(i => i.level === 'error')) return 'error';
    return own.length ? 'warn' : null;
  }

  // ───────────── Ações ─────────────

  private uniqueName(base: string, existing: string[]): string {
    const names = new Set(existing.map(n => n.trim().toLowerCase()));
    let i = existing.length + 1;
    while (names.has(`${base} ${i}`.toLowerCase())) i++;
    return `${base} ${i}`;
  }

  addCustomer(): void {
    const names = this.customers.controls.map(c => String(c.get('name')?.value ?? ''));
    this.customers.push(this.customerGroup(newCustomer(this.uniqueName('Cliente', names), 2, 2, 1, 'R200')));
    this.form.markAsDirty();
  }
  removeCustomer(i: number): void {
    this.customers.removeAt(i);
    this.form.markAsDirty();
  }

  addCompressor(): void {
    const names = this.compressors.controls.map(c => String(c.get('name')?.value ?? ''));
    this.compressors.push(this.compressorGroup(newCompressor(this.uniqueName('Compressor', names), 2.5, true)));
    this.form.markAsDirty();
  }
  removeCompressor(i: number): void {
    this.compressors.removeAt(i);
    this.form.markAsDirty();
  }

  addTruck(): void {
    const names = this.trucks.controls.map(c => String(c.get('name')?.value ?? ''));
    this.trucks.push(this.truckGroup(newTruck(this.uniqueName('Truck', names))));
    this.form.markAsDirty();
  }
  removeTruck(i: number): void {
    this.trucks.removeAt(i);
    this.form.markAsDirty();
  }

  /** O utilizador editou os PADs à mão: deixam de seguir os MATs. */
  padsEdited(group: AbstractControl): void {
    group.get('padsAuto')!.setValue(false, { emitEvent: false });
  }
  padsFollowMats(group: AbstractControl): void {
    group.get('padsAuto')!.setValue(true, { emitEvent: false });
    const mats = Number(group.get('matsInstalled')!.value);
    if (isFinite(mats)) group.get('pads')!.setValue(mats + 1);
  }

  onPreset(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const code = select.value;
    if (this.form.dirty && !confirm(`Substituir os valores atuais pelo cenário ${code}? As alterações perdem-se.`)) {
      select.value = this.presetCode;
      return;
    }
    const p = PRESETS.find(x => x.code === code);
    if (!p) return;
    this.presetCode = code;
    this.load(p.build());
  }

  reset(): void {
    if (this.form.dirty && !confirm('Repor o cenário base do Excel? As alterações perdem-se.')) return;
    this.presetCode = 'A';
    this.load(baseScenario());
  }

  toggleReference(): void {
    this.reference = this.reference ? null : { name: String(this.form.get('name')?.value ?? ''), result: this.result };
  }

  get presetDescription(): string {
    return PRESETS.find(p => p.code === this.presetCode)?.description ?? '';
  }

  // ───────────── Apresentação ─────────────

  utilText(u: number): string {
    return isFinite(u) ? fmtPct(u) : 'Sem capacidade';
  }

  growthText(m: number): string {
    return isFinite(m) ? fmtSigned(m) : '—';
  }

  /** Largura da barra numa escala de 0 a 120 %, para a sobrecarga continuar visível. */
  gauge(u: number): number {
    return (Math.min(isFinite(u) ? u : 1.2, 1.2) / 1.2) * 100;
  }
  readonly mark100 = (1 / 1.2) * 100;

  compRes(group: AbstractControl): ResourceLoad | undefined {
    return this.result.compressors.find(x => x.id === group.get('id')?.value);
  }
  truckRes(group: AbstractControl): ResourceLoad | undefined {
    return this.result.trucks.find(x => x.id === group.get('id')?.value);
  }

  private deltaValue(k: KpiKey): number | null {
    if (!this.reference) return null;
    const r = this.result;
    const ref = this.reference.result;
    const pair: Record<KpiKey, [number, number]> = {
      comp: [r.compressorUtil, ref.compressorUtil],
      truck: [r.truckUtil, ref.truckUtil],
      system: [r.systemUtil, ref.systemUtil],
      coverage: [r.coverage, ref.coverage]
    };
    const [a, b] = pair[k];
    return isFinite(a) && isFinite(b) ? a - b : null;
  }

  deltaText(k: KpiKey): string {
    const d = this.deltaValue(k);
    if (d === null) return 'n/d';
    const pp = d * 100;
    return `${Math.abs(pp) < 0.05 ? '' : pp > 0 ? '+' : '−'}${fmtNum(Math.abs(pp))} pp`;
  }

  /** Verde se melhora, vermelho se piora. Nas utilizações, menos é melhor; na cobertura, mais. */
  deltaClass(k: KpiKey): 'good' | 'bad' | 'same' {
    const d = this.deltaValue(k);
    if (d === null || Math.abs(d) < 0.0005) return 'same';
    const better = k === 'coverage' ? d > 0 : d < 0;
    return better ? 'good' : 'bad';
  }

  private buildChart(r: Result): ChartModel {
    const w = 620;
    const h = 280;
    const plotL = 48;
    const plotR = w - 16;
    const plotT = 16;
    const plotB = h - 36;
    const pw = plotR - plotL;
    const ph = plotB - plotT;
    const pts = r.stress;

    const maxPct = Math.max(pts.length ? pts[pts.length - 1].increase * 100 : 0, 10);
    const finite = pts.flatMap(p => [p.compressorUtil, p.truckUtil]).filter(u => isFinite(u));
    const yMax = Math.min(Math.max(1.2, Math.ceil(Math.max(1, ...finite) * 10) / 10 + 0.1), 2.5);

    const X = (pct: number): number => plotL + (pct / maxPct) * pw;
    const Y = (u: number): number => plotT + ph * (1 - Math.min(isFinite(u) ? u : yMax, yMax) / yMax);
    const line = (pick: (p: (typeof pts)[number]) => number): string =>
      pts.map(p => `${X(p.increase * 100).toFixed(1)},${Y(pick(p)).toFixed(1)}`).join(' ');

    const xTicks = Array.from({ length: 6 }, (_, i) => {
      const pct = (maxPct * i) / 5;
      return { x: X(pct), label: i === 0 ? '0%' : '+' + fmtNum(pct, 0) + '%' };
    });
    const yStep = yMax > 1.6 ? 0.5 : 0.25;
    const yTicks: { y: number; label: string }[] = [];
    for (let u = 0; u <= yMax + 1e-9; u += yStep) yTicks.push({ y: Y(u), label: fmtPct(u, 0) });

    const markers: ChartModel['markers'] = [];
    (['compressors', 'trucks'] as ResourceKind[]).forEach(kind => {
      const m = r.growthMargin[kind];
      if (isFinite(m) && m >= 0 && m * 100 <= maxPct) markers.push({ kind, x: X(m * 100), label: fmtSigned(m) });
    });

    return {
      w, h, plotL, plotR, plotT, plotB,
      y100: Y(1),
      xTicks,
      yTicks,
      comp: line(p => p.compressorUtil),
      truck: line(p => p.truckUtil),
      markers
    };
  }

  trackByCtl = (_: number, c: AbstractControl): AbstractControl => c;
}
