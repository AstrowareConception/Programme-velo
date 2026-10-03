"use client";

import type { CompletedSession } from "@/lib/types";
import type { ClimbChallenge } from "@/lib/routes";
import { analyzeRouteSectors, compareSectorTimes, performanceRecords } from "@/lib/performance";
import { formatRaceTime } from "@/lib/time-attack";

export function PerformanceRecords({ sessions }: { sessions: CompletedSession[] }) {
  const records = performanceRecords(sessions);
  const cards = [
    { label:"Distance totale", value:`${records.totalDistanceKm.toFixed(0)} km` },
    { label:"Plus longue sortie", value:`${records.longestRideKm.toFixed(1)} km` },
    { label:"Durée max", value:`${Math.round(records.longestRideMinutes)} min` },
    { label:"Puissance moy. record", value:records.bestAveragePowerW !== undefined ? `${Math.round(records.bestAveragePowerW)} W` : "—" },
    { label:"Meilleure puissance 5 min", value:records.best5MinPower ? `${Math.round(records.best5MinPower.watts)} W` : "—" },
    { label:"Meilleure puissance 20 min", value:records.best20MinPower ? `${Math.round(records.best20MinPower.watts)} W` : "—" },
    { label:"Cadence max", value:records.maxCadenceRpm !== undefined ? `${Math.round(records.maxCadenceRpm)} RPM` : "—" }
  ];

  return (
    <section className="card performanceRecords">
      <div className="sectionHead"><div><p className="eyebrow">PERFORMANCE</p><h2>Tes repères</h2></div><span className="spark">FTMS enrichit ces records</span></div>
      <div className="performanceRecordGrid">
        {cards.map((card) => <span key={card.label}><small>{card.label}</small><strong>{card.value}</strong></span>)}
      </div>
    </section>
  );
}

export function SectorAnalysis({
  session,
  route,
  reference
}: {
  session: CompletedSession;
  route: ClimbChallenge;
  reference?: CompletedSession;
}) {
  const sectors = analyzeRouteSectors(session, route);
  const refSectors = reference && reference.id !== session.id ? analyzeRouteSectors(reference, route) : [];
  const compared = refSectors.length ? compareSectorTimes(sectors, refSectors) : sectors.map((sector) => ({ ...sector, deltaSeconds: undefined }));

  return (
    <section className="sectorAnalysis">
      <div className="sectionHead"><div><small className="eyebrow">SECTEURS 25 %</small><h3>Où le temps se gagne.</h3></div>{reference && reference.id !== session.id && <span className="sectorReference">vs PB</span>}</div>
      <div className="sectorTable">
        {compared.map((sector) => (
          <div className="sectorRow" key={sector.index}>
            <span className="sectorNumber">S{sector.index}</span>
            <div><small>Distance</small><strong>{sector.fromKm.toFixed(1)}–{sector.toKm.toFixed(1)} km</strong></div>
            <div><small>Temps</small><strong>{sector.durationSeconds !== undefined ? formatRaceTime(sector.durationSeconds) : "—"}</strong></div>
            <div><small>Δ PB</small><strong className={sector.deltaSeconds === undefined ? "" : sector.deltaSeconds <= 0 ? "positive" : "negative"}>{sector.deltaSeconds === undefined ? "—" : `${sector.deltaSeconds > 0 ? "+" : "−"}${formatRaceTime(Math.abs(sector.deltaSeconds))}`}</strong></div>
            <div><small>Watts</small><strong>{sector.avgPowerW !== undefined ? Math.round(sector.avgPowerW) : "—"}</strong></div>
            <div><small>RPM</small><strong>{sector.avgCadenceRpm !== undefined ? Math.round(sector.avgCadenceRpm) : "—"}</strong></div>
            <div><small>FC</small><strong>{sector.avgHeartRate !== undefined ? Math.round(sector.avgHeartRate) : "—"}</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}
