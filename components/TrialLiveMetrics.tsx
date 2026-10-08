import { currentBikeMetric, type BikeLiveMetrics } from "@/lib/bike-live-metrics";

export function TrialLiveMetrics({ metrics, now, connected }: { metrics: BikeLiveMetrics; now: number; connected: boolean }) {
  const speed = currentBikeMetric(metrics, "speedKmh", now, connected);
  const secondary = [
    { field: "cadenceRpm", label: "Cadence", unit: "tr/min" },
    { field: "powerW", label: "Puissance", unit: "W" },
    { field: "heartRate", label: "Fréquence cardiaque", unit: "bpm" }
  ] as const;
  return <section className="trialLiveMetrics" aria-label="Mesures du vélo en direct" aria-live="off">
    <dl className="trialSpeed"><dt>Vitesse instantanée</dt><dd><strong>{speed === undefined ? "—" : speed.toFixed(1).replace(".", ",")}</strong> <span>km/h</span></dd></dl>
    <dl className="trialSecondary">{secondary.map(({ field, label, unit }) => {
      const value = currentBikeMetric(metrics, field, now, connected);
      return <div key={field}><dt>{label}</dt><dd><strong>{value === undefined ? "—" : value.toFixed(0)}</strong> <span>{unit}</span></dd></div>;
    })}</dl>
    <small>Mesures envoyées par le vélo · — : non reçue ou ancienne.</small>
  </section>;
}
