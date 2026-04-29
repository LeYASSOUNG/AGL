import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { BackNavLogo } from '../../components/BackNavLogo';
import { HelpFab } from '../../components/HelpFab';
import { Container } from '../../components/ui/Container';

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-card border border-line bg-white p-6 shadow-card">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export function InfosPage() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    const raw = hash.replace(/^#/, '');
    if (!raw) return;
    const id = decodeURIComponent(raw);
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(t);
  }, [hash, pathname]);

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <Container className="space-y-6 py-8">
        <BackNavLogo to="/" label="Retour accueil" />
        <header>
          <h1 className="text-2xl font-bold text-ink">Informations &amp; assistance</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Retrouvez ici les réponses aux questions fréquentes et les liens utiles vers votre espace client ou hôte.
          </p>
        </header>

        <div className="grid max-w-3xl gap-6">
          <Section id="aide" title="Centre d'aide">
            <p>
              Pour réserver un logement, parcourez l&apos;accueil puis ouvrez une fiche établissement. Les services à la
              carte sont disponibles depuis la rubrique <Link className="font-medium text-brand underline" to="/services">Services</Link>.
            </p>
            <p>
              Vos réservations et avis se gèrent dans{' '}
              <Link className="font-medium text-brand underline" to="/profil?tab=reservations">
                Mon profil
              </Link>
              .
            </p>
          </Section>

          <Section id="contact" title="Nous contacter">
            <p>
              Pour toute question sur une réservation en cours, utilisez d&apos;abord les options depuis votre profil.
              Pour un partenariat ou un signalement, écrivez-nous depuis la messagerie prévue dans une prochaine version
              du site ; en attendant, passez par votre espace{' '}
              <Link className="font-medium text-brand underline" to="/profil?tab=parametres">
                Paramètres du compte
              </Link>
              .
            </p>
          </Section>

          <Section id="ressources-hotes" title="Ressources pour les hôtes">
            <p>
              Créez et gérez vos fiches depuis l&apos;espace hôte :{' '}
              <Link className="font-medium text-brand underline" to="/host">
                Tableau de bord hôte
              </Link>
              , puis hébergements, chambres, services et réservations.
            </p>
          </Section>

          <Section id="forum" title="Forum de la communauté">
            <p>
              Un espace d&apos;échange entre hôtes et voyageurs est prévu. En attendant, retrouvez les avis vérifiés
              sur les fiches établissements.
            </p>
          </Section>

          <Section id="a-propos" title="À propos de Quicklodge">
            <p>
              Quicklodge met en relation voyageurs et établissements pour des séjours et des services complémentaires
              en toute transparence sur les tarifs affichés.
            </p>
          </Section>

          <Section id="carrieres" title="Carrières">
            <p>
              Les offres d&apos;emploi seront publiées sur cette page lorsqu&apos;elles seront disponibles. Vous pouvez
              nous contacter via la section contact ci-dessus pour une candidature spontanée.
            </p>
          </Section>

          <Section id="cgu" title="Conditions d'utilisation">
            <p>
              L&apos;utilisation du site implique le respect des règles affichées lors de la réservation (dates,
              capacité, politique d&apos;annulation de l&apos;établissement). Le compte utilisateur est personnel ; les
              contenus illicites sont interdits.
            </p>
            <p className="text-xs text-muted">
              Texte synthétique à titre informatif — adaptez avec vos mentions légales définitives.
            </p>
          </Section>

          <Section id="confidentialite" title="Politique de confidentialité">
            <p>
              Les données nécessaires à la réservation et au compte sont traitées pour l&apos;exécution des services.
              Vous pouvez mettre à jour vos informations dans les paramètres du compte.
            </p>
            <p className="text-xs text-muted">
              Texte synthétique à titre informatif — adaptez avec votre politique RGPD définitive.
            </p>
          </Section>
        </div>
      </Container>
      <HelpFab />
    </div>
  );
}
