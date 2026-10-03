import Link from "next/link";

export const metadata = {
  title: "Confidentialité",
  description: "Comment VeloQuest stocke et utilise les données."
};

export default function PrivacyPage() {
  return (
    <main className="legalShell">
      <Link href="/" className="legalBack">← Retour à VeloQuest</Link>
      <p className="eyebrow">CONFIDENTIALITÉ</p>
      <h1>Des données personnelles, mais pas de compte.</h1>
      <p className="legalLead">VeloQuest est conçue en mode local-first : les mesures corporelles, séances, préférences et parcours personnels restent dans le stockage du navigateur sur l’appareil utilisé.</p>

      <section className="card legalSection">
        <h2>Ce que VeloQuest enregistre</h2>
        <p>Le profil local peut contenir un pseudo, des objectifs de poids et de tour de taille, l’historique d’entraînement, les métriques saisies ou reçues par Bluetooth FTMS, les préférences d’interface et les parcours GPX importés.</p>
      </section>

      <section className="card legalSection">
        <h2>Où sont les données ?</h2>
        <p>Ces données sont conservées dans le stockage local du navigateur. VeloQuest n’utilise actuellement ni compte utilisateur, ni base de données distante, ni synchronisation cloud. Supprimer les données du navigateur ou de la PWA peut donc supprimer l’historique local.</p>
      </section>

      <section className="card legalSection">
        <h2>Bluetooth</h2>
        <p>Sur les navigateurs compatibles, la connexion FTMS est établie directement entre le navigateur et le vélo avec l’autorisation explicite de l’utilisateur. Les mesures Bluetooth ne sont pas envoyées à un serveur par VeloQuest.</p>
      </section>

      <section className="card legalSection">
        <h2>Cartes et hébergement</h2>
        <p>Les cartes utilisent des tuiles OpenStreetMap chargées par le réseau. Comme pour toute ressource web distante, ces requêtes sont visibles par le fournisseur de tuiles. L’application elle-même est destinée à être hébergée sur Vercel, qui reçoit les requêtes web normales nécessaires pour servir le site.</p>
      </section>

      <section className="card legalSection">
        <h2>Sauvegardes</h2>
        <p>L’export JSON ou CSV est déclenché manuellement. Le fichier généré est remis à l’utilisateur ; son stockage et son partage relèvent ensuite de son choix.</p>
      </section>

      <p className="finePrint">Version de cette notice : octobre 2026. Le fonctionnement sera mis à jour si une synchronisation cloud ou un compte utilisateur sont ajoutés ultérieurement.</p>
    </main>
  );
}
