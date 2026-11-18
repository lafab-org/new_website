// The séances of the site, read at build time from TiBillet, or from a
// local file standing in for it. Only the number of reserved tickets is
// kept from the reservations.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ACCES = ["libre", "sur-place", "réservation-gratuite", "réservation-payante"];
const RESERVEES = [
  "https://schema.org/ReservationConfirmed",
  "https://schema.org/ReservationPending",
];
const ANNULEE = "https://schema.org/EventCancelled";

// The variables of `.env`, without overriding those already set.
if (existsSync(".env")) process.loadEnvFile(".env");

// The day (`2026-12-03`) and the time (`18:00`) of a date-time, in Paris.
const paris = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
function enParis(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`TiBillet : date invalide ${iso}`);
  const p = Object.fromEntries(paris.formatToParts(date).map((x) => [x.type, x.value]));
  return { jour: `${p.year}-${p.month}-${p.day}`, heure: `${p.hour}:${p.minute}` };
}

const resultats = (reponse, quoi) => {
  if (!Array.isArray(reponse?.results)) throw new Error(`TiBillet : ${quoi} illisibles`);
  return reponse.results;
};

// The events of TiBillet and a function giving the reservations of one,
// from a module standing in for TiBillet. It is read anew at each build,
// so that its relative dates follow the day of the build.
async function depuisFichier(chemin) {
  const url = pathToFileURL(resolve(chemin));
  url.search = `?construction=${Date.now()}`;
  const donnees = (await import(url.href)).default;
  const evenements = resultats(donnees.events, "évènements");
  const reservations = donnees.reservations ?? {};
  return {
    evenements,
    reservationsDe: async (id) =>
      reservations[id] === undefined ? [] : resultats(reservations[id], "réservations"),
  };
}

async function depuisApi(url, cle) {
  const base = url.replace(/\/+$/, "");
  const origine = new URL(base).origin;
  // Every result of a list, following its `next` pages, if any, on
  // TiBillet itself only.
  const lire = async (chemin, quoi) => {
    const tous = [];
    let adresse = base + chemin;
    while (adresse) {
      const reponse = await fetch(adresse, {
        headers: { Authorization: `Api-Key ${cle}`, Accept: "application/json" },
      });
      if (!reponse.ok) throw new Error(`TiBillet : ${chemin} a répondu ${reponse.status}`);
      const donnees = await reponse.json();
      tous.push(...resultats(donnees, quoi));
      adresse = donnees.next ? new URL(donnees.next, adresse).href : null;
      if (adresse && new URL(adresse).origin !== origine) {
        throw new Error(`TiBillet : ${chemin} renvoie vers un autre site`);
      }
    }
    return tous;
  };
  const maintenant = Date.now();
  // An event without a valid date is kept, for the checks of the séances.
  const evenements = (await lire("/api/v2/events/?only_futur=1", "évènements"))
    .filter((e) => !(new Date(e.endDate ?? e.startDate).getTime() < maintenant));
  return {
    evenements,
    reservationsDe: async (id) =>
      lire(`/api/v2/reservations/?event=${encodeURIComponent(id)}`, "réservations"),
  };
}

export default async function () {
  const { TIBILLET_FICHIER, TIBILLET_URL, TIBILLET_API_KEY } = process.env;
  let source;
  if (TIBILLET_FICHIER) source = await depuisFichier(TIBILLET_FICHIER);
  else if (TIBILLET_URL && TIBILLET_API_KEY) source = await depuisApi(TIBILLET_URL, TIBILLET_API_KEY);
  else return [];

  const categories = JSON.parse(readFileSync("src/_data/categories.json", "utf8"))
    .map((c) => c.identifiant);
  const pagesEvenement = readdirSync("src/evenements")
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => f.replace(/\.md$/, ""));

  const seances = [];
  for (const e of source.evenements) {
    const mots = Array.isArray(e.keywords) ? e.keywords.map((k) => String(k).normalize("NFC")) : [];
    const categorie = categories.find((c) => mots.includes(c));
    if (categorie === undefined) continue;
    if (!e.name || !e.startDate || !e.url) {
      throw new Error(`TiBillet : l'évènement ${e.identifier} n'a pas de nom, de début ou d'adresse`);
    }
    const debut = enParis(e.startDate);
    const fin = e.endDate ? enParis(e.endDate) : null;
    let reservees = 0;
    for (const r of await source.reservationsDe(e.identifier)) {
      if (!RESERVEES.includes(r.reservationStatus)) continue;
      for (const t of r.reservedTicket ?? []) reservees += Number(t.ticketQuantity) || 0;
    }
    seances.push({
      nom: e.name,
      jour: debut.jour,
      debut: debut.heure,
      fin: fin && fin.jour === debut.jour ? fin.heure : null,
      categorie,
      evenement: mots.find((m) => pagesEvenement.includes(m)) ?? null,
      acces: mots.find((m) => ACCES.includes(m)) ?? null,
      reservation: e.url,
      jauge: e.maximumAttendeeCapacity > 0 ? e.maximumAttendeeCapacity : null,
      reservees,
      annulee: e.eventStatus === ANNULEE,
    });
  }
  return seances.sort((a, b) => (a.jour + a.debut).localeCompare(b.jour + b.debut));
}
