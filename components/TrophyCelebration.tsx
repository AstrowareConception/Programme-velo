"use client";
import { useEffect, useRef, useState } from 'react';
import type { Badge, Preferences } from '@/lib/types';
import { regularityTrophyIds } from '@/lib/regularity';
import { prepareCueAudio, cueTrophyReward } from '@/lib/session-cues';

type Props = { badges: Badge[]; preferences: Preferences; hydrated: boolean; blocked: boolean; onRemember: (ids: string[]) => boolean; onGallery: () => void };
export function TrophyCelebration({ badges, preferences, hydrated, blocked, onRemember, onGallery }: Props) {
  const [pending, setPending] = useState<Badge[]>([]);
  const [retrospective, setRetrospective] = useState(false);
  const preferencesRef = useRef(preferences); preferencesRef.current = preferences;
  const played = useRef(false);
  useEffect(() => {
    const prepare = () => { void prepareCueAudio(preferencesRef.current); };
    document.addEventListener('pointerdown', prepare, { passive: true }); document.addEventListener('keydown', prepare);
    return () => { document.removeEventListener('pointerdown', prepare); document.removeEventListener('keydown', prepare); };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const initial = !preferences.trophyNotifications;
    if (blocked && !initial) return;
    const unlocked = badges.filter(b => b.unlocked);
    const previous = new Set(preferences.trophyNotifications ?? unlocked.filter(b => !regularityTrophyIds.includes(b.id)).map(b => b.id));
    const earned = unlocked.filter(b => !previous.has(b.id));
    if (!initial && !earned.length) return;
    if (!onRemember([...new Set([...previous, ...unlocked.map(b => b.id)])])) return;
    if (earned.length) {
      setRetrospective(initial);
      played.current = false;
      setPending(current => [...current, ...earned.filter(b => !current.some(c => c.id === b.id))]);
    }
  }, [badges, preferences.trophyNotifications, hydrated, blocked, onRemember]);
  useEffect(() => {
    if (!pending.length) { played.current = false; return; }
    const celebrate = () => {
      if (!blocked && !played.current && document.visibilityState !== 'hidden') { played.current = true; cueTrophyReward(preferencesRef.current); }
    };
    celebrate();
    document.addEventListener('visibilitychange', celebrate);
    return () => document.removeEventListener('visibilitychange', celebrate);
  }, [pending.length, blocked]);
  if (!pending.length || blocked) return null;
  return <aside className="trophyCelebration" aria-label="Récompense obtenue">
    <button type="button" className="trophyClose secondary" aria-label="Fermer la notification de trophées" onClick={() => setPending([])}>×</button>
    <div className="trophyMedal" aria-hidden="true"><svg viewBox="0 0 64 64" width="52" height="52" fill="none">
      <path d="M18 14H9v8c0 9 6 14 15 14m22-22h9v8c0 9-6 14-15 14" stroke="#ffd166" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 9h28v16c0 10-6 17-14 17s-14-7-14-17V9Z" fill="#ffd166" /><path d="M32 42v10m-10 4h20" stroke="#ffd166" strokeWidth="5" strokeLinecap="round" />
      <path d="m32 16 2.5 5 5.5.8-4 4 .9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-4 5.5-.8 2.5-5Z" fill="#916225" />
    </svg></div>
    <div role="status" aria-live="polite"><p className="eyebrow">{retrospective ? 'TON HISTORIQUE RÉCOMPENSÉ' : pending.length === 1 ? 'TROPHÉE DÉBLOQUÉ' : `${pending.length} TROPHÉES DÉBLOQUÉS`}</p>
      <h2>{pending.length === 1 ? pending[0].name : 'Tes efforts prennent leur place au palmarès'}</h2>
      {pending.length === 1 ? <p className="trophyDescription">{pending[0].description}</p> : <ul>{pending.map(b => <li key={b.id}><strong>{b.icon} {b.name}</strong><p>{b.description}</p></li>)}</ul>}
    </div>
    <div className="backupButtons"><button type="button" className="primary" onClick={() => { setPending([]); onGallery(); }}>Voir mes trophées</button><button type="button" className="secondary" onClick={() => setPending([])}>Continuer</button></div>
  </aside>;
}
