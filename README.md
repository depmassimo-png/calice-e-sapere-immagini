# Calice e Sapere – immagini

Illustrazioni del sito [caliceesapere.it](https://caliceesapere.it), tema "rivista illustrata".

- `tema/` contiene le versioni pronte per il web (AVIF), ricavate dagli originali Krea 3 (2368×1776 per le tessere 4:3, 3136×1344 per le aperture 21:9).
- Tessere della home: 1200 px di larghezza. Aperture delle pagine: 2400 px. `a-bollicine` è il pupitre 4:3 a 1600 px.
- `hero.avif` è l'apertura della home (Gemini, ingrandita 4x con Krea Enhancer).

Il sito non legge le immagini da qui quando qualcuno lo visita: durante la costruzione su Vercel, `build-tema.js` le scarica (a un commit preciso) e le copia in `/img/tema/`.

Le immagini sono del sito Calice e Sapere: non riutilizzarle senza permesso.
