# YDRAx — site vitrine

Site multi-pages de YDRAx : Web, IA, Systèmes & Réseaux, Infrastructure.
Statique (HTML / CSS / JS sans build), déployé sur Vercel avec une fonction serverless pour le formulaire de contact.

## Pages

| URL | Fichier | Contenu |
| --- | --- | --- |
| `/` | `index.html` | Accueil : hero animé, expertises, aperçu des tarifs |
| `/services` | `services.html` | Les 4 expertises détaillées et notre approche |
| `/realisations` | `realisations.html` | Réalisations |
| `/tarifs` | `tarifs.html` | Grille tarifaire et **simulateur de prix** |
| `/contact` | `contact.html` | Formulaire de contact (envoi via `/api/contact`) |

Les URL sans extension sont servies grâce à `cleanUrls` dans `vercel.json`.
La grille tarifaire officielle est téléchargeable : `grille-tarifaire-ydrax-2026.pdf`.

## Structure

- `styles.css` — design responsive et animations CSS (variables en tête de fichier)
- `app.js` — navigation, menu mobile, reveal au scroll, formulaire de contact
- `src/globe.js` + `src/components/` — globe réseau 3D du hero (three.js via CDN)
- `src/pricing/data.js` — **la grille tarifaire** (forfaits, options, maintenance, exemples de devis). C'est ici qu'on change un prix.
- `src/pricing/compute.js` — moteur de calcul (inclusions, modules inclus dans le socle, majorations, TVA, encodage de l'état dans l'URL)
- `src/simulateur.js` — interface du simulateur (page `/tarifs`)
- `src/devis-pdf.js` — génération de l'« exemple de devis » PDF filigrané (jsPDF chargé à la demande)
- `api/contact.js` + `api/_mail.js` — envoi des demandes de contact et des estimations (SMTP ou Resend)

Les cartes des forfaits de `tarifs.html` et de l'accueil sont écrites en dur pour le référencement :
si un prix de forfait change dans `data.js`, mettre à jour ces cartes également.

## Lancer en local

```bash
npm run dev        # sert le site sur http://localhost:3000 avec les URL propres
npm test           # vérifie le moteur de calcul contre les exemples de devis de la grille
```

Le formulaire et l'envoi d'estimation nécessitent `vercel dev` (ou le déploiement) pour la fonction `/api/contact`.

## Variables d'environnement (Vercel)

- `SMTP_USER` / `SMTP_PASS` (+ `SMTP_HOST`, `SMTP_PORT` facultatifs) — envoi par SMTP
- `RESEND_API_KEY` — envoi via Resend si SMTP n'est pas configuré
- `MAIL_FROM` — expéditeur affiché (facultatif)
- `ADMIN_EMAIL` — destinataire des demandes (défaut : contact.ydrax@gmail.com)

Une copie de l'estimation est envoyée au visiteur quand le transport l'autorise (SMTP, ou Resend avec un domaine vérifié).
