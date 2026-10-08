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
      <h1>Tes données locales, avec un cloud facultatif.</h1>
      <p className="legalLead">VeloQuest est conçue en mode local-first : les mesures corporelles, séances, préférences et parcours personnels sont conservés sur l’appareil utilisé. Une sauvegarde et une synchronisation Firebase peuvent être activées volontairement lorsqu’elles sont configurées.</p>

      <section className="card legalSection">
        <h2>Ce que VeloQuest enregistre</h2>
        <p>Le profil local peut contenir un pseudo, des objectifs de poids et de tour de taille, l’historique d’entraînement, les métriques saisies ou reçues par Bluetooth FTMS, les préférences d’interface et les parcours GPX importés.</p>
      </section>

      <section className="card legalSection">
        <h2>Où sont les données ?</h2>
        <p>Ces données sont conservées dans le stockage local du navigateur. Sans activation du cloud, elles ne sont pas envoyées à Firebase. Supprimer les données du navigateur ou de la PWA peut supprimer l’historique local. Avec le cloud activé et une synchronisation confirmée, une copie est conservée dans Cloud Firestore (Google), associée à ton compte Firebase Authentication. L’adresse e-mail sert à la connexion, à sa vérification et à la récupération du compte.</p>
      </section>

      <section className="card legalSection">
        <h2>Bluetooth</h2>
        <p>Sur les navigateurs compatibles, la connexion FTMS est établie directement entre le navigateur et le vélo avec l’autorisation explicite de l’utilisateur. Les mesures reçues pendant une séance restent locales pendant son déroulement. Si tu actives le cloud, les métriques et éventuelles traces conservées dans les séances enregistrées font partie de la sauvegarde.</p>
      </section>

      <section className="card legalSection">
        <h2>Cartes et hébergement</h2>
        <p>Les cartes utilisent des tuiles OpenStreetMap chargées par le réseau. Comme pour toute ressource web distante, ces requêtes sont visibles par le fournisseur de tuiles. L’application elle-même est destinée à être hébergée sur Vercel, qui reçoit les requêtes web normales nécessaires pour servir le site.</p>
      </section>

      <section className="card legalSection">
        <h2>Sauvegardes</h2>
        <p>L’export JSON ou CSV est déclenché manuellement. Le fichier généré est remis à l’utilisateur ; son stockage et son partage relèvent ensuite de son choix.</p>
      </section>

      <section className="card legalSection">
        <h2>Synchronisation et versions récupérables</h2>
        <p>Le cloud comprend le profil, les mesures corporelles, les séances enregistrées, les objectifs, programmes, favoris et parcours personnels. Les réglages de son, d’affichage et de résistance restent propres à l’appareil. La séance en cours et la connexion Bluetooth ne sont pas transférées.</p>
        <p>Chaque modification synchronisée crée une version récupérable. Les versions précédentes restent conservées jusqu’à une suppression administrative ; l’interface propose les 30 dernières. Supprimer une séance du suivi ne l’efface donc pas immédiatement des archives. Pour un effacement définitif des données cloud et du compte, adresse ta demande à AstroWare Conception via le lien ci-dessous.</p>
        <p>La déconnexion et la réinitialisation locale n’effacent pas les archives cloud. L’accès est limité au compte propriétaire par les règles Firestore. Il ne s’agit pas d’un chiffrement de bout en bout : les administrateurs autorisés du projet peuvent accéder aux données. Ne connecte ton compte que sur un appareil de confiance.</p>
        <a href="https://www.astroware-conception.com/">Contacter AstroWare Conception</a>
      </section>

      <p className="finePrint">Version de cette notice : octobre 2026. Les fonctions cloud restent inactives tant que leur configuration n’est pas déployée et que tu ne les actives pas.</p>
    </main>
  );
}
