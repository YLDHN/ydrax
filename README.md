# YDRAx — Theme 1

Landing page concept for YDRAx: Web, IA, Systèmes & Réseaux, Infrastructure.

## Structure

- `index.html` — structure HTML complète
- `styles.css` — design responsive et animations CSS
- `app.js` — réseau animé Canvas, particules, parallax, reveal au scroll et navigation active

## Lancer

Aucune installation n'est nécessaire.

Ouvrir simplement `index.html` dans un navigateur.

Pour un développement local plus propre, utiliser par exemple VS Code + Live Server.

## Personnalisation

Les variables principales sont en haut de `styles.css` :

- `--bg` : fond
- `--text` : texte
- `--accent` : couleur d'accent
- `--container` : largeur maximale

Dans `index.html`, remplacer notamment :

- `contact.ydra@gmail.com`
- les textes des services
- les réalisations
- les statistiques
- les liens de navigation

## Note

Le réseau du Hero est généré en Canvas et ne dépend d'aucune image externe.
La police Inter est chargée depuis Google Fonts lorsque la connexion Internet est disponible.
