// Calice e Sapere: impaginazione della home su due colonne (laboratorio, 24/11/2026).
// Eseguito da build-tema.js dopo l'aggiunta del tema. Lavora solo su public/index.html.
// Colonna principale: percorso, rubriche, strumenti (e sezioni non riconosciute).
// Colonna laterale: novita, vino della settimana, frase, in vigna questo mese, app.
// Sul telefono il CSS rimette tutto su una colonna, con la laterale in fondo.
// Se manca il percorso o qualcosa non torna, la pagina resta com'era. Nessun backslash.
// Dal 24/11/2026 (punto 2 del confronto con Quanta): ogni scheda delle rubriche riceve la riga della firma
// sotto il titolo, presa dai dati strutturati (JSON-LD Article) della pagina dell'articolo:
// autore Person -> "Di Nome"; altrimenti "Dalla Redazione" (scelta di Massimo). Data: datePublished, se manca dateModified.
const fs = require("fs");
const path = require("path");

function sezioni(h, da, a) {
  const out = [];
  let i = da;
  while (true) {
    const s = h.indexOf("<section", i);
    if (s < 0 || s >= a) break;
    const e = h.indexOf("</section>", s);
    if (e < 0 || e >= a) break;
    const interno = h.slice(s + 8, e);
    if (interno.indexOf("<section") >= 0) return null; // sezioni annidate: non tocco nulla
    out.push({ s: s, e: e + 10, t: h.slice(s, e + 10) });
    i = e + 10;
  }
  return out;
}

function tipo(t) {
  const apertura = t.slice(0, t.indexOf(">") + 1);
  if (t.indexOf('id="tiles"') >= 0) return "percorso";
  if (apertura.indexOf("rubriche-home") >= 0) return "rubriche";
  if (t.indexOf("Strumenti di studio") >= 0) return "strumenti";
  if (apertura.indexOf("vino-home") >= 0) return "vino";
  if (apertura.indexOf("novita") >= 0) return "novita";
  if (t.indexOf("In vigna questo mese") >= 0) return "invigna";
  if (t.indexOf("La frase della settimana") >= 0) return "frase";
  if (apertura.indexOf("qs-home") >= 0) return "quiz";
  if (t.indexOf("ca-shot") >= 0 && t.indexOf('href="/cantinapp"') >= 0) return "cantinapp";
  return "altro";
}

// Nella colonna laterale il titolo di ogni blocco diventa un link alla stessa pagina del primo pulsante del blocco
// (24/11/2026, segnalato da Massimo: "molti titoli non risultano cliccabili").
function titoloCliccabile(t) {
  const a = t.indexOf("<h2");
  if (a < 0) return t;
  const b = t.indexOf("</h2>", a);
  if (b < 0) return t;
  const h2 = t.slice(a, b + 5);
  if (h2.indexOf("<a ") >= 0) return t;
  const m = /<a [^>]*class=.btn[^>]*href=.([^"' >]+)|<a [^>]*href=.([^"' >]+)[^>]*class=.btn/.exec(t);
  const href = m ? (m[1] || m[2]) : "";
  if (!href || href.indexOf("http") === 0) return t;
  const apre = h2.indexOf(">") + 1;
  const nuovo = h2.slice(0, apre) + '<a class="lato-tit" href="' + href + '">' + h2.slice(apre, h2.length - 5) + "</a></h2>";
  return pulsanti(t.slice(0, a) + nuovo + t.slice(b + 5), href);
}

// Uno standard solo per la colonna laterale, come su Quanta: niente pulsanti.
// Il pulsante che porta dove porta gia il titolo sparisce; gli altri (archivio, app) diventano
// un link di servizio uniforme "lato-piu" (maiuscoletto, freccia rossa).
function pulsanti(t, hrefTitolo) {
  return t.replace(/<a [^>]*>[^<]*<[/]a>/g, function (x) {
    const apertura = x.slice(0, x.indexOf(">") + 1);
    if (!/class=.[^"']*btn/.test(apertura)) return x;
    const m = /href=["']([^"']+)["']/.exec(apertura);
    const href = m ? m[1] : "";
    if (href === hrefTitolo) return "";
    return x.replace(/class=["'][^"']*["']/, 'class="lato-piu"');
  });
}

function impagina(h) {
  const m1 = h.indexOf("<main>");
  const m2 = h.indexOf("</main>");
  if (m1 < 0 || m2 < 0) return { h: h, esito: "saltata: main non trovato" };
  const lista = sezioni(h, m1, m2);
  if (!lista || !lista.length) return { h: h, esito: "saltata: sezioni non riconosciute" };
  const per = {};
  const altre = [];
  for (const x of lista) {
    const k = tipo(x.t);
    if (k === "altro" || per[k]) altre.push(x.t); else per[k] = x.t;
  }
  if (!per.percorso) return { h: h, esito: "saltata: percorso non trovato" };
  const principale = [per.percorso, per.rubriche, per.strumenti].concat(altre).filter(Boolean).join("");
  const novita = per.novita ? per.novita.split('<a href="/novita">').join('<a class="lato-piu" href="/novita">') : "";
  const laterale = [novita, per.vino, per.frase, per.invigna, per.cantinapp, per.quiz].filter(Boolean).map(titoloCliccabile).join("");
  const blocco = '<div class="home-grid"><div class="home-main">' + principale + '</div><aside class="home-lato" aria-label="In evidenza">' + laterale + "</aside></div>";
  // tolgo le sezioni dalla fine all'inizio, poi metto il blocco al posto della prima
  let out = h;
  for (let j = lista.length - 1; j >= 0; j--) out = out.slice(0, lista[j].s) + (j === 0 ? blocco : "") + out.slice(lista[j].e);
  const usate = Object.keys(per);
  return { h: out, esito: "ok: principale " + [per.percorso && "percorso", per.rubriche && "rubriche", per.strumenti && "strumenti"].filter(Boolean).join(", ") + (altre.length ? " + " + altre.length + " altre" : "") + "; laterale " + usate.filter(k => ["novita", "vino", "frase", "invigna", "cantinapp", "quiz"].indexOf(k) >= 0).join(", ") };
}

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
function dataIt(d) {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(String(d || ""));
  if (!m) return "";
  return Number(m[3]) + " " + MESI[Number(m[2]) - 1] + " " + m[1];
}
function esc(t) { return String(t).split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;"); }

// Legge dalla pagina dell'articolo l'autore e la data dai dati strutturati.
function datiArticolo(PUB, href) {
  const pulito = href.split("#")[0].split("?")[0].replace(/[/]+$/, "");
  const prove = [path.join(PUB, pulito + ".html"), path.join(PUB, pulito, "index.html")];
  const f = prove.find(p => fs.existsSync(p));
  if (!f) return null;
  const h = fs.readFileSync(f, "utf8");
  // tutti i blocchi JSON-LD, qualunque siano gli altri attributi del tag script
  const parti = h.split("application/ld+json");
  let trovato = null;
  for (let i = 1; i < parti.length; i++) {
    const inizio = parti[i].indexOf(">") + 1;
    const testo = parti[i].slice(inizio, parti[i].indexOf("</script>"));
    try {
      const j = JSON.parse(testo);
      if (j["@type"] !== "Article") continue;
      const a = j.author;
      const nome = a && a["@type"] === "Person" && a.name ? a.name : "";
      const dati = { nome: nome, data: dataIt(j.datePublished || j.dateModified) };
      if (nome) return dati; // un autore dichiarato vale piu di un blocco senza autore
      if (!trovato) trovato = dati;
    } catch (e) {}
  }
  const esito = trovato || { nome: "", data: "" };
  if (!esito.data) esito.data = dataDaContenuti(pulito);
  return esito;
}

// Riserva per la data (25/11/2026): se la pagina non ha datePublished nei dati strutturati
// (oggi Voci del vino), la prende dal campo "data" (AAAA-MM-GG) del file sorgente content/<cartella>/<slug>.json.
function dataDaContenuti(href) {
  try {
    const slug = href.split("/").pop();
    if (!slug || !fs.existsSync("content")) return "";
    for (const cartella of fs.readdirSync("content")) {
      const f = path.join("content", cartella, slug + ".json");
      if (!fs.existsSync(f)) continue;
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      const d = dataIt(j.data);
      if (d) return d;
    }
  } catch (e) {}
  return "";
}

function firme(PUB, h) {
  const r = { firmate: 0, redazione: 0, senza_pagina: 0 };
  const pezzi = h.split('<article class="rub-card">');
  for (let i = 1; i < pezzi.length; i++) {
    const p = pezzi[i];
    if (p.indexOf("rub-firma") >= 0) continue;
    const fineH3 = p.indexOf("</h3>");
    const m = /<h3><a href="([^"]+)"/.exec(p);
    if (fineH3 < 0 || !m) { r.senza_pagina++; continue; }
    const d = datiArticolo(PUB, m[1]);
    if (!d) { r.senza_pagina++; continue; }
    const chi = d.nome ? "Di " + esc(d.nome) : "Dalla Redazione";
    if (d.nome) r.firmate++; else r.redazione++;
    const riga = '<p class="rub-firma">' + chi + (d.data ? ' <span aria-hidden="true">·</span> ' + d.data : "") + "</p>";
    pezzi[i] = p.slice(0, fineH3 + 5) + riga + p.slice(fineH3 + 5);
  }
  return { h: pezzi.join('<article class="rub-card">'), esito: r };
}


// Calice animato nell'apertura della home (25/11/2026, scelta di Massimo): calice da degustazione a tulipano
// che passa da bollicine a bianco, rosato e rosso (ordine di servizio). Sostituisce il flute della fascia
// "Il vino della settimana", che viene tolto. Colori e movimento sono in tema.css (blocco .calice-anim).
const CALICE_SVG = '<svg viewBox="270 50 140 300" role="presentation" focusable="false">' +
  '<defs><clipPath id="calice-coppa"><path d="M305 60 C300 100 285 130 290 160 C295 190 320 207 340 207 C360 207 385 190 390 160 C395 130 380 100 375 60 Z"/></clipPath></defs>' +
  '<g clip-path="url(#calice-coppa)"><rect class="cal-liq" x="280" y="135" width="120" height="80"/>' +
  '<ellipse class="cal-sup" cx="340" cy="135" rx="49" ry="5"/>' +
  '<g class="cal-bol"><circle cx="330" cy="200" r="1.8"/><circle cx="344" cy="198" r="1.4"/><circle cx="352" cy="202" r="1.6"/><circle cx="338" cy="203" r="1.2"/><circle cx="324" cy="196" r="1.3"/></g></g>' +
  '<path class="cal-vetro" d="M305 60 C300 100 285 130 290 160 C295 190 320 207 340 207 C360 207 385 190 390 160 C395 130 380 100 375 60"/>' +
  '<path class="cal-vetro" d="M340 207 L340 298"/><ellipse class="cal-vetro" cx="340" cy="302" rx="44" ry="7"/>' +
  '<text x="340" y="336" class="cal-n cal-n1">Bollicine</text><text x="340" y="336" class="cal-n cal-n2">Bianco</text>' +
  '<text x="340" y="336" class="cal-n cal-n3">Rosato</text><text x="340" y="336" class="cal-n cal-n4">Rosso</text></svg>';

function calice(h) {
  const r = { aggiunto: false, flute_tolto: false };
  const home = h.indexOf('id="p-home"');
  const txt = home >= 0 ? h.indexOf('<div class="txt"', home) : -1;
  if (txt >= 0 && h.indexOf("calice-anim") < 0) {
    h = h.slice(0, txt) + '<div class="calice-anim" aria-hidden="true">' + CALICE_SVG + "</div>" + h.slice(txt);
    r.aggiunto = true;
  }
  const v = /<div class="vglass"[^>]*><[/]div>/;
  if (v.test(h)) { h = h.replace(v, ""); r.flute_tolto = true; }
  return { h: h, esito: r };
}

module.exports = function (PUB) {
  const f = path.join(PUB, "index.html");
  if (!fs.existsSync(f)) return "saltata: index.html mancante";
  const h = fs.readFileSync(f, "utf8");
  if (h.indexOf("home-grid") >= 0) return "gia presente";
  const r = impagina(h);
  let esito = r.esito;
  let out = r.h;
  try {
    const fr = firme(PUB, out);
    out = fr.h;
    esito += "; firme " + JSON.stringify(fr.esito);
  } catch (e) { esito += "; firme: errore " + String(e && e.message || e); }
  try {
    const c = calice(out);
    out = c.h;
    esito += "; calice " + JSON.stringify(c.esito);
  } catch (e) { esito += "; calice: errore " + String(e && e.message || e); }
  if (out !== h) fs.writeFileSync(f, out);
  return esito;
};
module.exports.impagina = impagina;
module.exports.firme = firme;
module.exports.calice = calice;
