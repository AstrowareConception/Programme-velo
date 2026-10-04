"use client";

import type { CompletedSession, WorkoutTemplate } from "@/lib/types";
import { workoutPrograms, workoutProgramProgress } from "@/lib/workout-programs";

export function WorkoutProgramsPanel({ sessions, workouts, onLaunch }: {
  sessions: CompletedSession[]; workouts: WorkoutTemplate[]; onLaunch: (workout: WorkoutTemplate) => void;
}) {
  const templates = new Map(workouts.map((workout) => [workout.id, workout]));
  return <details className="campaignDrawer workoutPrograms">
    <summary>Programmes découverte · 3 chemins pour progresser</summary>
    <p>Choisis tes séances dans l’ordre qui te convient, sans calendrier imposé. Seules les séances complètes comptent. Chaque programme donne un trophée et un bonus unique ; une même séance peut contribuer à deux programmes.</p>
    <div className="campaignGrid">
      {workoutPrograms.map((program) => {
        const progress = workoutProgramProgress(program, sessions);
        return <article className="card campaignCard" key={program.id}>
          <div className="campaignHeader"><span>{program.icon}</span><h2>{program.title}</h2><em>{progress.count}/{progress.total}</em></div>
          <p>{program.description}</p>
          <div className="programSteps">{program.workoutIds.map((id) => {
            const workout = templates.get(id);
            if (!workout) return null;
            const done = progress.completedIds.has(id);
            return <button className={done ? "secondary done" : "secondary"} key={id} onClick={() => onLaunch(workout)}>
              <span>{done ? "✓ " : ""}{workout.name}</span><small>{workout.duration} min · {done ? "Terminée" : "À découvrir"}</small>
            </button>;
          })}</div>
          <div className="campaignFooter"><span>Trophée + bonus unique <strong>+{program.xpBonus} XP</strong></span>{progress.complete && <strong className="campaignComplete">Programme terminé</strong>}</div>
        </article>;
      })}
    </div>
  </details>;
}
