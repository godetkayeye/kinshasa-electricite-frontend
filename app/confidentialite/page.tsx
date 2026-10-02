import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site'
import Link from 'next/link'
import { InfoPage, InfoSection } from '@/components/info-page'

export const metadata: Metadata = pageMetadata({
  title: 'Confidentialité',
  description: 'Ce que la plateforme collecte lors d’un signalement, ce qui est affiché publiquement et ce qui ne l’est jamais.',
  path: '/confidentialite',
})

// This page must describe what the application really does. Update it
// whenever the collected data, the rate limiting or the retention change.
export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Vos données" title="Confidentialité" intro="La plateforme fonctionne sans compte. Cette page explique simplement ce qui est enregistré lorsque vous faites un signalement, et ce qui est affiché.">
      <InfoSection title="Ce que nous enregistrons">
        <p>Lorsque vous envoyez un signalement, nous enregistrons :</p>
        <ul>
          <li>le type de signalement : coupure ou retour du courant ;</li>
          <li>la commune et le quartier que vous avez choisis ;</li>
          <li>pour une coupure, la durée que vous avez indiquée ;</li>
          <li>la zone concernée (tout le quartier, une partie, ou « je ne sais pas ») ;</li>
          <li>la date et l&apos;heure d&apos;envoi ;</li>
          <li>votre commentaire, si vous en écrivez un ;</li>
          <li>le nom ou pseudonyme, si vous en indiquez un.</li>
        </ul>
        <p>Le nom et le commentaire sont <strong>facultatifs</strong>. Évitez d&apos;y écrire des informations personnelles (téléphone, adresse précise).</p>
      </InfoSection>

      <InfoSection title="Ce que nous ne demandons pas">
        <ul>
          <li>Aucun compte, e-mail ou mot de passe.</li>
          <li>Aucun numéro de téléphone.</li>
          <li>Aucune adresse précise ni position GPS : seuls la commune et le quartier sont demandés.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Ce qui est affiché publiquement">
        <p>Le site affiche le type de signalement, la commune, le quartier, la durée et la zone déclarées, ainsi que la date. Ces informations servent aussi à calculer les compteurs et les graphiques.</p>
        <p><strong>Votre nom ou pseudonyme n&apos;est jamais affiché sur le site, et votre commentaire non plus.</strong> Ils sont conservés avec le signalement mais ne sont pas publiés.</p>
        <p>Seuls les administrateurs de la plateforme peuvent les consulter, dans un espace protégé, pour vérifier et modérer les signalements.</p>
      </InfoSection>

      <InfoSection title="Protection contre les abus">
        <p>Pour limiter les envois automatisés ou répétés, le nombre de signalements acceptés depuis une même connexion est limité pendant une courte période.</p>
        <p>Pour cela, l&apos;adresse IP de la connexion sert à tenir des compteurs temporaires, valables une heure au maximum. <strong>L&apos;adresse IP n&apos;est pas enregistrée avec le signalement.</strong></p>
        <p>Comme pour tout site web, l&apos;hébergeur peut par ailleurs conserver des journaux techniques de connexion.</p>
      </InfoSection>

      <InfoSection title="Modération">
        <p>Un administrateur peut invalider un signalement manifestement abusif, incohérent ou répété. Un signalement invalidé n&apos;est plus pris en compte dans les informations affichées sur le site, mais il n&apos;est pas supprimé : il reste enregistré, avec la trace de la décision.</p>
      </InfoSection>

      <InfoSection title="Mesure d'audience">
        <p>Lorsque le site est en ligne, un outil de mesure d&apos;audience (Vercel Analytics) compte les pages consultées afin de connaître la fréquentation du site.</p>
      </InfoSection>

      <InfoSection title="À quoi servent les données">
        <p>Les signalements servent uniquement à donner une vue communautaire de la situation électrique par quartier et par commune à Kinshasa.</p>
      </InfoSection>

      <InfoSection title="Durée de conservation">
        <p>Seuls les signalements des dernières 24 heures sont pris en compte pour décrire la situation d&apos;un quartier ; les graphiques remontent jusqu&apos;à 7 jours.</p>
        <p>Les signalements plus anciens ne sont plus affichés mais restent enregistrés : <strong>aucune suppression automatique n&apos;est en place à ce jour, et la durée de conservation n&apos;est pas encore fixée.</strong> Cette page sera mise à jour lorsqu&apos;elle le sera.</p>
      </InfoSection>

      <InfoSection title="Une question ?">
        <p>Les moyens de nous joindre seront indiqués sur la page <Link href="/contact" className="font-bold text-[#0067d8] underline">Contact</Link>.</p>
      </InfoSection>
    </InfoPage>
  )
}
