/**
 * Date range definition
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

/**
 * Period comparison ranges
 */
export interface PeriodRanges {
  current: DateRange;
  previous: DateRange;
}
