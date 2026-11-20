/**
 * Classificeren en bewaren.
 *
 * Een stuk krijgt een klasse uit de selectielijst: een resultaat binnen een
 * procestype (bijvoorbeeld 12.2.3 "Handhaving uitgevoerd"). Daaruit volgen de
 * waardering (vernietigen of blijvend bewaren) en de bewaartermijn. Die
 * termijn gaat in op de brondatum: standaard de dag waarop het stuk de
 * gekozen status kreeg (meestal "definitief"); bij resultaten waarvan de
 * procestermijn de bestaans- of geldigheidsduur van het procesobject is, de
 * dag waarop dat procesobject vervalt (bijvoorbeeld een vergunning).
 *
 * De bewaartermijnen komen uit de vastgestelde selectielijst. Een gemeente
 * kan gemotiveerd afwijken; de reden gaat mee in het model. Daarnaast kan de
 * gemeente eigen classificatie-attributen toevoegen.
 *
 * Het classificatiemodel bepaalt ook bij welke statussen een stuk vergrendeld
 * is: dan maakt het platform geen nieuwe versie meer, maar een
 * wijzigingsvoorstel dat iemand met de rol vrijgever beoordeelt.
 *
 * MDTO: waardering, bewaartermijn (termijnTriggerStartLooptijd,
 * termijnStartdatumLooptijd, termijnLooptijd, termijnEinddatum) en
 * classificatie. RGBZ/ZGW: archiefnominatie, archiefactiedatum en de
 * brondatum archiefprocedure.
 */

export type Waardering = "vernietigen" | "blijvend-bewaren";

/**
 * Wanneer de bewaartermijn ingaat.
 *  - nihil: na afhandeling (hier: als het stuk de startstatus krijgt);
 *  - procesobject: als het procesobject (vergunning, uitkering …) ophoudt te bestaan;
 *  - vervaldatum: op een tijdens het proces vastgelegde datum.
 */
export type Procestermijn = "nihil" | "procesobject" | "vervaldatum";

export interface Procestype {
  nummer: number;
  naam: string;
  omschrijving: string;
  toelichting: string;
  procesobject: string;
}

export interface SelectielijstResultaat {
  /** "12.2" (generiek) of "12.2.3" (specifiek). */
  id: string;
  procestype: number;
  /** Bij een specifiek resultaat: het generieke resultaat erboven. */
  generiek: string | null;
  naam: string;
  omschrijving: string;
  waardering: Waardering;
  /** "Bewaren met uitzondering van …": zie de toelichting. */
  uitzondering?: boolean;
  procestermijn: Procestermijn;
  procestermijnTekst?: string;
  /** ISO 8601-duur, zoals P10Y. Alleen bij vernietigen. */
  bewaartermijn?: string;
  /** Een termijn die geen duur is ("na kennisgeving van de minister …"). */
  bewaartermijnTekst?: string;
  toelichting?: string;
  herkomst?: string;
}

export interface Selectielijst {
  id: string;
  naam: string;
  bron: string;
  toelichting: string;
  procestypen: Procestype[];
  resultaten: SelectielijstResultaat[];
}

// ---------------------------------------------------------------------------
// Het classificatiemodel van een gemeente
// ---------------------------------------------------------------------------

export type AttribuutType = "tekst" | "keuze" | "ja-nee";

/** Een eigen classificatie-attribuut, zoals "BIV-classificatie" of "Bevat bijzondere persoonsgegevens". */
export interface ClassificatieAttribuut {
  sleutel: string;
  label: string;
  type: AttribuutType;
  opties?: string[];
  verplicht: boolean;
  beschrijving?: string;
  /**
   * Een standaardattribuut uit de catalogus (`STANDAARDATTRIBUTEN`): de
   * sleutel en de betekenis staan vast, label, keuzes, hulptekst en verplicht
   * past de gemeente aan. Gelijk aan de sleutel.
   */
  standaard?: string;
  /** Bij een standaardattribuut met vaste betekenissen: welke keuze van de gemeente bij welke betekenis hoort. */
  koppeling?: Record<string, string>;
  /** Verplicht zodra het stuk een van deze statussen heeft of krijgt (ook als `verplicht` uit staat). */
  verplichtBij?: string[];
}

/**
 * Een attribuut dat bij elke gemeente hetzelfde betekent. Omdat de betekenis
 * vaststaat, kan de assistent er iets mee: een waarde voorstellen, het
 * alleen vragen waar het geldt, of het meenemen bij overbrengen.
 */
export interface StandaardAttribuut {
  sleutel: string;
  groep: "Privacy" | "Informatiebeveiliging" | "Archief" | "Continuïteit";
  label: string;
  type: AttribuutType;
  opties?: string[];
  /** De hulptekst voor de medewerker. */
  beschrijving: string;
  /** Voor informatiebeheer: wat het is en waarvoor. */
  toelichting: string;
  bron: string;
  /** Alleen vragen bij stukken die blijvend bewaard worden. */
  alleenBijBlijvend?: boolean;
  /** Waarden met een vaste betekenis; `standaard` is de keuze die er in de catalogus bij hoort. */
  betekenissen?: { code: string; uitleg: string; standaard: string }[];
}

export const STANDAARDATTRIBUTEN: readonly StandaardAttribuut[] = [
  {
    sleutel: "persoonsgegevens",
    groep: "Privacy",
    label: "Persoonsgegevens",
    type: "keuze",
    opties: ["Geen persoonsgegevens", "Gewone persoonsgegevens", "Met BSN", "Bijzondere persoonsgegevens (AVG art. 9)", "Strafrechtelijke gegevens (AVG art. 10)"],
    beschrijving: "Kies de zwaarste soort die in het stuk voorkomt.",
    toelichting: "Of het stuk persoonsgegevens bevat, en welke. De assistent zoekt namen, adressen, BSN's en andere gegevens en stelt een keuze voor; de medewerker beslist. Bijzondere en strafrechtelijke gegevens herkent de assistent niet.",
    bron: "AVG art. 4, 9 en 10; Uitvoeringswet AVG art. 46 (BSN)",
    betekenissen: [
      { code: "geen", uitleg: "De assistent vond geen persoonsgegevens", standaard: "Geen persoonsgegevens" },
      { code: "gewoon", uitleg: "De assistent vond persoonsgegevens, geen BSN", standaard: "Gewone persoonsgegevens" },
      { code: "bsn", uitleg: "De assistent vond een BSN", standaard: "Met BSN" },
    ],
  },
  {
    sleutel: "bivBeschikbaarheid",
    groep: "Informatiebeveiliging",
    label: "Beschikbaarheid (BIV)",
    type: "keuze",
    opties: ["laag", "midden", "hoog"],
    beschrijving: "Hoe erg is het als dit stuk een tijd niet beschikbaar is?",
    toelichting: "De B van de BIV-classificatie. De BIO stelt BIV meestal vast per proces of informatiesysteem; per stuk is het vooral nuttig als uitzondering.",
    bron: "Baseline Informatiebeveiliging Overheid (BIO)",
  },
  {
    sleutel: "bivIntegriteit",
    groep: "Informatiebeveiliging",
    label: "Integriteit (BIV)",
    type: "keuze",
    opties: ["laag", "midden", "hoog"],
    beschrijving: "Hoe erg is het als dit stuk onopgemerkt verandert?",
    toelichting: "De I van de BIV-classificatie.",
    bron: "Baseline Informatiebeveiliging Overheid (BIO)",
  },
  {
    sleutel: "bivVertrouwelijkheid",
    groep: "Informatiebeveiliging",
    label: "Vertrouwelijkheid (BIV)",
    type: "keuze",
    opties: ["laag", "midden", "hoog"],
    beschrijving: "Hoe erg is het als dit stuk bij de verkeerde persoon komt?",
    toelichting: "De V van de BIV-classificatie. Let op: het metadatamodel kent vaak al een vertrouwelijkheidsaanduiding. Zet dit alleen aan als die iets anders vastlegt, anders staat hetzelfde twee keer vast.",
    bron: "Baseline Informatiebeveiliging Overheid (BIO)",
  },
  {
    sleutel: "juridischeBewaarplicht",
    groep: "Archief",
    label: "Juridische bewaarplicht",
    type: "keuze",
    opties: ["Geen", "Woo-verzoek", "Bezwaar of beroep", "Klacht", "Andere procedure"],
    beschrijving: "Loopt er iets waarvoor het stuk bewaard moet blijven, ook na de bewaartermijn?",
    toelichting: "Een lopend Woo-verzoek, bezwaar, klacht of procedure waarvoor het stuk van belang is. Zolang dat loopt, mag het niet vernietigd worden, ook niet na de bewaartermijn.",
    bron: "Woo; Algemene wet bestuursrecht",
    betekenissen: [{ code: "geen", uitleg: "Er loopt niets", standaard: "Geen" }],
  },
  {
    sleutel: "openbaarheidsbeperking",
    groep: "Archief",
    label: "Openbaarheidsbeperking",
    type: "keuze",
    opties: ["Geen beperking", "Eerbiediging van de persoonlijke levenssfeer", "Belang van de Staat of zijn bondgenoten", "Voorkomen van onevenredige bevoordeling of benadeling"],
    beschrijving: "Moet de openbaarheid beperkt worden als het stuk naar het archief gaat?",
    toelichting: "Bij overbrenging naar de archiefbewaarplaats kan de openbaarheid tijdelijk worden beperkt, op een van de gronden uit de Archiefwet.",
    bron: "Archiefwet, openbaarheidsbeperkingen bij overbrenging",
    alleenBijBlijvend: true,
  },
  {
    sleutel: "hotspot",
    groep: "Archief",
    label: "Hotspot",
    type: "ja-nee",
    beschrijving: "Hoort het stuk bij een gebeurtenis die de gemeente als hotspot heeft aangewezen?",
    toelichting: "Een hotspot is een gebeurtenis of kwestie met grote maatschappelijke betekenis. Stukken daarover kunnen blijvend bewaard worden, ook als de selectielijst vernietigen zegt.",
    bron: "Selectielijst gemeenten 2020, toelichting (hotspots)",
  },
  {
    sleutel: "vitaleInformatie",
    groep: "Continuïteit",
    label: "Vitale informatie",
    type: "ja-nee",
    beschrijving: "Is dit stuk nodig om de gemeente na een calamiteit weer aan het werk te krijgen?",
    toelichting: "Informatie die nodig is voor de continuïteit van de dienstverlening, zoals noodplannen, sleutelregisters en contracten met leveranciers.",
    bron: "BIO, bedrijfscontinuïteit",
  },
];

/** Het standaardattribuut achter dit attribuut, als het er een is. */
export function standaardVan(at: Pick<ClassificatieAttribuut, "standaard">): StandaardAttribuut | undefined {
  return at.standaard ? STANDAARDATTRIBUTEN.find((s) => s.sleutel === at.standaard) : undefined;
}

/** Een standaardattribuut aanzetten: met de keuzes en de koppeling uit de catalogus. */
export function nieuwStandaardAttribuut(sleutel: string): ClassificatieAttribuut {
  const s = STANDAARDATTRIBUTEN.find((x) => x.sleutel === sleutel);
  if (!s) throw new Error(`Onbekend standaardattribuut: ${sleutel}`);
  return {
    sleutel: s.sleutel,
    standaard: s.sleutel,
    label: s.label,
    type: s.type,
    ...(s.opties ? { opties: [...s.opties] } : {}),
    verplicht: false,
    beschrijving: s.beschrijving,
    ...(s.betekenissen ? { koppeling: Object.fromEntries(s.betekenissen.map((b) => [b.code, b.standaard])) } : {}),
  };
}

/** Of het attribuut voor deze klasse gevraagd wordt (sommige alleen bij blijvend bewaren). */
export function attribuutGeldt(at: Pick<ClassificatieAttribuut, "standaard">, waardering: Waardering | undefined | null): boolean {
  return !standaardVan(at)?.alleenBijBlijvend || waardering === "blijvend-bewaren";
}

/**
 * Het voorstel voor het attribuut persoonsgegevens, uit wat de assistent in
 * het stuk vond (de soorten van de treffers: naam, bsn, adres, ...). Null als
 * de gemeente de betekenis niet aan een keuze koppelde.
 */
export function voorstelPersoonsgegevens(at: ClassificatieAttribuut, soorten: readonly string[]): { waarde: string; code: "geen" | "gewoon" | "bsn" } | null {
  if (at.standaard !== "persoonsgegevens") return null;
  const code = soorten.includes("bsn") ? "bsn" : soorten.some((s) => s !== "zaaknummer") ? "gewoon" : "geen";
  const waarde = at.koppeling?.[code];
  return waarde && at.opties?.includes(waarde) ? { waarde, code } : null;
}

/** Een gemotiveerde afwijking van de selectielijst voor één resultaat. */
export interface Afwijking {
  resultaat: string;
  waardering?: Waardering;
  bewaartermijn?: string;
  reden: string;
}

/**
 * Eigen zoektermen bij een klasse: de woorden die medewerkers gebruiken
 * ("collegevoorstel", "projectplan"), die de selectielijst niet noemt. De
 * assistent en het zoeken in het paneel gebruiken ze.
 */
export interface Zoektermen {
  resultaat: string;
  termen: string[];
}

/**
 * Een categorie ondersteunende stukken, zoals "O3 Tussenversie": een naam die
 * de medewerker herkent, voorbeelden en een eigen korte termijn.
 */
export interface OndersteunendeCategorie {
  /** Kort en vast, zoals "O3"; een hoofdletter met hoogstens vijf letters of cijfers. */
  code: string;
  naam: string;
  /** Wat eronder valt, met voorbeelden; de medewerker ziet het in het paneel. */
  voorbeelden: string;
  /** Hoe lang na het classificeren het stuk vernietigd mag worden (ISO 8601-duur). */
  bewaartermijn: string;
}

/**
 * Stukken zonder archiefwaarde (kopieën, kladversies, stukken ter
 * kennisname): geen klasse uit de selectielijst, maar een korte termijn die
 * de gemeente zelf vastlegt. Alleen met een grondslag: het besluit of de
 * richtlijn van de gemeente waarin staat wat hieronder valt.
 *
 * Met categorieën kiest de medewerker er een (elk met een eigen termijn);
 * zonder is er één soort ondersteunend stuk met `bewaartermijn`. Met
 * toetsvragen bevestigt de medewerker eerst dat geen ervan geldt.
 */
export interface Ondersteunend {
  /** Wat eronder valt, in gewone taal; de medewerker ziet het in het paneel. */
  omschrijving: string;
  /** Zonder categorieën: hoe lang na het classificeren het stuk vernietigd mag worden (ISO 8601-duur). */
  bewaartermijn?: string;
  /** Het besluit of de richtlijn van de gemeente. */
  grondslag: string;
  categorieen?: OndersteunendeCategorie[];
  /** Vragen waarop het antwoord "nee" moet zijn; is het bij een ervan "ja", dan is het stuk niet ondersteunend. */
  toetsvragen?: string[];
}

/** De klasse voor ondersteunende stukken; de selectielijst gebruikt alleen nummers. Met een categorie: "ondersteunend.O3". */
export const ONDERSTEUNEND = "ondersteunend";
export const CATEGORIEEN_MAX = 12;
export const TOETSVRAGEN_MAX = 10;
const CODE = /^[A-Z][A-Z0-9]{0,5}$/;

/** Of dit resultaat een ondersteunende klasse is ("ondersteunend" of "ondersteunend.O3"). */
export function isOndersteunend(resultaat: string | null | undefined): boolean {
  return !!resultaat && (resultaat === ONDERSTEUNEND || resultaat.startsWith(`${ONDERSTEUNEND}.`));
}

/**
 * Een vertrekpunt voor informatiebeheerders: vijf categorieën en vijf
 * toetsvragen, naar de Archiefwet (art. 1c), de Handreiking Selectielijst 2020
 * (§4.4), Het kaf en het koren (2024) en de Australische Normal Administrative
 * Practice. De termijnen zijn een voorstel; de gemeente stelt ze vast.
 */
export const OPZET_ONDERSTEUNEND: Ondersteunend = {
  omschrijving: "Stukken die niet bij een proces horen en geen archiefwaarde hebben. Twijfel je, kies dan een klasse uit de selectielijst.",
  grondslag: "Opzet ondersteunende informatie, Office Assistent 2026 (vertrekpunt, niet vastgesteld)",
  categorieen: [
    { code: "O1", naam: "Geen archiefbescheiden", voorbeelden: "Reclame, nieuwsbrieven, abonnementen en vakbladen; rapporten en publicaties van anderen; gedownloade openbare stukken zoals wetten, normen en handreikingen.", bewaartermijn: "P1Y" },
    { code: "O2", naam: "Kopie of dubbel", voorbeelden: "Een kopie van een stuk dat elders is vastgelegd (in een zaak, het DMS of bij de afzender); een afdruk; een bijlage die ook in het DMS staat.", bewaartermijn: "P1Y" },
    { code: "O3", naam: "Tussenversie", voorbeelden: "Een versie die niet, of alleen binnen het eigen team, is gedeeld, van een stuk waarvan een latere versie elders is vastgelegd.", bewaartermijn: "P6M" },
    { code: "O4", naam: "Werkaantekening of hulpbestand", voorbeelden: "Eigen notities, een rekenblad voor een berekening, gespreksvoorbereiding, aantekeningen bij een overleg zonder afspraken.", bewaartermijn: "P1Y" },
    { code: "O5", naam: "Logistiek en routine", voorbeelden: "Vergaderuitnodigingen, zaalreserveringen, afstemming over planning, ontvangstbevestigingen.", bewaartermijn: "P6M" },
  ],
  toetsvragen: [
    "Is het stuk ter besluitvorming voorgelegd, of staat er een besluit, afspraak of toezegging in?",
    "Volgen er rechten of plichten uit, voor een inwoner, een bedrijf of de gemeente (een handtekening, een overeenkomst)?",
    "Is het het enige exemplaar van iets dat nergens anders is vastgelegd, zoals opmerkingen die in de eindversie ontbreken?",
    "Is het gebruikt bij de afhandeling van een zaak? Dan volgt het de klasse van de zaak.",
    "Loopt er een Woo-verzoek, bezwaar, klacht of procedure waarvoor het van belang kan zijn?",
  ],
};

export interface ClassificatiemodelConfig {
  naam?: string;
  selectielijst: "gemeenten-2020";
  /** Resultaten die de gemeente niet gebruikt. */
  uitgezet?: string[];
  afwijkingen?: Afwijking[];
  zoektermen?: Zoektermen[];
  /** Aan: de medewerker kan een stuk als ondersteunend classificeren. */
  ondersteunend?: Ondersteunend | null;
  attributen: ClassificatieAttribuut[];
  /** Bij deze statussen is een stuk vergrendeld (ten minste één). */
  vergrendelBij: string[];
  /** De status waarop de bewaartermijn ingaat (de brondatum), meestal "definitief". */
  termijnStartBij: string;
  /** Een stuk krijgt deze statussen alleen als het geclassificeerd is. */
  classificerenVerplichtBij?: string[];
  /**
   * Krijgt een stuk een van deze statussen, dan krijgen alle stukken in
   * dezelfde zaak (of, zonder zaak, hetzelfde dossier) die status ook: een
   * zaak of dossier sluit je in één keer af.
   */
  doorgevenBij?: string[];
  /** Per status de klassen die de assistent voorstelt, zoals Afgebroken bij "geannuleerd". */
  statusKlassen?: StatusKlassen[];
}

/** Bij een status: de namen van resultaten uit de selectielijst die de assistent voorstelt. */
export interface StatusKlassen {
  status: string;
  /** Namen van resultaten, zoals "Afgebroken"; binnen het procestype van het stuk. */
  namen: string[];
}

/** Een vertrekpunt voor een status als "geannuleerd" of "ingetrokken". */
export const STATUSKLASSEN_OPZET = ["Afgebroken", "Ingetrokken", "Niet doorgegaan"];

/** Of een attribuut verplicht is bij deze status. */
export function attribuutVerplicht(at: Pick<ClassificatieAttribuut, "verplicht" | "verplichtBij">, status: string | null | undefined): boolean {
  return at.verplicht || (!!status && !!at.verplichtBij?.includes(status));
}

/**
 * Wat er ontbreekt voordat een stuk deze status kan krijgen: een
 * classificatie, of attributen die bij die status verplicht zijn. Leeg als
 * het stuk de status mag krijgen.
 */
export function ontbreektVoorStatus(
  c: ClassificatiemodelConfig,
  lijst: Selectielijst,
  status: string | null | undefined,
  classificatie: Pick<Classificatie, "resultaat" | "attributen"> | null | undefined,
): string[] {
  if (!status) return [];
  const bijStatus = c.attributen.filter((a) => a.verplichtBij?.includes(status));
  const moet = !!c.classificerenVerplichtBij?.includes(status) || bijStatus.length > 0;
  if (!moet) return [];
  if (!classificatie) return [`Een stuk wordt pas ${status} als het geclassificeerd is.`];
  const waardering = isOndersteunend(classificatie.resultaat) ? "vernietigen" : lijst.resultaten.find((r) => r.id === classificatie.resultaat)?.waardering;
  return bijStatus
    .filter((a) => attribuutGeldt(a, waardering))
    .filter((a) => { const w = classificatie.attributen?.[a.sleutel]; return w === undefined || w === ""; })
    .map((a) => `${a.label} is verplicht als het stuk ${status} wordt; vul het in bij Classificeren.`);
}

/**
 * De klassen die het model bij deze status voorstelt, in gebruik en (als dat
 * bekend is) binnen het procestype van het stuk.
 */
export function klassenBijStatus(c: ClassificatiemodelConfig, lijst: Selectielijst, status: string | null | undefined, procestype?: number | null): ReturnType<typeof resultatenInGebruik> {
  const namen = c.statusKlassen?.find((k) => k.status === status)?.namen;
  if (!status || !namen?.length) return [];
  const gewenst = new Set(namen.map((n) => n.trim().toLowerCase()));
  return resultatenInGebruik(c, lijst).filter((r) => gewenst.has(r.naam.toLowerCase()) && (procestype == null || r.procestype === procestype));
}

/** Een gepubliceerde versie van het classificatiemodel. */
export interface Classificatiemodel {
  versie: number;
  config: ClassificatiemodelConfig;
  gepubliceerd: string;
  door: string | null;
}

/** De classificatie van één stuk. */
export interface Classificatie {
  /** Versie van het classificatiemodel waarmee is geclassificeerd. */
  modelversie: number;
  resultaat: string;
  attributen?: Record<string, string | boolean>;
  /** Bij procestermijn "procesobject" of "vervaldatum": de dag waarop de termijn ingaat. */
  einddatumProcesobject?: string;
  /** Bij een ondersteunend stuk: de medewerker bevestigde dat geen van de toetsvragen geldt. */
  toetsvragenBevestigd?: boolean;
  door?: string;
  op?: string;
}

export const CLASSIFICATIEMODELNAAM_MAX = 80;
export const ZOEKTERMEN_MAX = 20;
const SLEUTEL = /^[a-z][a-zA-Z0-9]{1,39}$/;
export const DUUR = /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?$/;

export interface ClassificatieProbleem {
  sleutel?: string;
  ernst: "fout" | "waarschuwing";
  melding: string;
}

/** Een nieuw model: alles uit de selectielijst in gebruik, vergrendelen en starten bij "definitief". */
export function standaardClassificatiemodel(): ClassificatiemodelConfig {
  return { selectielijst: "gemeenten-2020", attributen: [], vergrendelBij: ["definitief"], termijnStartBij: "definitief" };
}

export function classificatiemodelnaam(c: Pick<ClassificatiemodelConfig, "naam"> | null | undefined, lijst?: Pick<Selectielijst, "naam">): string {
  return c?.naam?.trim() || (lijst ? lijst.naam : "Selectielijst gemeenten 2020");
}

/**
 * Toetst een classificatiemodel. `statussen` zijn de waarden van het
 * statusveld in het metadatamodel; zonder statusveld kan niets worden
 * vergrendeld en gaat geen termijn in (een waarschuwing, geen fout).
 */
export function controleerClassificatiemodel(c: ClassificatiemodelConfig, lijst: Selectielijst, statussen?: readonly string[] | null): ClassificatieProbleem[] {
  const p: ClassificatieProbleem[] = [];
  if (c.selectielijst !== lijst.id) p.push({ ernst: "fout", melding: `Onbekende selectielijst: ${String(c.selectielijst)}` });
  if (c.naam !== undefined && c.naam.trim().length > CLASSIFICATIEMODELNAAM_MAX) p.push({ ernst: "fout", melding: `De naam van het model is langer dan ${CLASSIFICATIEMODELNAAM_MAX} tekens.` });
  if (!c.vergrendelBij?.length) p.push({ sleutel: "vergrendelBij", ernst: "fout", melding: "Kies ten minste één status waarbij een stuk vergrendeld wordt." });
  if (!c.termijnStartBij) p.push({ sleutel: "termijnStartBij", ernst: "fout", melding: "Kies de status waarop de bewaartermijn ingaat." });
  if (statussen === null || (statussen && statussen.length === 0)) {
    p.push({ ernst: "waarschuwing", melding: "Het metadatamodel heeft geen statusveld. Zonder status wordt geen stuk vergrendeld en gaat geen bewaartermijn in. Zet in het metadatamodel een statusveld aan (RGBZ heeft er een)." });
  } else if (statussen) {
    for (const s of c.vergrendelBij ?? []) if (!statussen.includes(s)) p.push({ sleutel: "vergrendelBij", ernst: "fout", melding: `"${s}" is geen status in het metadatamodel.` });
    if (c.termijnStartBij && !statussen.includes(c.termijnStartBij)) p.push({ sleutel: "termijnStartBij", ernst: "fout", melding: `"${c.termijnStartBij}" is geen status in het metadatamodel.` });
    for (const s of c.classificerenVerplichtBij ?? []) if (!statussen.includes(s)) p.push({ sleutel: "classificerenVerplichtBij", ernst: "fout", melding: `Classificeren verplicht bij "${s}": dat is geen status in het metadatamodel.` });
    for (const s of c.doorgevenBij ?? []) if (!statussen.includes(s)) p.push({ sleutel: "doorgevenBij", ernst: "fout", melding: `Doorgeven bij "${s}": dat is geen status in het metadatamodel.` });
    for (const k of c.statusKlassen ?? []) if (!statussen.includes(k.status)) p.push({ sleutel: "statusKlassen", ernst: "fout", melding: `Klassen bij "${k.status}": dat is geen status in het metadatamodel.` });
    for (const at of c.attributen ?? []) for (const s of at.verplichtBij ?? []) if (!statussen.includes(s)) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `${at.label || at.sleutel}: verplicht bij "${s}", maar dat is geen status in het metadatamodel.` });
  }
  {
    const namen = new Set(lijst.resultaten.map((r) => r.naam.toLowerCase()));
    const statussenMetKlassen = new Set<string>();
    for (const k of c.statusKlassen ?? []) {
      if (statussenMetKlassen.has(k.status)) p.push({ sleutel: "statusKlassen", ernst: "fout", melding: `Bij "${k.status}" staan twee lijsten met klassen.` });
      statussenMetKlassen.add(k.status);
      if (!k.namen?.length) p.push({ sleutel: "statusKlassen", ernst: "fout", melding: `Noem bij "${k.status}" ten minste één klasse.` });
      for (const n of k.namen ?? []) if (!namen.has(n.trim().toLowerCase())) p.push({ sleutel: "statusKlassen", ernst: "fout", melding: `Bij "${k.status}": "${n}" is geen resultaat in de selectielijst.` });
    }
    if ((c.doorgevenBij?.length ?? 0) && !(c.doorgevenBij ?? []).some((s) => c.vergrendelBij?.includes(s))) {
      p.push({ sleutel: "doorgevenBij", ernst: "waarschuwing", melding: "Doorgeven bij een status die niet vergrendelt: een afgesloten zaak kan dan stuk voor stuk weer open." });
    }
  }
  const ids = new Set(lijst.resultaten.map((r) => r.id));
  for (const u of c.uitgezet ?? []) if (!ids.has(u)) p.push({ sleutel: u, ernst: "fout", melding: `Resultaat ${u} staat niet in de selectielijst.` });
  if ((c.uitgezet?.length ?? 0) >= lijst.resultaten.length) p.push({ ernst: "fout", melding: "Er moet ten minste één resultaat in gebruik zijn." });
  const afgeweken = new Set<string>();
  for (const a of c.afwijkingen ?? []) {
    if (!ids.has(a.resultaat)) p.push({ sleutel: a.resultaat, ernst: "fout", melding: `Resultaat ${a.resultaat} staat niet in de selectielijst.` });
    if (afgeweken.has(a.resultaat)) p.push({ sleutel: a.resultaat, ernst: "fout", melding: `Voor ${a.resultaat} staan twee afwijkingen.` });
    afgeweken.add(a.resultaat);
    if ((a.reden ?? "").trim().length < 5) p.push({ sleutel: a.resultaat, ernst: "fout", melding: `Een afwijking van de selectielijst (${a.resultaat}) heeft een reden nodig.` });
    if (a.bewaartermijn !== undefined && !DUUR.test(a.bewaartermijn)) p.push({ sleutel: a.resultaat, ernst: "fout", melding: `De bewaartermijn bij ${a.resultaat} is geen geldige duur.` });
    const waardering = a.waardering ?? lijst.resultaten.find((r) => r.id === a.resultaat)?.waardering;
    if (waardering === "vernietigen" && a.waardering === "vernietigen" && !a.bewaartermijn && !lijst.resultaten.find((r) => r.id === a.resultaat)?.bewaartermijn) {
      p.push({ sleutel: a.resultaat, ernst: "fout", melding: `Vernietigen bij ${a.resultaat} vraagt een bewaartermijn.` });
    }
    if (a.waardering === "vernietigen" && lijst.resultaten.find((r) => r.id === a.resultaat)?.waardering === "blijvend-bewaren") {
      p.push({ sleutel: a.resultaat, ernst: "waarschuwing", melding: `${a.resultaat}: de selectielijst zegt blijvend bewaren. Vernietigen moet je melden bij de archivaris (Archiefwet).` });
    }
  }
  const uit = new Set(c.uitgezet ?? []);
  const metTermen = new Set<string>();
  for (const z of c.zoektermen ?? []) {
    if (!ids.has(z.resultaat)) p.push({ sleutel: z.resultaat, ernst: "fout", melding: `Zoektermen bij ${z.resultaat}: dat resultaat staat niet in de selectielijst.` });
    else if (uit.has(z.resultaat)) p.push({ sleutel: z.resultaat, ernst: "waarschuwing", melding: `${z.resultaat} staat uit; de zoektermen erbij doen niets.` });
    if (metTermen.has(z.resultaat)) p.push({ sleutel: z.resultaat, ernst: "fout", melding: `Bij ${z.resultaat} staan twee lijsten met zoektermen.` });
    metTermen.add(z.resultaat);
    if ((z.termen?.length ?? 0) > ZOEKTERMEN_MAX) p.push({ sleutel: z.resultaat, ernst: "fout", melding: `Bij ${z.resultaat} staan meer dan ${ZOEKTERMEN_MAX} zoektermen.` });
    for (const t of z.termen ?? []) {
      if (t.trim().length < 2 || t.trim().length > 40) p.push({ sleutel: z.resultaat, ernst: "fout", melding: `Zoekterm "${t}" bij ${z.resultaat}: 2 tot 40 tekens.` });
    }
  }
  if (c.ondersteunend) {
    const o = c.ondersteunend;
    const fout = (melding: string) => p.push({ sleutel: ONDERSTEUNEND, ernst: "fout", melding: `Ondersteunende stukken: ${melding}` });
    if ((o.omschrijving ?? "").trim().length < 10) fout("beschrijf wat eronder valt (minstens tien tekens); de medewerker ziet het in het paneel.");
    if ((o.grondslag ?? "").trim().length < 5) fout("noem de grondslag, het besluit of de richtlijn van de gemeente waarin staat wat hieronder valt.");
    const cats = o.categorieen ?? [];
    if (!cats.length && !DUUR.test(o.bewaartermijn ?? "")) fout("de bewaartermijn is geen geldige duur.");
    if (cats.length > CATEGORIEEN_MAX) fout(`hoogstens ${CATEGORIEEN_MAX} categorieën.`);
    const codes = new Set<string>();
    for (const k of cats) {
      const wie = k.code || "(zonder code)";
      if (!CODE.test(k.code ?? "")) fout(`de code "${k.code ?? ""}" is een hoofdletter met hoogstens vijf letters of cijfers, zoals O3.`);
      if (codes.has(k.code)) fout(`de code ${k.code} staat er twee keer in.`);
      codes.add(k.code);
      if ((k.naam ?? "").trim().length < 3) fout(`${wie} heeft geen naam.`);
      if ((k.voorbeelden ?? "").trim().length < 10) fout(`${wie}: noem wat eronder valt (minstens tien tekens).`);
      if (!DUUR.test(k.bewaartermijn ?? "")) fout(`${wie}: de bewaartermijn is geen geldige duur.`);
    }
    const vragen = o.toetsvragen ?? [];
    if (vragen.length > TOETSVRAGEN_MAX) fout(`hoogstens ${TOETSVRAGEN_MAX} toetsvragen.`);
    for (const [i, v] of vragen.entries()) if ((v ?? "").trim().length < 10) fout(`toetsvraag ${i + 1} is te kort.`);
    if (!vragen.length) p.push({ sleutel: ONDERSTEUNEND, ernst: "waarschuwing", melding: "Ondersteunende stukken: zonder toetsvragen kiest de medewerker zonder eerst na te gaan of het stuk toch ergens bij hoort." });
  }
  const gezien = new Set<string>();
  for (const at of c.attributen ?? []) {
    const st = STANDAARDATTRIBUTEN.find((x) => x.sleutel === (at.standaard ?? at.sleutel));
    if (at.standaard) {
      if (!st) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `"${at.standaard}" is geen standaardattribuut.` });
      else {
        if (at.sleutel !== st.sleutel) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `Het standaardattribuut ${st.label} heeft de vaste sleutel "${st.sleutel}".` });
        if (at.type !== st.type) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `${at.label || st.label}: de soort van een standaardattribuut ligt vast (${st.type}).` });
        for (const b of st.betekenissen ?? []) {
          const k = at.koppeling?.[b.code];
          if (!k) p.push({ sleutel: at.sleutel, ernst: "waarschuwing", melding: `${at.label || st.label}: geen keuze gekoppeld aan "${b.uitleg}"; daar doet de assistent dan geen voorstel.` });
          else if (!at.opties?.includes(k)) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `${at.label || st.label}: "${k}" staat niet (meer) tussen de keuzes; koppel "${b.uitleg}" aan een andere keuze.` });
        }
      }
    } else if (st) {
      p.push({ sleutel: at.sleutel, ernst: "fout", melding: `De sleutel "${at.sleutel}" hoort bij het standaardattribuut ${st.label}. Zet dat aan in plaats van een eigen attribuut.` });
    }
    if (!SLEUTEL.test(at.sleutel)) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `De sleutel "${at.sleutel}" mag alleen letters en cijfers bevatten, begint met een kleine letter en is 2 tot 40 tekens.` });
    if (gezien.has(at.sleutel)) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `Het attribuut "${at.sleutel}" staat er twee keer in.` });
    gezien.add(at.sleutel);
    if (!at.label?.trim()) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `Het attribuut "${at.sleutel}" heeft geen label.` });
    if (at.type === "keuze" && !at.opties?.length) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `Het keuzeattribuut "${at.label || at.sleutel}" heeft geen opties.` });
  }
  return p;
}

/** De resultaten die de gemeente gebruikt, met haar afwijkingen en zoektermen erin verwerkt. */
export function resultatenInGebruik(c: ClassificatiemodelConfig, lijst: Selectielijst): (SelectielijstResultaat & { afwijking?: Afwijking; zoektermen?: string[] })[] {
  const uit = new Set(c.uitgezet ?? []);
  const afw = new Map((c.afwijkingen ?? []).map((a) => [a.resultaat, a]));
  const termen = new Map((c.zoektermen ?? []).filter((z) => z.termen?.length).map((z) => [z.resultaat, z.termen.map((t) => t.trim()).filter(Boolean)]));
  return lijst.resultaten
    .filter((r) => !uit.has(r.id))
    .map((r) => {
      const a = afw.get(r.id);
      const z = termen.get(r.id);
      const metTermen = z?.length ? { ...r, zoektermen: z } : r;
      if (!a) return metTermen;
      const waardering = a.waardering ?? r.waardering;
      return { ...metTermen, waardering, bewaartermijn: waardering === "blijvend-bewaren" ? undefined : (a.bewaartermijn ?? r.bewaartermijn), afwijking: a };
    });
}

/**
 * Ondersteunend als klasse, zodat het paneel en het bewaren er hetzelfde mee
 * kunnen als met een resultaat. Zonder categorieën één klasse
 * ("ondersteunend"), anders één per categorie ("ondersteunend.O3").
 */
export function ondersteunendeKlassen(o: Ondersteunend | null | undefined): SelectielijstResultaat[] {
  if (!o) return [];
  const basis = { procestype: 0, generiek: null, waardering: "vernietigen" as const, procestermijn: "nihil" as const, herkomst: o.grondslag };
  if (!o.categorieen?.length) {
    return [{ ...basis, id: ONDERSTEUNEND, naam: "Ondersteunend", omschrijving: "zonder archiefwaarde", bewaartermijn: o.bewaartermijn, toelichting: o.omschrijving }];
  }
  return o.categorieen.map((k) => ({ ...basis, id: `${ONDERSTEUNEND}.${k.code}`, naam: k.naam, omschrijving: k.code, bewaartermijn: k.bewaartermijn, toelichting: k.voorbeelden }));
}

/** De ondersteunende klasse met dit resultaat, als het model haar kent. */
export function ondersteunendResultaat(o: Ondersteunend | null | undefined, resultaat: string = ONDERSTEUNEND): SelectielijstResultaat | undefined {
  return ondersteunendeKlassen(o).find((k) => k.id === resultaat);
}

/** Of een stuk met deze status vergrendeld is. */
export function isVergrendeld(status: string | undefined | null, c: Pick<ClassificatiemodelConfig, "vergrendelBij"> | null | undefined): boolean {
  return !!status && !!c && c.vergrendelBij.includes(status);
}

// ---------------------------------------------------------------------------
// Bewaren: de termijn en de datum
// ---------------------------------------------------------------------------

/** Een ISO 8601-duur (P10Y, P1Y6M, P6W, P91D) optellen bij een datum (jjjj-mm-dd). */
export function telOp(datum: string, duur: string): string {
  const m = DUUR.exec(duur);
  if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Error(`Ongeldige datum of duur: ${datum} ${duur}`);
  const [j, mnd, d] = datum.split("-").map(Number) as [number, number, number];
  const jaren = parseInt(m[1] ?? "0", 10);
  const maanden = parseInt(m[2] ?? "0", 10);
  const dagen = parseInt(m[3] ?? "0", 10) * 7 + parseInt(m[4] ?? "0", 10);
  // Maanden en jaren eerst; valt de dag weg (31 februari), dan de laatste dag van de maand.
  const totaal = mnd - 1 + maanden + jaren * 12;
  const nj = j + Math.floor(totaal / 12);
  const nm = totaal % 12;
  const laatste = new Date(Date.UTC(nj, nm + 1, 0)).getUTCDate();
  const uit = new Date(Date.UTC(nj, nm, Math.min(d, laatste)));
  uit.setUTCDate(uit.getUTCDate() + dagen);
  return uit.toISOString().slice(0, 10);
}

/** "P10Y" → "10 jaar", "P1Y6M" → "1 jaar en 6 maanden". */
export function duurInWoorden(duur: string): string {
  const m = DUUR.exec(duur);
  if (!m) return duur;
  const delen: string[] = [];
  const n = (x: string | undefined) => parseInt(x ?? "0", 10);
  if (n(m[1])) delen.push(`${n(m[1])} jaar`);
  if (n(m[2])) delen.push(`${n(m[2])} ${n(m[2]) === 1 ? "maand" : "maanden"}`);
  if (n(m[3])) delen.push(`${n(m[3])} ${n(m[3]) === 1 ? "week" : "weken"}`);
  if (n(m[4])) delen.push(`${n(m[4])} ${n(m[4]) === 1 ? "dag" : "dagen"}`);
  return delen.length ? delen.join(" en ") : "direct";
}

export interface Bewaren {
  resultaat: string;
  /** Naam en omschrijving van de klasse, zoals "Verleend · Omgevingsvergunning kappen". */
  klasse: string;
  waardering: Waardering;
  bewaartermijn?: string;
  /** Waarop de termijn ingaat; bij ondersteunende stukken het classificeren. */
  start: "status" | "procesobject" | "classificatie";
  /** De brondatum, zodra die bekend is. */
  brondatum?: string;
  /** De datum waarop het stuk vernietigd mag worden (alleen bij vernietigen, zodra de brondatum bekend is). */
  archiefactiedatum?: string;
  afgeweken?: boolean;
  /** In gewone taal, zoals in het paneel. */
  uitleg: string;
}

const nl = (d: string) => d.split("-").reverse().map((x) => String(Number(x))).join("-");

/**
 * Wat er met een stuk gebeurt en wanneer. `statusdata` geeft per status de dag
 * waarop het stuk die status voor het eerst kreeg.
 */
export function bepaalBewaren(
  c: ClassificatiemodelConfig,
  lijst: Selectielijst,
  classificatie: Pick<Classificatie, "resultaat" | "einddatumProcesobject" | "op">,
  statusdata: Record<string, string> = {},
): Bewaren | null {
  if (isOndersteunend(classificatie.resultaat)) {
    const k = ondersteunendResultaat(c.ondersteunend, classificatie.resultaat);
    if (!k?.bewaartermijn) return null;
    const basis = { resultaat: k.id, klasse: k.id === ONDERSTEUNEND ? "Ondersteunend, zonder archiefwaarde" : `Ondersteunend · ${k.omschrijving} ${k.naam}`, waardering: "vernietigen" as const, bewaartermijn: k.bewaartermijn, start: "classificatie" as const };
    const termijn = duurInWoorden(k.bewaartermijn);
    const brondatum = classificatie.op?.slice(0, 10);
    if (!brondatum) return { ...basis, uitleg: `Vernietigen ${termijn} na het classificeren (${k.herkomst}).` };
    const archiefactiedatum = telOp(brondatum, k.bewaartermijn);
    return { ...basis, brondatum, archiefactiedatum, uitleg: `Vernietigen na ${nl(archiefactiedatum)}: ${termijn} na het classificeren (${k.herkomst}).` };
  }
  const r = resultatenInGebruik({ ...c, uitgezet: [] }, lijst).find((x) => x.id === classificatie.resultaat);
  if (!r) return null;
  const basis = { resultaat: r.id, klasse: r.omschrijving ? `${r.naam} · ${r.omschrijving}` : r.naam, waardering: r.waardering, ...(r.afwijking ? { afgeweken: true } : {}) };
  if (r.waardering === "blijvend-bewaren") {
    return { ...basis, start: "status", uitleg: "Blijvend bewaren: het stuk gaat naar het archief en wordt niet vernietigd." };
  }
  const opProcesobject = r.procestermijn !== "nihil";
  const start = opProcesobject ? "procesobject" : "status";
  const brondatum = opProcesobject ? classificatie.einddatumProcesobject : statusdata[c.termijnStartBij]?.slice(0, 10);
  const wanneer = opProcesobject ? (r.procestermijn === "vervaldatum" ? "na de vervaldatum" : "nadat het procesobject vervalt") : `na ${c.termijnStartBij}`;
  if (!r.bewaartermijn) {
    return { ...basis, start, ...(brondatum ? { brondatum } : {}), uitleg: `Vernietigen: ${r.bewaartermijnTekst ?? "termijn volgens de toelichting"}.` };
  }
  const termijn = duurInWoorden(r.bewaartermijn);
  if (!brondatum) {
    const nog = opProcesobject ? "de datum is nog niet ingevuld" : `het stuk is nog niet ${c.termijnStartBij}`;
    return { ...basis, bewaartermijn: r.bewaartermijn, start, uitleg: `Vernietigen ${termijn} ${wanneer} (${nog}).` };
  }
  const archiefactiedatum = telOp(brondatum, r.bewaartermijn);
  return { ...basis, bewaartermijn: r.bewaartermijn, start, brondatum, archiefactiedatum, uitleg: `Vernietigen na ${nl(archiefactiedatum)}: ${termijn} ${wanneer} (${nl(brondatum)}).` };
}

/**
 * Hoe de andere zakelijke stukken in dezelfde zaak (of, zonder zaak, hetzelfde
 * dossier) zijn geclassificeerd. Alleen klassen en aantallen, geen titels:
 * wie dit stuk mag zien, hoeft de andere niet te mogen zien.
 */
export interface ZaakClassificatie {
  rol: "zaak" | "dossier";
  waarde: string;
  klassen: { resultaat: string; aantal: number; laatst: string; einddatumProcesobject?: string }[];
}
