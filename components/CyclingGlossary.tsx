import { cyclingGlossary } from "@/lib/glossary";

export function CyclingGlossary() {
  return <details className="readerHelp cyclingGlossary">
    <summary>Le lexique du vélo · D+, BPM, RPM…</summary>
    <p className="muted">Pas besoin de connaître le jargon pour commencer. Ouvre le mot qui t’intrigue.</p>
    {cyclingGlossary.map(group => <section key={group.title} aria-label={group.title}>
      <h3>{group.title}</h3>
      <div className="glossaryTerms">{group.terms.map(term => <details key={term.label}>
        <summary>{term.label}</summary>
        <p>{term.description}</p>
        <p className="glossaryExample"><strong>Par exemple</strong> {term.example}</p>
      </details>)}</div>
    </section>)}
    <p className="finePrint">Une mesure absente s’affiche « — » : cela ne signifie pas zéro. Les kilomètres et le relief simulés d’un parcours restent distincts des mesures reçues du vélo.</p>
  </details>;
}
