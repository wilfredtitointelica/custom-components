import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  EmbeddedViewRef,
  inject,
  Injector,
  input,
  linkedSignal,
  NgZone,
  output,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { EChartsOption } from 'echarts';
import { LineChart, type LineSeriesOption } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

import {
  cssLength,
  cssNumber,
  cssTime,
  INT_GRAPH_PALETTE,
  IntGraphColor,
  observeThemeChanges,
  prefersReducedMotion,
  readCssTokens,
  resolveCssColor,
} from '../../../_shared_';

// Only what a line chart needs, and only the SVG renderer: the canvas renderer never enters the bundle.
echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

type LinechartOption = echarts.ComposeOption<
  LineSeriesOption | GridComponentOption | TooltipComponentOption
>;

/** One series of the chart. */
export interface IntLinechartDataset {
  /** Name of the series: legend and tooltip. */
  readonly label: string;
  /** One value per label; `null` leaves a gap (the line breaks there). */
  readonly data: readonly (number | null)[];
  /** Palette name (`'mastercard'`, `'visa'`, `'1'`…) or any CSS color (`var(--i-…)`); default: palette in order. */
  readonly color?: IntGraphColor | string;
  /** Free data per value, handed to the `tooltip` template and to `onDataSelect` (e.g. the breakdown of the month). */
  readonly meta?: readonly unknown[];
}

/** Data of the chart, same shape as PrimeNG's p-chart: labels of the X axis + one dataset per line. */
export interface IntLinechartData {
  readonly labels: readonly string[];
  readonly datasets: readonly IntLinechartDataset[];
}

/** A point of the chart: context of the `tooltip` template and payload of `onDataSelect`. */
export interface IntLinechartPoint {
  readonly datasetIndex: number;
  readonly index: number;
  /** Label of the X axis (e.g. `Nov 26`). */
  readonly label: string;
  /** Label of the dataset (e.g. `Visa`). */
  readonly dataset: string;
  readonly value: number;
  /** `valuePrefix` + `valueFormatter(value)` (e.g. `EUR 1.5M`). */
  readonly formattedValue: string;
  /** Final color of the series. */
  readonly color: string;
  readonly meta: unknown;
}

/** An item of the legend: context of the `legend` template. */
export interface IntLinechartLegendItem {
  readonly index: number;
  readonly label: string;
  readonly color: string;
  readonly visible: boolean;
}

/** Payload of `onDataSelect`. */
export interface IntLinechartDataSelectEvent {
  readonly originalEvent?: Event;
  readonly point: IntLinechartPoint;
}

interface TooltipContext {
  $implicit: IntLinechartPoint | null;
}

/** Fields ECharts passes to the formatter and to the click handler (only the ones read here). */
interface SeriesEventParams {
  readonly seriesId?: string;
  readonly dataIndex: number;
  readonly event?: { readonly event?: Event };
}

/** ECharts id of a series: `<dataset index>-<redraws>` (pointAt reads the index back with parseInt). */
const seriesId = (index: number, redraws: ReadonlyMap<number, number>): string =>
  `${index}-${redraws.get(index) ?? 0}`;

/** Prefix of the tokens of this component: --int-linechart-*. */
const PREFIX = 'int-linechart';

/** Tokens of _linechart.scss that build the ECharts option (the SVG cannot read CSS). */
const TOKEN_KEYS = [
  'font-family',
  'font-size',
  'plot-padding',
  'axis-label-color',
  'axis-prefix-color',
  'axis-prefix-weight',
  'axis-value-weight',
  'axis-prefix-gap',
  'grid-line-color',
  'grid-line-width',
  'line-width',
  'point-size',
  'point-open-background',
  'point-open-border-width',
  'tooltip-offset',
] as const;

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Default value format: compact (`500K`, `1.5M`). */
export const intLinechartCompactFormatter = (value: number): string => compactNumber.format(value);

/**
 * <int-linechart> · version 1. Line chart on ECharts (SVG renderer).
 * Colors, font and sizes come from the --int-linechart-* tokens (→ --int-graph-* of _tokens_/), legend
 * and tooltip are HTML with templates: no color, size or HTML string in this file.
 */
@Component({
  selector: 'int-linechart',
  templateUrl: './linechart.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'int-linechart' },
})
export class IntLinechart {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /**
   * Datos del gráfico, con la forma de `p-chart`: `labels` del eje X y un `datasets` por línea
   * (`label`, `data`, `color` y `meta` opcionales). Un `null` en `data` deja un hueco en la línea.
   */
  readonly data = input<IntLinechartData>({ labels: [], datasets: [] });
  /**
   * Opciones de ECharts que se fusionan al final sobre las del componente, para un caso puntual.
   * Los colores, la fuente y los tamaños no se pasan aquí: salen de los tokens `--int-linechart-*`.
   */
  readonly options = input<EChartsOption>();
  /** int-* extension: prefijo de los valores en el eje Y y en el tooltip (p. ej. la moneda `EUR`); va en peso regular. */
  readonly valuePrefix = input<string>();
  /** int-* extension: formato de los valores del eje Y y del tooltip; por defecto compacto (`500K`, `1.5M`). */
  readonly valueFormatter = input<(value: number) => string>(intLinechartCompactFormatter);
  /** int-* extension: el último punto de cada serie va hueco, para marcar un periodo en curso (mes actual). */
  readonly openLast = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: quita la caja del tooltip (fondo, borde, sombra y padding). Sin él, el componente pone la
   * caja y el template `tooltip` solo arma el contenido; con él, el template trae su propio diseño.
   */
  readonly tooltipUnstyled = input(false, { transform: booleanAttribute });
  /** Etiqueta accesible del gráfico (`aria-label`). */
  readonly ariaLabel = input<string>();
  /** Id del elemento que etiqueta el gráfico (`aria-labelledby`), p. ej. el título de la card. */
  readonly ariaLabelledBy = input<string>();
  /** Se emite al hacer clic en un punto, con el punto (`datasetIndex`, `index`, `value`, `meta`…). */
  readonly onDataSelect = output<IntLinechartDataSelectEvent>();

  /**
   * int-* extension: contenido del tooltip de un punto, escrito con helpers `u-*`. Recibe el punto
   * (`label`, `dataset`, `value`, `formattedValue`, `color`, `meta`). Sin template: etiqueta, serie y valor.
   */
  protected readonly tooltipTemplate = contentChild<TemplateRef<{ $implicit: IntLinechartPoint }>>(
    'tooltip',
    {
      descendants: false,
    },
  );
  /** int-* extension: contenido de un ítem de la leyenda (`label`, `color`, `visible`). Sin template: marcador y nombre. */
  protected readonly legendTemplate = contentChild<
    TemplateRef<{ $implicit: IntLinechartLegendItem }>
  >('legend', {
    descendants: false,
  });

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private readonly injector = inject(Injector);
  private readonly plot = viewChild.required<ElementRef<HTMLElement>>('plot');
  private readonly tooltipBox = viewChild.required<TemplateRef<TooltipContext>>('tooltipBox');

  /** Bumped when the page theme can have changed: tokens are read again. */
  private readonly themeVersion = signal(0);
  private readonly chart = signal<echarts.ECharts | undefined>(undefined);
  private tooltipView?: EmbeddedViewRef<TooltipContext>;
  private readonly tooltipContext: TooltipContext = { $implicit: null };

  /** Datasets turned off from the legend; new data shows every series again. */
  private readonly hidden = linkedSignal<IntLinechartData, ReadonlySet<number>>({
    source: this.data,
    computation: () => new Set<number>(),
  });
  /** Datasets fading out after a legend click: the legend shows them off, the line is still fading. */
  private readonly leaving = linkedSignal<IntLinechartData, ReadonlySet<number>>({
    source: this.data,
    computation: () => new Set<number>(),
  });
  /**
   * Times each dataset was redrawn (click on the last visible one). It is part of the series id: a new id
   * makes ECharts draw the series again with its entry animation while the axes and grid stay in place.
   */
  private readonly redraws = linkedSignal<IntLinechartData, ReadonlyMap<number, number>>({
    source: this.data,
    computation: () => new Map<number, number>(),
  });
  /** Datasets with a fade running: a second click waits for it to end. */
  private readonly fading = new Set<number>();

  /** Final color of each dataset, resolved from the tokens. */
  protected readonly colors = computed(() => {
    this.themeVersion();
    return this.data().datasets.map((dataset, i) =>
      resolveCssColor(
        this.host,
        PREFIX,
        dataset.color ?? INT_GRAPH_PALETTE[i % INT_GRAPH_PALETTE.length],
      ),
    );
  });

  protected readonly legendItems = computed<IntLinechartLegendItem[]>(() => {
    const colors = this.colors();
    const hidden = this.hidden();
    const leaving = this.leaving();
    return this.data().datasets.map((dataset, index) => ({
      index,
      label: dataset.label,
      color: colors[index],
      visible: !hidden.has(index) && !leaving.has(index),
    }));
  });

  private readonly chartOption = computed<LinechartOption>(() => {
    this.themeVersion();
    const t = readCssTokens(this.host, PREFIX, TOKEN_KEYS);
    const { labels, datasets } = this.data();
    const colors = this.colors();
    const hidden = this.hidden();
    const redraws = this.redraws();
    const openLast = this.openLast();
    const lastIndex = labels.length - 1;
    const fontFamily = t['font-family'];
    const fontSize = cssLength(t['font-size'], 12);
    const padding = cssLength(t['plot-padding']);
    const lineWidth = cssLength(t['line-width'], 1);
    const openBorderWidth = cssLength(t['point-open-border-width'], 2);
    const offset = cssLength(t['tooltip-offset']);
    const prefix = this.valuePrefix();
    const format = this.valueFormatter();

    return {
      animation: !prefersReducedMotion(),
      textStyle: { fontFamily, fontSize },
      grid: { top: padding, right: padding, bottom: padding, left: padding, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: [...labels],
        axisLine: { show: false },
        axisTick: { show: false },
        // interval 'auto' (default): every month when it fits, as in the reference; one of two when narrow.
        axisLabel: { color: t['axis-label-color'], fontFamily, fontSize },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: t['axis-label-color'],
          fontFamily,
          fontSize,
          formatter: (value: number) =>
            prefix ? `{pre|${prefix}}{gap|}{val|${format(value)}}` : `{val|${format(value)}}`,
          rich: {
            pre: {
              color: t['axis-prefix-color'],
              fontFamily,
              fontSize,
              fontWeight: cssNumber(t['axis-prefix-weight'], 400),
            },
            // Gap between prefix and value as a fixed-width empty segment: ECharts trims or collapses
            // spaces between rich segments (the widest label lost its space).
            gap: { width: cssLength(t['axis-prefix-gap'], 4) },
            val: {
              color: t['axis-label-color'],
              fontFamily,
              fontSize,
              fontWeight: cssNumber(t['axis-value-weight'], 700),
            },
          },
        },
        splitLine: {
          lineStyle: { color: t['grid-line-color'], width: cssLength(t['grid-line-width'], 1) },
        },
      },
      tooltip: {
        trigger: 'item',
        confine: true,
        // The box is the HTML of the template (int-linechart__tooltip): ECharts' own layer stays invisible.
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        extraCssText: 'box-shadow: none;',
        position: (point, _params, _dom, _rect, size) => [
          point[0] - size.contentSize[0] / 2,
          point[1] - size.contentSize[1] - offset,
        ],
        formatter: (params) => this.renderTooltip(Array.isArray(params) ? params[0] : params) ?? '',
      },
      series: datasets.flatMap((dataset, i): LineSeriesOption[] => {
        if (hidden.has(i)) return [];
        const color = colors[i];
        return [
          {
            id: seriesId(i, redraws),
            name: dataset.label,
            type: 'line',
            data: dataset.data.map((value, j) =>
              openLast && j === lastIndex && value !== null
                ? {
                    value,
                    itemStyle: {
                      color: t['point-open-background'],
                      borderColor: color,
                      borderWidth: openBorderWidth,
                    },
                  }
                : value,
            ),
            color,
            symbol: 'circle',
            symbolSize: cssLength(t['point-size'], 10),
            smooth: false,
            cursor: 'pointer',
            itemStyle: { color },
            lineStyle: { color, width: lineWidth },
            emphasis: { lineStyle: { width: lineWidth } },
          },
        ];
      }),
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      // ECharts listens to the mouse all the time: outside Angular, so hovering does not run change detection.
      this.zone.runOutsideAngular(() => {
        const element = this.plot().nativeElement;
        const chart = echarts.init(element, undefined, { renderer: 'svg' });
        // Resize on the next frame: resizing inside the observer callback would trigger it again.
        let frame = 0;
        const resizeObserver = new ResizeObserver(() => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => chart.resize());
        });
        resizeObserver.observe(element);
        const stopTheme = observeThemeChanges(() =>
          this.zone.run(() => this.themeVersion.update((n) => n + 1)),
        );
        chart.on('click', (params) => this.select(params));

        this.tooltipView = this.tooltipBox().createEmbeddedView(this.tooltipContext, this.injector);
        this.tooltipView.detectChanges();

        destroyRef.onDestroy(() => {
          cancelAnimationFrame(frame);
          resizeObserver.disconnect();
          stopTheme();
          chart.dispose();
          this.tooltipView?.destroy();
        });
        this.chart.set(chart);
      });
    });

    effect(() => {
      const chart = this.chart();
      const option = this.chartOption();
      const extra = this.options();
      if (!chart) return;
      this.zone.runOutsideAngular(() => {
        // Only the series are replaced (by id): the axes, the grid and the series that stay are updated
        // with animation instead of being rebuilt, so a legend click never blanks the chart.
        chart.setOption(option, { replaceMerge: ['series'] });
        if (extra) chart.setOption(extra);
      });
    });
  }

  /**
   * Legend click. A hidden series comes back with the ECharts entry animation; a visible one fades out
   * and then leaves the chart (the axis rescales with animation). The last visible series is not turned
   * off: it fades out and is drawn again, as feedback of the click.
   */
  protected toggleDataset(index: number): void {
    if (this.fading.has(index)) return;
    const hidden = this.hidden();
    if (hidden.has(index)) {
      this.hidden.set(new Set([...hidden].filter((i) => i !== index)));
      return;
    }
    const isLast = this.data().datasets.length - hidden.size - this.leaving().size <= 1;
    if (!isLast) this.leaving.set(new Set([...this.leaving(), index]));
    this.fadeOut(index, () => {
      if (isLast) {
        // Same series under a new id: ECharts swaps the faded one for a new one with its entry animation.
        const redraws = new Map(this.redraws());
        redraws.set(index, (redraws.get(index) ?? 0) + 1);
        this.redraws.set(redraws);
        return;
      }
      this.leaving.set(new Set([...this.leaving()].filter((i) => i !== index)));
      this.hidden.set(new Set([...this.hidden(), index]));
    });
  }

  /**
   * Fades a series out (line and points) in --int-linechart-fade-duration, then calls `done` inside
   * Angular. ECharts removes a line at once and does not animate style changes, so the opacity is
   * stepped frame by frame with a merge of only that series.
   */
  private fadeOut(index: number, done: () => void): void {
    const chart = this.chart();
    const duration = cssTime(readCssTokens(this.host, PREFIX, ['fade-duration'])['fade-duration']);
    if (!chart || duration <= 0 || prefersReducedMotion()) {
      done();
      return;
    }
    this.fading.add(index);
    const id = seriesId(index, this.redraws());
    this.zone.runOutsideAngular(() => {
      const start = performance.now();
      const step = (now: number): void => {
        const progress = Math.min((now - start) / duration, 1);
        const opacity = 1 - progress * (2 - progress); // ease-out
        chart.setOption({
          series: [{ id, silent: true, lineStyle: { opacity }, itemStyle: { opacity } }],
        });
        if (progress < 1) {
          requestAnimationFrame(step);
          return;
        }
        this.fading.delete(index);
        this.zone.run(done);
      };
      requestAnimationFrame(step);
    });
  }

  private pointAt(params: SeriesEventParams): IntLinechartPoint | null {
    const datasetIndex = parseInt(params.seriesId ?? '', 10);
    const index = params.dataIndex;
    const dataset = this.data().datasets[datasetIndex];
    const value = dataset?.data[index];
    if (value === null || value === undefined) return null;
    const prefix = this.valuePrefix();
    const formatted = this.valueFormatter()(value);
    return {
      datasetIndex,
      index,
      label: this.data().labels[index] ?? '',
      dataset: dataset.label,
      value,
      formattedValue: prefix ? `${prefix} ${formatted}` : formatted,
      color: this.colors()[datasetIndex],
      meta: dataset.meta?.[index] ?? null,
    };
  }

  /** ECharts formatter: renders the tooltip view for the point and hands its element to ECharts. */
  private renderTooltip(params: SeriesEventParams): HTMLElement | null {
    const view = this.tooltipView;
    const point = this.pointAt(params);
    if (!view || !point) return null;
    this.tooltipContext.$implicit = point;
    view.detectChanges();
    return view.rootNodes.find((node): node is HTMLElement => node instanceof HTMLElement) ?? null;
  }

  private select(params: SeriesEventParams): void {
    const point = this.pointAt(params);
    if (!point) return;
    this.zone.run(() => this.onDataSelect.emit({ originalEvent: params.event?.event, point }));
  }
}
