/**
 * Openbaarheid onder de Archiefwet 2026 (Stb. 2026, 149) en de
 * Archiefregeling 2026 (Stcrt. 2026, 40895).
 *
 * Artikel 2.12 van de Archiefregeling: uiterlijk bij overbrenging liggen vast
 * (a) de status openbaar of beperkt openbaar, (b) de duur van de beperking,
 * (c) de datum waarop die afloopt en (d) de grond uit artikel 7.2 van de wet.
 * De assistent vraagt het al bij het vastleggen, als de medewerker het stuk
 * nog kent. Geldt niet voor stukken van vóór de inwerkingtreding (art. 8.2).
 *
 * Artikel 7.4 van de wet: een beperking geldt niet meer voor documenten ouder
 * dan 75 jaar (Kroon, Staat, internationale betrekkingen), 110 jaar
 * (bijzondere en strafrechtelijke persoonsgegevens, identificatienummers,
 * persoonlijke levenssfeer) of anders 20 jaar. De termijn loopt vanaf de
 * datum van het document (opmaak of ontvangst).
 */

export const OPENBAAR = "openbaar";
export const BEPERKT_OPENBAAR = "beperkt openbaar";
export const OPENBAARHEID = [OPENBAAR, BEPERKT_OPENBAAR] as const;

export interface Beperkingsgrond {
  /** Artikel 7.2, lid en onderdeel, zoals "7.2 lid 1 onder d". */
  artikel: string;
  omschrijving: string;
  /** Lid 1: altijd beperken; lid 2: tenzij het belang van openbaarheid zwaarder weegt. */
  absoluut: boolean;
  /** Artikel 7.4: de beperking vervalt als het document ouder is dan zoveel jaar. */
  maxJaren: 20 | 75 | 110;
}

export const BEPERKINGSGRONDEN: readonly Beperkingsgrond[] = [
  { artikel: "7.2 lid 1 onder a", omschrijving: "eenheid van de Kroon", absoluut: true, maxJaren: 75 },
  { artikel: "7.2 lid 1 onder b", omschrijving: "veiligheid van de Staat", absoluut: true, maxJaren: 75 },
  { artikel: "7.2 lid 1 onder c", omschrijving: "vertrouwelijk verstrekte bedrijfs- en fabricagegegevens", absoluut: true, maxJaren: 20 },
  { artikel: "7.2 lid 1 onder d", omschrijving: "bijzondere of strafrechtelijke persoonsgegevens", absoluut: true, maxJaren: 110 },
  { artikel: "7.2 lid 1 onder e", omschrijving: "wettelijke identificatienummers", absoluut: true, maxJaren: 110 },
  { artikel: "7.2 lid 2 onder a", omschrijving: "betrekkingen met andere staten en internationale organisaties", absoluut: false, maxJaren: 75 },
  { artikel: "7.2 lid 2 onder b", omschrijving: "economische of financiële belangen van de overheid", absoluut: false, maxJaren: 20 },
  { artikel: "7.2 lid 2 onder c", omschrijving: "opsporing en vervolging van strafbare feiten", absoluut: false, maxJaren: 20 },
  { artikel: "7.2 lid 2 onder d", omschrijving: "inspectie, controle en toezicht", absoluut: false, maxJaren: 20 },
  { artikel: "7.2 lid 2 onder e", omschrijving: "eerbiediging van de persoonlijke levenssfeer", absoluut: false, maxJaren: 110 },
  { artikel: "7.2 lid 2 onder f", omschrijving: "overige concurrentiegevoelige bedrijfs- en fabricagegegevens", absoluut: false, maxJaren: 20 },
  { artikel: "7.2 lid 2 onder g", omschrijving: "veiligheid van personen en bedrijven, voorkomen van sabotage", absoluut: false, maxJaren: 20 },
  { artikel: "7.2 lid 2 onder h", omschrijving: "goed functioneren van de Staat of andere publiekrechtelijke organen", absoluut: false, maxJaren: 20 },
];

/** De waarde in de keuzelijst: "art. 7.2 lid 1 onder d — bijzondere of strafrechtelijke persoonsgegevens". */
export const grondWaarde = (g: Beperkingsgrond): string => `art. ${g.artikel} — ${g.omschrijving}`;

export const BEPERKINGSGROND_WAARDEN: readonly string[] = BEPERKINGSGRONDEN.map(grondWaarde);

export function beperkingsgrond(waarde: string | undefined | null): Beperkingsgrond | undefined {
  return waarde ? BEPERKINGSGRONDEN.find((g) => grondWaarde(g) === waarde) : undefined;
}

/**
 * De datum waarop de beperking afloopt: de datum van het document plus de
 * duur in jaren (artikel 7.4 rekent met de ouderdom van het document).
 * Ongeldige invoer: undefined.
 */
export function einddatumBeperking(documentdatum: string, jaren: number): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(documentdatum);
  if (!m || !Number.isInteger(jaren) || jaren < 1 || jaren > 110) return undefined;
  const jaar = Number(m[1]) + jaren;
  // 29 februari bestaat niet in elk jaar: dan 28 februari.
  const dag = m[2] === "02" && m[3] === "29" && !(jaar % 4 === 0 && (jaar % 100 !== 0 || jaar % 400 === 0)) ? "28" : m[3];
  return `${jaar}-${m[2]}-${dag}`;
}
