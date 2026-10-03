"use client";

type Point = { label: string; value: number };

export function MetricChart({
  title,
  points,
  unit,
  target
}: {
  title: string;
  points: Point[];
  unit: string;
  target?: number;
}) {
  if (!points.length) {
    return <section className="card metricChart emptyChart"><h2>{title}</h2><p>Pas encore assez de données.</p></section>;
  }

  const width = 720;
  const height = 250;
  const padX = 34;
  const padY = 28;
  const values = [...points.map((p) => p.value), ...(target !== undefined ? [target] : [])];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const extra = (max - min) * 0.12;
  min -= extra;
  max += extra;

  const x = (i: number) => padX + (i / Math.max(1, points.length - 1)) * (width - padX * 2);
  const y = (v: number) => height - padY - ((v - min) / (max - min)) * (height - padY * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const latest = points[points.length - 1];

  return (
    <section className="card metricChart">
      <div className="sectionHead">
        <div><p className="eyebrow">ÉVOLUTION</p><h2>{title}</h2></div>
        <div className="chartLatest"><strong>{latest.value.toFixed(1)}</strong><small>{unit}</small></div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {[0.25,0.5,0.75].map((r) => <line key={r} x1={padX} x2={width-padX} y1={padY+(height-padY*2)*r} y2={padY+(height-padY*2)*r} className="chartGrid" />)}
        {target !== undefined && <line x1={padX} x2={width-padX} y1={y(target)} y2={y(target)} className="chartTarget" />}
        <path d={path} className="chartLine" fill="none" />
        {points.map((p,i) => <circle key={i} cx={x(i)} cy={y(p.value)} r={i===points.length-1 ? 7 : 4} className="chartPoint" />)}
      </svg>
      <div className="chartAxis"><span>{points[0].label}</span>{target !== undefined && <strong>objectif {target.toFixed(1)} {unit}</strong>}<span>{latest.label}</span></div>
    </section>
  );
}
