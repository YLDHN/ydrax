/**
 * Grille tarifaire YDRAx — édition septembre 2026.
 * Source unique des prix affichés sur /tarifs et utilisés par le simulateur.
 * Tous les montants sont en euros hors taxes.
 */

export const EDITION = "septembre 2026";
export const TVA_RATE = 0.2;

export const INCLUDED_EVERYWHERE = [
  "Design responsive",
  "Sécurisation HTTPS",
  "Mise en ligne",
  "Nom de domaine offert 1 an",
  "Mentions légales & RGPD",
  "Optimisation vitesse",
  "30 jours de corrections après livraison",
  "Formation à la prise en main",
];

/** kind: vitrine | dynamique | ecommerce | app — pilote les sections d'options visibles. */
export const PACKAGES = [
  {
    id: "essentiel",
    kind: "vitrine",
    name: "Vitrine Essentiel",
    tagline: "Présenter votre activité en ligne, simplement et rapidement.",
    price: 890,
    from: false,
    delay: "1 à 2 semaines",
    pages: 4,
    moduleSlots: 0,
    beyond: "Au-delà : page supplémentaire 120 €, options vitrine.",
    features: [
      "4 pages (accueil, services, à propos, contact)",
      "Design moderne, adapté mobile & tablette",
      "Formulaire de contact",
      "Google Maps, réseaux sociaux, horaires",
      "Référencement de base (Google)",
      "Hébergement & mise en ligne inclus",
    ],
  },
  {
    id: "pro",
    kind: "vitrine",
    name: "Vitrine Pro",
    tagline: "Un site sur mesure qui vous démarque et que vous gérez vous-même.",
    price: 1490,
    from: false,
    delay: "2 à 3 semaines",
    pages: 8,
    moduleSlots: 0,
    badge: "Le plus choisi",
    beyond: "Au-delà : page supplémentaire 120 €, options vitrine.",
    features: [
      "8 pages",
      "Design personnalisé & animations",
      "Espace actualités / blog modifiable",
      "Galerie photos, avis clients, FAQ",
      "Référencement avancé + statistiques",
      "Formation à la gestion du site",
      "Hébergement & mise en ligne inclus",
    ],
  },
  {
    id: "dynamique",
    kind: "dynamique",
    name: "Site Dynamique",
    tagline: "Un site connecté à une base de données, avec espace privé et gestion de vos données.",
    price: 2900,
    from: true,
    delay: "3 à 5 semaines",
    pages: 8,
    moduleSlots: 1,
    beyond: "Au-delà : chaque module supplémentaire 600 à 1 500 €.",
    features: [
      "Tout le contenu de Vitrine Pro",
      "Connexion utilisateurs (clients ou équipe)",
      "Tableau de bord d'administration",
      "1 module de données au choix (réservations, devis, inventaire simple…)",
      "Notifications par email",
    ],
  },
  {
    id: "ecommerce",
    kind: "ecommerce",
    name: "E-commerce",
    tagline: "Vendre en ligne, 24h/24.",
    price: 3500,
    from: true,
    delay: "4 à 6 semaines",
    pages: 8,
    moduleSlots: 0,
    beyond: "Au-delà : +50 produits 150 €, variantes, abonnements, avis…",
    features: [
      "Jusqu'à 50 produits mis en ligne",
      "Panier & paiement CB sécurisé",
      "Gestion commandes & stocks",
      "1 mode de livraison + retrait",
      "Emails de confirmation automatiques",
      "Comptes clients & historique",
    ],
  },
  {
    id: "app",
    kind: "app",
    name: "Application sur mesure",
    tagline: "CRM, outil de gestion, portail métier.",
    price: 5000,
    from: true,
    delay: "planning défini ensemble",
    pages: 0,
    moduleSlots: 2,
    beyond: "Au-delà : chaque module supplémentaire 500 à 1 500 €.",
    features: [
      "Architecture & sécurité sur mesure",
      "Connexion, rôles & droits d'accès",
      "Tableau de bord d'administration",
      "2 modules métier au choix",
      "Infrastructure dédiée & sauvegardes",
      "Formation & documentation",
    ],
  },
];

const SITES = ["essentiel", "pro", "dynamique", "ecommerce"];
const ALL = ["essentiel", "pro", "dynamique", "ecommerce", "app"];
const DATA = ["dynamique", "app"];

/**
 * Sections du catalogue. `availableFor` liste les forfaits pour lesquels la
 * section est proposée ; `note` s'affiche quand elle ne l'est pas.
 */
export const GROUPS = [
  {
    id: "pages",
    title: "Pages & structure",
    availableFor: SITES,
  },
  {
    id: "vitrine",
    title: "Fonctionnalités vitrine",
    availableFor: SITES,
  },
  {
    id: "modules",
    title: "Modules métier",
    intro:
      "Un module est une brique fonctionnelle complète : ses écrans, sa base de données, ses droits d'accès et ses tests. " +
      "Les premiers modules cochés occupent les modules inclus dans votre socle.",
    availableFor: DATA,
    lockedNote:
      "Les modules métier nécessitent le Site Dynamique ou l'Application sur mesure.",
    unlockWith: "dynamique",
  },
  {
    id: "ecommerce",
    title: "Options e-commerce",
    intro:
      "50 produits, paiement CB, 1 mode de livraison, commandes, stocks et comptes clients sont déjà inclus dans le forfait E-commerce.",
    availableFor: ["ecommerce"],
    lockedNote: "Les options boutique s'ajoutent au forfait E-commerce.",
    unlockWith: "ecommerce",
  },
  {
    id: "integrations",
    title: "Intégrations & données",
    availableFor: ["dynamique", "ecommerce", "app"],
  },
  {
    id: "design",
    title: "Design & identité visuelle",
    availableFor: ALL,
  },
  {
    id: "content",
    title: "Contenu & référencement",
    availableFor: SITES,
  },
];

/**
 * Options du catalogue.
 * - price : montant HT (unitaire quand `unit` est défini)
 * - unit  : libellé de l'unité (la quantité devient réglable)
 * - from  : « à partir de » — le montant est un minimum
 * - includedIn : forfaits où l'option fait déjà partie du socle
 * - availableFor : restreint l'option à certains forfaits (défaut : ceux de la section)
 * - moduleSlot : peut occuper un module inclus dans le socle
 * - calc : calcul spécifique (multilingue)
 */
export const OPTIONS = [
  /* ---------- PAGES & STRUCTURE ---------- */
  {
    id: "page_supp",
    group: "pages",
    name: "Page supplémentaire",
    desc: "Page complète intégrée au design, avec ses contenus et son référencement.",
    price: 120,
    unit: "page",
  },
  {
    id: "landing",
    group: "pages",
    name: "Page d'atterrissage (landing page)",
    desc: "Page unique orientée conversion : campagne, offre, événement.",
    price: 350,
    unit: "page",
  },
  {
    id: "section_supp",
    group: "pages",
    name: "Section supplémentaire sur une page",
    desc: "Bloc ajouté à une page existante (tarifs, équipe, chiffres clés…).",
    price: 60,
    unit: "section",
  },
  {
    id: "multilingue",
    group: "pages",
    name: "Site multilingue",
    desc: "Structure multilingue + sélecteur de langue, puis 60 € par page traduite et par langue.",
    price: 350,
    priceLabel: "350 € + 60 €/page",
    quantities: [
      { key: "langues", label: "langue(s) supplémentaire(s)", min: 1, max: 10, def: 1 },
      { key: "pages", label: "page(s) traduite(s) par langue", min: 1, max: 60, def: pkg => pkg.pages || 4 },
    ],
    calc: q => 350 + 60 * q.langues * q.pages,
  },

  /* ---------- FONCTIONNALITÉS VITRINE ---------- */
  {
    id: "form_avance",
    group: "vitrine",
    name: "Formulaire avancé",
    desc: "Multi-étapes, pièces jointes, demande de devis en ligne, calcul automatique.",
    price: 250,
  },
  {
    id: "rdv",
    group: "vitrine",
    name: "Prise de rendez-vous en ligne",
    desc: "Agenda, créneaux, confirmations et rappels automatiques, synchronisation Google Agenda.",
    price: 450,
  },
  {
    id: "blog",
    group: "vitrine",
    name: "Blog / actualités",
    desc: "Espace d'articles que vous gérez vous-même, catégories, partage réseaux sociaux.",
    price: 300,
    includedIn: ["pro", "dynamique"],
  },
  {
    id: "galerie",
    group: "vitrine",
    name: "Galerie ou portfolio",
    desc: "Albums, filtres par catégorie, plein écran.",
    price: 150,
    includedIn: ["pro", "dynamique"],
  },
  {
    id: "avis",
    group: "vitrine",
    name: "Avis clients & témoignages",
    desc: "Affichage, connexion aux avis Google.",
    price: 150,
    includedIn: ["pro", "dynamique"],
  },
  {
    id: "newsletter",
    group: "vitrine",
    name: "Newsletter & fenêtre d'inscription",
    desc: "Formulaire d'abonnement connecté à votre outil d'emailing (Brevo, Mailchimp…).",
    price: 150,
  },
  {
    id: "paiement_simple",
    group: "vitrine",
    name: "Paiement en ligne simple",
    desc: "Acomptes, cartes cadeaux, quelques produits ou services (sans boutique complète).",
    price: 400,
    availableFor: ["essentiel", "pro", "dynamique"],
  },
  {
    id: "membres",
    group: "vitrine",
    name: "Espace membres / connexion sécurisée",
    desc: "Inscription, connexion, pages réservées, profil utilisateur.",
    price: 600,
    includedIn: ["dynamique", "ecommerce"],
  },
  {
    id: "chatbot",
    group: "vitrine",
    name: "Assistant conversationnel IA",
    desc: "Répond aux questions 24h/24, entraîné sur votre activité, vos documents et votre FAQ.",
    price: 600,
    from: true,
  },
  {
    id: "animations",
    group: "vitrine",
    name: "Animations avancées",
    desc: "Effets au défilement, transitions, illustrations animées.",
    price: 300,
  },
  {
    id: "pwa_site",
    group: "vitrine",
    name: "Application mobile installable (PWA)",
    desc: "Votre site s'installe comme une application sur téléphone, fonctionne hors ligne.",
    price: 500,
    availableFor: ["essentiel", "pro", "ecommerce"],
  },

  /* ---------- MODULES MÉTIER ---------- */
  {
    id: "mod_data",
    group: "modules",
    name: "Module de données simple",
    desc: "Fiches, liste, recherche, filtres, tri, export Excel/CSV (annuaire, catalogue interne, liste de matériel…).",
    price: 600,
    moduleSlot: true,
  },
  {
    id: "mod_workflow",
    group: "modules",
    name: "Module avec workflow",
    desc: "Idem + statuts, étapes de validation, historique, alertes (demandes, dossiers, tickets…).",
    price: 1200,
    moduleSlot: true,
  },
  {
    id: "mod_crm",
    group: "modules",
    name: "Gestion des contacts (CRM)",
    desc: "Clients, prospects, entreprises, historique des échanges, étiquettes, import de contacts.",
    price: 900,
    moduleSlot: true,
  },
  {
    id: "mod_pipeline",
    group: "modules",
    name: "Pipeline commercial",
    desc: "Vue kanban des opportunités, étapes, montants, relances, prévisions.",
    price: 1200,
    moduleSlot: true,
  },
  {
    id: "mod_devis",
    group: "modules",
    name: "Devis & factures",
    desc: "Création, génération PDF, numérotation légale, envoi par email, suivi des paiements, relances.",
    price: 1500,
    moduleSlot: true,
  },
  {
    id: "mod_taches",
    group: "modules",
    name: "Gestion de tâches & projets",
    desc: "Tâches, échéances, responsables, vue liste et kanban, commentaires.",
    price: 900,
    moduleSlot: true,
  },
  {
    id: "mod_agenda",
    group: "modules",
    name: "Agenda & planning partagé",
    desc: "Calendrier d'équipe, ressources, créneaux, synchronisation Google / Outlook.",
    price: 800,
    moduleSlot: true,
  },
  {
    id: "mod_reservations",
    group: "modules",
    name: "Réservations en ligne",
    desc: "Prise de réservation par vos clients, disponibilités, confirmations, annulations, rappels.",
    price: 800,
    moduleSlot: true,
  },
  {
    id: "mod_inventaire",
    group: "modules",
    name: "Inventaire & stocks",
    desc: "Entrées / sorties, seuils d'alerte, emplacements, historique des mouvements, code-barres.",
    price: 1200,
    moduleSlot: true,
  },
  {
    id: "mod_ged",
    group: "modules",
    name: "Documents & fichiers (GED)",
    desc: "Dépôt, classement, aperçu, partage sécurisé, versions.",
    price: 500,
    moduleSlot: true,
  },
  {
    id: "mod_portail",
    group: "modules",
    name: "Portail client externe",
    desc: "Espace où vos clients consultent leurs documents, commandes, factures, tickets.",
    price: 900,
    moduleSlot: true,
  },
  {
    id: "mod_reporting",
    group: "modules",
    name: "Tableaux de bord & reporting",
    desc: "Indicateurs clés, graphiques, filtres par période, export PDF.",
    price: 900,
    moduleSlot: true,
  },
  {
    id: "mod_roles",
    group: "modules",
    name: "Rôles & permissions avancés",
    desc: "Équipes, niveaux d'accès fins, journal des actions (au-delà de admin / utilisateur).",
    price: 500,
    moduleSlot: true,
  },
  {
    id: "mod_notif",
    group: "modules",
    name: "Notifications email & SMS",
    desc: "Alertes automatiques selon événements, modèles personnalisables.",
    price: 300,
    moduleSlot: true,
  },
  {
    id: "mod_signature",
    group: "modules",
    name: "Signature électronique",
    desc: "Signature de devis, contrats ou bons de commande directement en ligne.",
    price: 500,
    moduleSlot: true,
  },
  {
    id: "mod_ia",
    group: "modules",
    name: "Module IA",
    desc: "Assistant interne, résumé de documents, classification automatique, extraction de données.",
    price: 800,
    from: true,
    moduleSlot: true,
  },

  /* ---------- OPTIONS E-COMMERCE ---------- */
  {
    id: "produits_supp",
    group: "ecommerce",
    name: "Produits supplémentaires",
    desc: "Par tranche de 50 produits mis en ligne (fiches, photos, catégories).",
    price: 150,
    unit: "tranche de 50 produits",
    unitShort: "50 produits",
  },
  {
    id: "variantes",
    group: "ecommerce",
    name: "Variantes de produits",
    desc: "Tailles, couleurs, options avec prix et stocks distincts.",
    price: 300,
  },
  {
    id: "livraison_supp",
    group: "ecommerce",
    name: "Mode de livraison supplémentaire",
    desc: "Transporteur, tarifs par zone ou poids, suivi de colis.",
    price: 150,
    unit: "mode",
  },
  {
    id: "promo",
    group: "ecommerce",
    name: "Codes promo & offres",
    desc: "Réductions, codes, offres groupées, ventes flash.",
    price: 200,
  },
  {
    id: "avis_produits",
    group: "ecommerce",
    name: "Avis produits",
    desc: "Notes et commentaires clients, modération.",
    price: 200,
  },
  {
    id: "factures_auto",
    group: "ecommerce",
    name: "Factures automatiques",
    desc: "Génération et envoi de la facture PDF à chaque commande.",
    price: 300,
  },
  {
    id: "abonnements",
    group: "ecommerce",
    name: "Abonnements & paiements récurrents",
    desc: "Box, adhésions, prélèvements mensuels, gestion des échecs de paiement.",
    price: 600,
  },
  {
    id: "multidevise",
    group: "ecommerce",
    name: "Multi-devises / multi-pays",
    desc: "Devises, taxes et livraisons selon le pays.",
    price: 400,
  },
  {
    id: "sync_stock",
    group: "ecommerce",
    name: "Synchronisation avec un stock physique",
    desc: "Connexion à votre caisse ou logiciel de stock existant.",
    price: 800,
  },
  {
    id: "marketplace",
    group: "ecommerce",
    name: "Place de marché (multi-vendeurs)",
    desc: "Plusieurs vendeurs, commissions, espaces vendeurs.",
    price: 1500,
    from: true,
  },

  /* ---------- INTÉGRATIONS & DONNÉES ---------- */
  {
    id: "integration",
    group: "integrations",
    name: "Connexion à un logiciel tiers",
    desc: "Par intégration : comptabilité, caisse, CRM existant, Google, Microsoft, paiement, SMS…",
    price: 600,
    unit: "intégration",
  },
  {
    id: "import",
    group: "integrations",
    name: "Import / migration de données",
    desc: "Reprise de vos fichiers Excel ou de votre ancien logiciel, nettoyage, contrôle.",
    price: 400,
    from: true,
  },
  {
    id: "api",
    group: "integrations",
    name: "Interface de programmation (API)",
    desc: "Pour connecter vos autres outils à votre application, avec documentation.",
    price: 800,
  },
  {
    id: "pwa_app",
    group: "integrations",
    name: "Application mobile installable (PWA)",
    desc: "Utilisation sur téléphone comme une vraie application, notifications, mode hors ligne.",
    price: 800,
    availableFor: ["dynamique", "app"],
  },
  {
    id: "automation",
    group: "integrations",
    name: "Automatisation",
    desc: "Par scénario : relance automatique, envoi de rapport, synchronisation, génération de documents.",
    price: 400,
    unit: "scénario",
  },

  /* ---------- DESIGN & IDENTITÉ ---------- */
  {
    id: "maquette",
    group: "design",
    name: "Maquette graphique sur mesure",
    desc: "Maquettes validées avant développement, 2 séries de retours.",
    price: 400,
    includedIn: ["pro", "dynamique"],
  },
  {
    id: "logo",
    group: "design",
    name: "Logo",
    desc: "3 propositions, 2 séries de retours, fichiers dans tous les formats.",
    price: 350,
  },
  {
    id: "identite",
    group: "design",
    name: "Identité visuelle complète",
    desc: "Logo, palette, typographies, charte graphique, déclinaisons réseaux sociaux.",
    price: 700,
  },
  {
    id: "visuels",
    group: "design",
    name: "Visuels & bannières",
    desc: "Visuel créé sur mesure (bannière, illustration, image de partage).",
    price: 40,
    unit: "visuel",
  },

  /* ---------- CONTENU & RÉFÉRENCEMENT ---------- */
  {
    id: "redaction",
    group: "content",
    name: "Rédaction des textes",
    desc: "Textes professionnels optimisés pour Google, relus et validés avec vous.",
    price: 80,
    unit: "page",
  },
  {
    id: "traduction",
    group: "content",
    name: "Traduction",
    desc: "Traduction professionnelle d'une page dans une langue.",
    price: 60,
    unit: "page",
  },
  {
    id: "seo_local",
    group: "content",
    name: "Référencement local",
    desc: "Fiche Google Business, annuaires, avis, positionnement sur votre ville.",
    price: 200,
  },
  {
    id: "seo_audit",
    group: "content",
    name: "Audit & optimisation SEO",
    desc: "Analyse technique, mots-clés, plan d'actions et corrections.",
    price: 300,
  },
  {
    id: "seo_mensuel",
    group: "content",
    name: "Référencement mensuel",
    desc: "Suivi des positions, 1 article par mois, optimisation continue.",
    price: 150,
    monthly: true,
  },
];

/** Forfaits de maintenance (exclusifs entre eux). `suggestedFor` : présélection selon le forfait. */
export const MAINTENANCE = [
  {
    id: "serenite_vitrine",
    name: "Sérénité — site vitrine",
    desc: "Hébergement, sauvegardes, mises à jour de sécurité, support email, 30 min de modifications / mois.",
    price: 29,
    suggestedFor: ["essentiel", "pro"],
  },
  {
    id: "serenite_dynamique",
    name: "Sérénité — site dynamique",
    desc: "Idem + surveillance base de données & disponibilité, 1 h de modifications / mois.",
    price: 59,
    suggestedFor: ["dynamique"],
  },
  {
    id: "serenite_ecommerce",
    name: "Sérénité — e-commerce",
    desc: "Idem + suivi des paiements, support prioritaire, 1 h de modifications / mois.",
    price: 99,
    suggestedFor: ["ecommerce"],
  },
  {
    id: "infra_app",
    name: "Infrastructure dédiée — application",
    desc: "Serveur dédié, sauvegardes quotidiennes, supervision, mises à jour, 2 h de support / mois.",
    price: 129,
    from: true,
    suggestedFor: ["app"],
  },
];

/** Services mensuels additionnels. */
export const EXTRAS = [
  {
    id: "email_pro",
    name: "Adresse email professionnelle",
    desc: "contact@votre-entreprise.fr, agenda et stockage inclus.",
    price: 5,
    unit: "boîte",
    monthly: true,
  },
];

/** Lignes informatives, non simulées. */
export const INFO_SERVICES = [
  { name: "Nom de domaine", desc: "Offert la première année, puis renouvellement annuel.", priceLabel: "15 € / an" },
  { name: "Modifications hors forfait", desc: "Évolutions demandées après livraison, facturées au temps passé ou sur devis.", priceLabel: "60 € / heure" },
  { name: "Refonte d'un site existant", desc: "Reprise des contenus, nouveau design, migration, redirections — remise de 20 % sur le forfait visé.", priceLabel: "à partir de 690 €" },
];

/** Ajustements globaux. */
export const MODIFIERS = [
  {
    id: "redesign",
    name: "Refonte d'un site existant",
    desc: "Reprise des contenus, nouveau design, migration et redirections : remise de 20 % sur le forfait.",
    effect: "−20 % sur le forfait",
  },
  {
    id: "rush",
    name: "Délai réduit de moitié",
    desc: "Livraison deux fois plus rapide que le planning indiqué.",
    effect: "+25 % sur le projet",
  },
  {
    id: "complex",
    name: "Règles métier particulières",
    desc: "Calculs complexes, validations multi-niveaux : +30 à 50 % sur le module concerné. Le simulateur compte +30 %.",
    effect: "+30 % sur les modules",
    availableFor: DATA,
  },
];

/** Exemples de devis (page 5 de la grille), rejouables dans le simulateur. */
export const PRESETS = [
  {
    id: "artisan",
    title: "Artisan",
    subtitle: "plombier, électricien…",
    desc: "Être trouvé sur Google et recevoir des demandes de devis.",
    pkg: "essentiel",
    options: { form_avance: 1, seo_local: 1 },
    maintenance: "serenite_vitrine",
    total: 1340,
  },
  {
    id: "restaurant",
    title: "Restaurant",
    subtitle: "carte & réservation",
    desc: "Un site élégant, la carte, et la réservation de tables en ligne.",
    pkg: "pro",
    options: { rdv: 1, multilingue: { langues: 1, pages: 8 } },
    maintenance: "serenite_vitrine",
    total: 2770,
  },
  {
    id: "association",
    title: "Cabinet, salle de sport, association",
    subtitle: "espace adhérents",
    desc: "Un site avec espace adhérents, planning et réservation de créneaux.",
    pkg: "dynamique",
    options: { mod_reservations: 1, mod_agenda: 1, mod_portail: 1, mod_notif: 1 },
    maintenance: "serenite_dynamique",
    total: 4900,
  },
  {
    id: "crm",
    title: "PME — outil commercial (CRM)",
    subtitle: "devis, factures, compta",
    desc: "Suivre les prospects, faire les devis et factures, connecté à la compta.",
    pkg: "app",
    options: { mod_crm: 1, mod_pipeline: 1, mod_devis: 1, integration: 1, import: 1, mod_reporting: 1 },
    maintenance: "infra_app",
    total: 8400,
  },
  {
    id: "boutique",
    title: "Boutique en ligne",
    subtitle: "150 produits, variantes",
    desc: "150 produits avec tailles et couleurs, livraison Colissimo et Mondial Relay.",
    pkg: "ecommerce",
    options: { produits_supp: 2, variantes: 1, livraison_supp: 1, promo: 1, avis_produits: 1 },
    maintenance: "serenite_ecommerce",
    total: 4650,
  },
  {
    id: "stock",
    title: "Entreprise — stock & interventions",
    subtitle: "techniciens sur mobile",
    desc: "Suivre le matériel, les interventions et les demandes des techniciens sur mobile.",
    pkg: "app",
    options: { mod_inventaire: 1, mod_workflow: 1, pwa_app: 1, mod_ged: 1, mod_roles: 1, automation: 1 },
    maintenance: "infra_app",
    total: 7200,
  },
];

export const TERMS = {
  howItWorks: [
    "Forfait de base + options du catalogue = prix du projet. Le devis reprend chaque ligne.",
    "Le prix ne change pas en cours de projet, sauf si vous demandez une fonctionnalité qui n'est pas dans le devis : elle est alors chiffrée avec cette grille avant d'être réalisée.",
    "Une fonctionnalité qui n'apparaît pas ici est chiffrée sur devis, en la comparant au module le plus proche.",
  ],
  variations: [
    "Volume de données à reprendre ou à traiter (plus de 10 000 lignes : sur devis).",
    "Nombre d'intégrations avec des logiciels externes (600 € chacune).",
    "Règles métier particulières (calculs complexes, validations multi-niveaux) : +30 à 50 % sur le module.",
    "Délai réduit de moitié par rapport au planning indiqué : +25 %.",
  ],
  conditions: [
    "Devis gratuit, sans engagement, valable 30 jours, détaillé ligne par ligne.",
    "30 % à la commande, 40 % à la validation des maquettes, solde à la livraison. Paiement en 2 ou 3 fois sans frais possible.",
    "Vous restez propriétaire du site, du code, des contenus et du domaine.",
    "Tarifs indicatifs hors taxes.",
  ],
};
