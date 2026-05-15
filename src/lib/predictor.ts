export interface WaitTimePredictor {
  estimateMinutes(input: PredictorInput): number;
}

export interface PredictorInput {
  positionAhead: number;
  recentConsultationMinutes?: number[];
}

const MIN_SAMPLES = 5;

export class HeuristicPredictor implements WaitTimePredictor {
  constructor(private readonly cfg: { defaultConsultationMinutes: number }) {}

  estimateMinutes({ positionAhead, recentConsultationMinutes }: PredictorInput): number {
    const samples = recentConsultationMinutes ?? [];
    const avg =
      samples.length >= MIN_SAMPLES
        ? samples.reduce((a, b) => a + b, 0) / samples.length
        : this.cfg.defaultConsultationMinutes;
    return Math.round(positionAhead * avg);
  }
}
