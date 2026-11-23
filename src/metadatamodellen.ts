/**
 * Metadatamodellen voor het objecttype "document".
 *
 * Een gemeente kiest in het beheerportaal een basismodel (MDTO, RGBZ of
 * TMLO), zet per veld aan of uit, maakt velden verplicht, past label en
 * hulptekst aan en kan eigen velden toevoegen. Daaruit volgt een JSON
 * Schema, dat als nieuwe versie van het objecttype op het platform wordt
 * gepubliceerd. Stukken houden de versie waarmee ze zijn vastgelegd.
 *
 * TOOI is geen metadatamodel maar een stelsel van waardelijsten
 * (organisaties, Woo-informatiecategorieën …); het levert de keuzelijsten.
 *
 * Velden hebben een vaste sleutel (de naam van het element in het model)
 * en soms een rol: wat het veld betekent voor de assistent en het
 * platform (titel, informatiecategorie …). Zo werken voorstellen, zoeken
 * en filteren ongeacht het gekozen model.
 */
import { VERTROUWELIJKHEID, WOO_INFORMATIECATEGORIEEN } from "./schemas.js";
import { BEPERKINGSGRONDEN, BEPERKINGSGROND_WAARDEN, BEPERKT_OPENBAAR, grondWaarde, OPENBAARHEID } from "./archiefwet.js";

export type ModelId = "mdto" | "rgbz" | "tmlo";

/** Wat een veld betekent voor de assistent en het platform. */
export const ROLLEN = [
  "titel", "omschrijving", "informatiecategorie", "vertrouwelijkheid", "taal", "zaak", "dossier", "auteur", "datum", "trefwoorden", "status",
  // Archiefregeling 2026: uit hoofde van welke taak (art. 2.5), en de openbaarheid bij overbrenging (art. 2.12).
  "taak", "openbaarheid", "beperkingsgrond", "beperkingstermijn", "beperkingEinddatum",
] as const;
export type Rol = (typeof ROLLEN)[number];

/**
 * Welke standaardeigenschap van het bestand bij een rol hoort. Velden zonder
 * standaardeigenschap gaan als eigen eigenschap mee, onder hun label.
 */
export const EIGENSCHAP_VAN_ROL: Partial<Record<Rol, "titel" | "omschrijving" | "trefwoorden" | "auteur" | "taal" | "status" | "categorie">> = {
  titel: "titel",
  omschrijving: "omschrijving",
  trefwoorden: "trefwoorden",
  auteur: "auteur",
  taal: "taal",
  status: "status",
  informatiecategorie: "categorie",
};

export type VeldType = "tekst" | "lange-tekst" | "datum" | "keuze" | "getal";

export interface Waardelijst {
  id: string;
  naam: string;
  /** Waar de lijst vandaan komt: TOOI, RGBZ, ISO … */
  bron: string;
  waarden: readonly string[];
}

export const WAARDELIJSTEN: Record<string, Waardelijst> = {
  "tooi-woo-informatiecategorie": {
    id: "tooi-woo-informatiecategorie",
    naam: "Woo-informatiecategorieën (art. 3.3 Woo)",
    bron: "TOOI",
    waarden: WOO_INFORMATIECATEGORIEEN,
  },
  "oa-vertrouwelijkheid": {
    id: "oa-vertrouwelijkheid",
    naam: "Vertrouwelijkheid (eenvoudig: openbaar, intern, vertrouwelijk)",
    bron: "Office Assistent",
    waarden: VERTROUWELIJKHEID,
  },
  "rgbz-vertrouwelijkheidaanduiding": {
    id: "rgbz-vertrouwelijkheidaanduiding",
    naam: "Vertrouwelijkheidaanduiding (acht niveaus)",
    bron: "RGBZ / ZGW",
    waarden: ["openbaar", "beperkt openbaar", "intern", "zaakvertrouwelijk", "vertrouwelijk", "confidentieel", "geheim", "zeer geheim"],
  },
  "rgbz-status": {
    id: "rgbz-status",
    naam: "Status van het informatieobject",
    bron: "RGBZ / ZGW",
    waarden: ["in bewerking", "ter vaststelling", "definitief", "gearchiveerd"],
  },
  "archiefwet-openbaarheid": {
    id: "archiefwet-openbaarheid",
    naam: "Openbaarheid na overbrenging (Archiefwet 2026)",
    bron: "Archiefwet 2026, art. 7.1",
    waarden: OPENBAARHEID,
  },
  "archiefwet-beperkingsgrond": {
    id: "archiefwet-beperkingsgrond",
    naam: "Gronden voor beperking van de openbaarheid (art. 7.2 Archiefwet 2026)",
    bron: "Archiefwet 2026, art. 7.2",
    waarden: BEPERKINGSGROND_WAARDEN,
  },
  "mdto-openbaarheid": {
    id: "mdto-openbaarheid",
    naam: "Openbaarheid (beperking gebruik)",
    bron: "MDTO",
    waarden: ["openbaar", "beperkt openbaar", "niet openbaar"],
  },
  "mdto-waardering": {
    id: "mdto-waardering",
    naam: "Waardering",
    bron: "MDTO",
    waarden: ["blijvend te bewaren", "te vernietigen", "nog niet bepaald"],
  },
  "iso-639-1": {
    id: "iso-639-1",
    naam: "Taal, twee letters (ISO 639-1)",
    bron: "ISO",
    waarden: ["nl", "en", "de", "fr", "fy", "pap"],
  },
  "iso-639-2": {
    id: "iso-639-2",
    naam: "Taal, drie letters (ISO 639-2/B, zoals in de ZGW-API's)",
    bron: "ISO",
    waarden: ["dut", "eng", "ger", "fre", "fry", "pap"],
  },
};

/** Een veld uit de catalogus van een model. */
export interface CatalogusVeld {
  /** Sleutel in de metadata, de naam van het element in het model. */
  sleutel: string;
  /** Hoe het model het element noemt, met pad als het genest is. */
  element: string;
  label: string;
  beschrijving: string;
  type: VeldType;
  rol?: Rol;
  waardelijst?: string;
  maxLengte?: number;
  standaard?: string;
  /** Verplicht volgens het model zelf. */
  verplichtInModel?: boolean;
  /** Staat aan bij een nieuw gekozen model. */
  aan?: boolean;
  /** Verplicht bij een nieuw gekozen model. */
  verplicht?: boolean;
  /** Geen element van het model: nodig voor de Woo of het zaakgericht werken. */
  aanvulling?: string;
  /** Alleen tonen (en alleen verplicht) als het veld met deze rol deze waarde heeft. */
  toonAls?: { rol: Rol; waarde: string };
}

export interface Metadatamodel {
  id: ModelId;
  naam: string;
  voluit: string;
  versie: string;
  uitleg: string;
  /** Elementen die het systeem zelf vult; ze staan niet in het paneel. */
  automatisch: string[];
  velden: CatalogusVeld[];
}

const WOO_AANVULLING = "Geen element van dit model, maar nodig voor de Woo (informatiecategorie uit TOOI).";
const ARCHIEF_AANVULLING = "Geen element van dit model, maar nodig voor de Archiefregeling 2026 (art. 2.12).";
const BEPERKT = { rol: "openbaarheid", waarde: BEPERKT_OPENBAAR } as const;

export const METADATAMODELLEN: Record<ModelId, Metadatamodel> = {
  mdto: {
    id: "mdto",
    naam: "MDTO",
    voluit: "Metagegevens voor duurzaam toegankelijke overheidsinformatie",
    versie: "1.0",
    uitleg:
      "De standaard van het Nationaal Archief voor duurzame toegankelijkheid, opvolger van TMLO. Het e-Depot verwacht MDTO bij overbrenging. Kies dit als het archief leidend is.",
    automatisch: ["identificatie", "aggregatieniveau", "archiefvormer", "heeftRepresentatie", "gerelateerdInformatieobject"],
    velden: [
      { sleutel: "naam", element: "naam", label: "Naam", beschrijving: "De naam van het stuk zoals een lezer die verwacht.", type: "tekst", rol: "titel", maxLengte: 200, verplichtInModel: true, aan: true, verplicht: true },
      { sleutel: "omschrijving", element: "omschrijving", label: "Omschrijving", beschrijving: "Waar het stuk over gaat, in één of twee zinnen.", type: "lange-tekst", rol: "omschrijving", maxLengte: 2000, aan: true },
      { sleutel: "informatiecategorie", element: "informatiecategorie", label: "Informatiecategorie (Woo)", beschrijving: "De categorie uit artikel 3.3 van de Woo.", type: "keuze", rol: "informatiecategorie", waardelijst: "tooi-woo-informatiecategorie", aan: true, verplicht: true },
      { sleutel: "beperkingGebruik", element: "beperkingGebruik", label: "Vertrouwelijkheid", beschrijving: "Wie het stuk mag inzien.", type: "keuze", rol: "vertrouwelijkheid", waardelijst: "oa-vertrouwelijkheid", verplichtInModel: true, aan: true, verplicht: true },
      { sleutel: "openbaarheid", element: "beperkingGebruik (openbaarheid)", label: "Openbaarheid na overbrenging", beschrijving: "Openbaar of beperkt openbaar als het stuk naar het archief gaat (Archiefwet 2026). Beperken kan alleen met een grond uit artikel 7.2.", type: "keuze", rol: "openbaarheid", waardelijst: "archiefwet-openbaarheid", aan: true },
      { sleutel: "beperkingsgrond", element: "beperkingGebruik.beperkingGebruikNadereBeschrijving", label: "Grond voor beperking", beschrijving: "Waarom de openbaarheid beperkt is: een grond uit artikel 7.2 van de Archiefwet 2026.", type: "keuze", rol: "beperkingsgrond", waardelijst: "archiefwet-beperkingsgrond", aan: true, verplicht: true, toonAls: BEPERKT },
      { sleutel: "beperkingstermijn", element: "beperkingGebruik.beperkingGebruikTermijn.termijnLooptijd", label: "Duur van de beperking (jaren)", beschrijving: "Hoeveel jaar na de datum van het stuk de beperking geldt: ten hoogste 20, 75 of 110 jaar, afhankelijk van de grond (artikel 7.4).", type: "getal", rol: "beperkingstermijn", aan: true, verplicht: true, toonAls: BEPERKT },
      { sleutel: "beperkingEinddatum", element: "beperkingGebruik.beperkingGebruikTermijn.termijnEinddatum", label: "Beperking loopt af op", beschrijving: "De datum van het stuk plus de duur; de assistent rekent die voor je uit.", type: "datum", rol: "beperkingEinddatum", aan: true, verplicht: true, toonAls: BEPERKT },
      { sleutel: "taal", element: "taal", label: "Taal", beschrijving: "De taal van het stuk.", type: "keuze", rol: "taal", waardelijst: "iso-639-1", standaard: "nl", aan: true },
      { sleutel: "trefwoord", element: "trefwoord", label: "Trefwoorden", beschrijving: "Woorden waarop je het stuk wilt kunnen vinden, met komma's ertussen.", type: "tekst", rol: "trefwoorden", maxLengte: 500 },
      { sleutel: "classificatie", element: "classificatie", label: "Classificatie", beschrijving: "Plaats in het classificatieschema of de selectielijst van de gemeente.", type: "tekst", maxLengte: 200 },
      { sleutel: "isOnderdeelVan", element: "isOnderdeelVan", label: "Dossier", beschrijving: "Identificatie of naam van het dossier, als het stuk erbij hoort.", type: "tekst", rol: "dossier", maxLengte: 200, aan: true },
      { sleutel: "zaak", element: "—", label: "Zaak", beschrijving: "Zaaknummer, als het stuk bij een zaak hoort.", type: "tekst", rol: "zaak", maxLengte: 100, aan: true, aanvulling: "Geen element van MDTO; legt de koppeling met het zaaksysteem." },
      { sleutel: "betrokkene", element: "betrokkene", label: "Betrokkene", beschrijving: "Een persoon of organisatie met een rol bij het stuk, zoals de opsteller.", type: "tekst", rol: "auteur", maxLengte: 200, aan: true },
      { sleutel: "activiteit", element: "activiteit", label: "Taak", beschrijving: "De taak of het werkproces waarbij het stuk is ontstaan, zoals Wmo-maatwerkvoorziening of omgevingsvergunning.", type: "tekst", rol: "taak", maxLengte: 200, aan: true },
      { sleutel: "dekkingInTijd", element: "dekkingInTijd", label: "Dekking in tijd", beschrijving: "De periode waar het stuk over gaat (bijvoorbeeld 2026 of jan–jun 2026).", type: "tekst", maxLengte: 100 },
      { sleutel: "dekkingInRuimte", element: "dekkingInRuimte", label: "Dekking in ruimte", beschrijving: "Het gebied waar het stuk over gaat, zoals een wijk of adres.", type: "tekst", maxLengte: 200 },
      { sleutel: "gebeurtenisDatum", element: "event (datum)", label: "Datum", beschrijving: "Datum van de belangrijkste gebeurtenis, zoals vaststelling of verzending.", type: "datum", rol: "datum", aan: true },
      { sleutel: "waardering", element: "waardering", label: "Waardering", beschrijving: "Blijvend te bewaren of te vernietigen, volgens de selectielijst.", type: "keuze", waardelijst: "mdto-waardering", verplichtInModel: true },
      { sleutel: "bewaartermijn", element: "bewaartermijn", label: "Bewaartermijn", beschrijving: "Hoe lang het stuk bewaard blijft, in jaren.", type: "getal" },
      { sleutel: "raadpleeglocatie", element: "raadpleeglocatie", label: "Raadpleeglocatie", beschrijving: "Waar het stuk te raadplegen is, als dat ergens anders is.", type: "tekst", maxLengte: 200 },
    ],
  },
  rgbz: {
    id: "rgbz",
    naam: "RGBZ",
    voluit: "Referentiemodel Gemeentelijke Basisgegevens Zaken",
    versie: "2.0 (ZGW Documenten-API)",
    uitleg:
      "Het gegevensmodel voor zaakgericht werken in GEMMA, met de velden van het informatieobject uit de ZGW Documenten-API. Kies dit als het zaaksysteem leidend is.",
    automatisch: ["identificatie", "bronorganisatie", "informatieobjecttype", "formaat", "bestandsnaam", "versie", "beginRegistratie", "integriteit"],
    velden: [
      { sleutel: "titel", element: "titel", label: "Titel", beschrijving: "De titel van het stuk.", type: "tekst", rol: "titel", maxLengte: 200, verplichtInModel: true, aan: true, verplicht: true },
      { sleutel: "beschrijving", element: "beschrijving", label: "Beschrijving", beschrijving: "Een korte beschrijving van de inhoud.", type: "lange-tekst", rol: "omschrijving", maxLengte: 1000, aan: true },
      { sleutel: "vertrouwelijkheidaanduiding", element: "vertrouwelijkheidaanduiding", label: "Vertrouwelijkheid", beschrijving: "De vertrouwelijkheidaanduiding van het stuk.", type: "keuze", rol: "vertrouwelijkheid", waardelijst: "rgbz-vertrouwelijkheidaanduiding", aan: true, verplicht: true },
      { sleutel: "auteur", element: "auteur", label: "Auteur", beschrijving: "De persoon of organisatie die het stuk heeft gemaakt.", type: "tekst", rol: "auteur", maxLengte: 200, verplichtInModel: true, aan: true, verplicht: true },
      { sleutel: "creatiedatum", element: "creatiedatum", label: "Creatiedatum", beschrijving: "De datum waarop het stuk is gemaakt.", type: "datum", rol: "datum", verplichtInModel: true, aan: true, verplicht: true },
      { sleutel: "status", element: "status", label: "Status", beschrijving: "Waar het stuk staat in zijn levensloop.", type: "keuze", rol: "status", waardelijst: "rgbz-status", aan: true },
      { sleutel: "taal", element: "taal", label: "Taal", beschrijving: "De taal van het stuk, in drie letters zoals de ZGW-API's die gebruiken.", type: "keuze", rol: "taal", waardelijst: "iso-639-2", standaard: "dut", verplichtInModel: true, aan: true, verplicht: true },
      { sleutel: "zaak", element: "zaakinformatieobject.zaak", label: "Zaak", beschrijving: "Het zaaknummer waar het stuk bij hoort.", type: "tekst", rol: "zaak", maxLengte: 100, aan: true },
      { sleutel: "trefwoorden", element: "trefwoorden", label: "Trefwoorden", beschrijving: "Woorden waarop je het stuk wilt kunnen vinden, met komma's ertussen.", type: "tekst", rol: "trefwoorden", maxLengte: 500 },
      { sleutel: "ontvangstdatum", element: "ontvangstdatum", label: "Ontvangstdatum", beschrijving: "Voor een ontvangen stuk: de datum van ontvangst.", type: "datum" },
      { sleutel: "verzenddatum", element: "verzenddatum", label: "Verzenddatum", beschrijving: "Voor een verzonden stuk: de datum van verzending.", type: "datum" },
      { sleutel: "informatiecategorie", element: "—", label: "Informatiecategorie (Woo)", beschrijving: "De categorie uit artikel 3.3 van de Woo.", type: "keuze", rol: "informatiecategorie", waardelijst: "tooi-woo-informatiecategorie", aan: true, verplicht: true, aanvulling: WOO_AANVULLING },
      { sleutel: "taak", element: "—", label: "Taak", beschrijving: "De taak of het werkproces waarbij het stuk is ontstaan. Bij een zaak volgt die meestal uit het zaaktype.", type: "tekst", rol: "taak", maxLengte: 200, aanvulling: "Geen element van RGBZ; in het zaakgericht werken volgt de taak uit het zaaktype (Archiefregeling 2026, art. 2.5)." },
      { sleutel: "openbaarheid", element: "—", label: "Openbaarheid na overbrenging", beschrijving: "Openbaar of beperkt openbaar als het stuk naar het archief gaat (Archiefwet 2026). Beperken kan alleen met een grond uit artikel 7.2.", type: "keuze", rol: "openbaarheid", waardelijst: "archiefwet-openbaarheid", aan: true, aanvulling: ARCHIEF_AANVULLING },
      { sleutel: "beperkingsgrond", element: "—", label: "Grond voor beperking", beschrijving: "Waarom de openbaarheid beperkt is: een grond uit artikel 7.2 van de Archiefwet 2026.", type: "keuze", rol: "beperkingsgrond", waardelijst: "archiefwet-beperkingsgrond", aan: true, verplicht: true, toonAls: BEPERKT, aanvulling: ARCHIEF_AANVULLING },
      { sleutel: "beperkingstermijn", element: "—", label: "Duur van de beperking (jaren)", beschrijving: "Hoeveel jaar na de datum van het stuk de beperking geldt: ten hoogste 20, 75 of 110 jaar, afhankelijk van de grond (artikel 7.4).", type: "getal", rol: "beperkingstermijn", aan: true, verplicht: true, toonAls: BEPERKT, aanvulling: ARCHIEF_AANVULLING },
      { sleutel: "beperkingEinddatum", element: "—", label: "Beperking loopt af op", beschrijving: "De datum van het stuk plus de duur; de assistent rekent die voor je uit.", type: "datum", rol: "beperkingEinddatum", aan: true, verplicht: true, toonAls: BEPERKT, aanvulling: ARCHIEF_AANVULLING },
    ],
  },
  tmlo: {
    id: "tmlo",
    naam: "TMLO",
    voluit: "Toepassingsprofiel Metadatering Lokale Overheden",
    versie: "1.2",
    uitleg:
      "De voorganger van MDTO, nog veel gebruikt in bestaande archieven en e-Depots van lokale overheden. Kies dit alleen als je archief nog TMLO verwacht; nieuwe inrichtingen kiezen MDTO.",
    automatisch: ["identificatiekenmerk", "aggregatieniveau", "formaat", "integriteit", "context (archiefvormer)"],
    velden: [
      { sleutel: "naam", element: "naam", label: "Naam", beschrijving: "De naam van het stuk.", type: "tekst", rol: "titel", maxLengte: 200, verplichtInModel: true, aan: true, verplicht: true },
      { sleutel: "omschrijving", element: "omschrijving", label: "Omschrijving", beschrijving: "Waar het stuk over gaat.", type: "lange-tekst", rol: "omschrijving", maxLengte: 2000, aan: true },
      { sleutel: "classificatie", element: "classificatie", label: "Classificatie", beschrijving: "Code en omschrijving uit het classificatieschema.", type: "tekst", maxLengte: 200, aan: true },
      { sleutel: "vertrouwelijkheid", element: "vertrouwelijkheid.classificatieNiveau", label: "Vertrouwelijkheid", beschrijving: "Het classificatieniveau.", type: "keuze", rol: "vertrouwelijkheid", waardelijst: "oa-vertrouwelijkheid", aan: true, verplicht: true },
      { sleutel: "openbaarheid", element: "openbaarheid", label: "Openbaarheid na overbrenging", beschrijving: "Openbaar of beperkt openbaar als het stuk naar het archief gaat (Archiefwet 2026). Beperken kan alleen met een grond uit artikel 7.2.", type: "keuze", rol: "openbaarheid", waardelijst: "archiefwet-openbaarheid", aan: true },
      { sleutel: "beperkingsgrond", element: "openbaarheid.omschrijvingBeperkingen", label: "Grond voor beperking", beschrijving: "Waarom de openbaarheid beperkt is: een grond uit artikel 7.2 van de Archiefwet 2026.", type: "keuze", rol: "beperkingsgrond", waardelijst: "archiefwet-beperkingsgrond", aan: true, verplicht: true, toonAls: BEPERKT },
      { sleutel: "beperkingstermijn", element: "—", label: "Duur van de beperking (jaren)", beschrijving: "Hoeveel jaar na de datum van het stuk de beperking geldt: ten hoogste 20, 75 of 110 jaar, afhankelijk van de grond (artikel 7.4).", type: "getal", rol: "beperkingstermijn", aan: true, verplicht: true, toonAls: BEPERKT, aanvulling: ARCHIEF_AANVULLING },
      { sleutel: "beperkingEinddatum", element: "openbaarheid.datumOfPeriode", label: "Beperking loopt af op", beschrijving: "De datum van het stuk plus de duur; de assistent rekent die voor je uit.", type: "datum", rol: "beperkingEinddatum", aan: true, verplicht: true, toonAls: BEPERKT },
      { sleutel: "taal", element: "taal", label: "Taal", beschrijving: "De taal van het stuk.", type: "keuze", rol: "taal", waardelijst: "iso-639-1", standaard: "nl", aan: true },
      { sleutel: "plaats", element: "plaats", label: "Plaats", beschrijving: "Waar het stuk is opgemaakt.", type: "tekst", maxLengte: 100 },
      { sleutel: "dekkingInTijd", element: "dekking.inTijd", label: "Dekking in tijd", beschrijving: "De periode waar het stuk over gaat.", type: "tekst", maxLengte: 100 },
      { sleutel: "dekkingGeografie", element: "dekking.geografischGebied", label: "Dekking in ruimte", beschrijving: "Het gebied waar het stuk over gaat.", type: "tekst", maxLengte: 200 },
      { sleutel: "eventDatum", element: "eventGeschiedenis.datumOfPeriode", label: "Datum", beschrijving: "Datum van de belangrijkste gebeurtenis, zoals vaststelling of verzending.", type: "datum", rol: "datum", aan: true },
      { sleutel: "activiteit", element: "context.activiteit", label: "Taak", beschrijving: "De taak of het werkproces (activiteit) waarbij het stuk is ontstaan.", type: "tekst", rol: "taak", maxLengte: 200, aan: true },
      { sleutel: "actor", element: "context.actor", label: "Actor", beschrijving: "De persoon of afdeling die het stuk heeft gemaakt.", type: "tekst", rol: "auteur", maxLengte: 200, aan: true },
      { sleutel: "relatie", element: "relatie", label: "Dossier", beschrijving: "Het dossier of de serie waar het stuk bij hoort.", type: "tekst", rol: "dossier", maxLengte: 200, aan: true },
      { sleutel: "zaak", element: "—", label: "Zaak", beschrijving: "Zaaknummer, als het stuk bij een zaak hoort.", type: "tekst", rol: "zaak", maxLengte: 100, aan: true, aanvulling: "Geen element van TMLO; legt de koppeling met het zaaksysteem." },
      { sleutel: "informatiecategorie", element: "—", label: "Informatiecategorie (Woo)", beschrijving: "De categorie uit artikel 3.3 van de Woo.", type: "keuze", rol: "informatiecategorie", waardelijst: "tooi-woo-informatiecategorie", aan: true, verplicht: true, aanvulling: WOO_AANVULLING },
    ],
  },
};

/** De keuze van een gemeente, zoals het beheerportaal haar bewaart. */
export interface VeldKeuze {
  sleutel: string;
  aan: boolean;
  verplicht: boolean;
  label?: string;
  beschrijving?: string;
  waardelijst?: string;
  /** Alleen bij een eigen veld (geen element van het model). */
  eigen?: { type: VeldType; maxLengte?: number; opties?: string[]; rol?: Rol };
  /**
   * Alleen bij de Woo-informatiecategorie: ook de keuze "geen categorie"
   * aanbieden. Niet elk stuk valt in een categorie van artikel 3.3 (een
   * gespreksverslag met een inwoner bijvoorbeeld); zo is ook dat een
   * vastgelegde keuze, en niet een vergeten veld.
   */
  geenCategorie?: boolean;
}

/** De waarde voor een stuk dat in geen informatiecategorie van artikel 3.3 Woo valt. */
export const GEEN_WOO_CATEGORIE = "geen categorie (niet actief openbaar)";
const GEEN_UITLEG = ` Valt het stuk in geen van deze categorieën, zoals een gespreksverslag met een inwoner, kies dan "${GEEN_WOO_CATEGORIE}". Het blijft wel opvraagbaar met een Woo-verzoek.`;

export interface MetadatamodelConfig {
  basis: ModelId;
  /**
   * De naam die de gemeente het model geeft, zoals "RGBZ Haarlem". Leeg: de
   * naam van het basismodel. Een andere naam is ook een nieuwe versie.
   */
  naam?: string;
  /** In de volgorde waarin het paneel ze toont. */
  velden: VeldKeuze[];
}

/** Een nieuwe keuze voor een model: de standaardvelden aan, in de volgorde van de catalogus. */
export function standaardConfig(basis: ModelId): MetadatamodelConfig {
  return {
    basis,
    velden: METADATAMODELLEN[basis].velden.map((v) => ({ sleutel: v.sleutel, aan: !!v.aan, verplicht: !!v.verplicht, ...(v.rol === "informatiecategorie" ? { geenCategorie: true } : {}) })),
  };
}

export interface ConfigProbleem {
  sleutel?: string;
  ernst: "fout" | "waarschuwing";
  melding: string;
}

const SLEUTEL = /^[a-z][A-Za-z0-9]{1,39}$/;

/** Wat er niet klopt aan een keuze. Fouten blokkeren publiceren; waarschuwingen niet. */
export function controleerConfig(c: MetadatamodelConfig): ConfigProbleem[] {
  const model = METADATAMODELLEN[c.basis];
  if (!model) return [{ ernst: "fout", melding: `Onbekend basismodel: ${String(c.basis)}` }];
  const p: ConfigProbleem[] = [];
  if (c.naam !== undefined && c.naam.trim().length > MODELNAAM_MAX) p.push({ ernst: "fout", melding: `De naam van het model is langer dan ${MODELNAAM_MAX} tekens.` });
  const gezien = new Set<string>();
  const rollen = new Map<Rol, string>();
  for (const k of c.velden) {
    if (gezien.has(k.sleutel)) p.push({ sleutel: k.sleutel, ernst: "fout", melding: `Het veld "${k.sleutel}" staat er twee keer in.` });
    gezien.add(k.sleutel);
    const cat = model.velden.find((v) => v.sleutel === k.sleutel);
    if (!cat && !k.eigen) p.push({ sleutel: k.sleutel, ernst: "fout", melding: `"${k.sleutel}" is geen veld van ${model.naam} en ook geen eigen veld.` });
    if (k.eigen) {
      if (cat) p.push({ sleutel: k.sleutel, ernst: "fout", melding: `Een eigen veld mag niet "${k.sleutel}" heten: dat is al een veld van ${model.naam}.` });
      if (!SLEUTEL.test(k.sleutel)) p.push({ sleutel: k.sleutel, ernst: "fout", melding: `De sleutel "${k.sleutel}" mag alleen letters en cijfers bevatten, begint met een kleine letter en is 2 tot 40 tekens.` });
      if (k.eigen.type === "keuze" && !(k.eigen.opties?.length || k.waardelijst)) p.push({ sleutel: k.sleutel, ernst: "fout", melding: `Het keuzeveld "${k.label ?? k.sleutel}" heeft geen opties.` });
    }
    const type = k.eigen?.type ?? cat?.type;
    if (k.geenCategorie && (k.eigen?.rol ?? cat?.rol) !== "informatiecategorie") {
      p.push({ sleutel: k.sleutel, ernst: "fout", melding: `"Geen categorie" kan alleen bij de Woo-informatiecategorie.` });
    }
    if (k.waardelijst && !WAARDELIJSTEN[k.waardelijst]) p.push({ sleutel: k.sleutel, ernst: "fout", melding: `Onbekende waardelijst: ${k.waardelijst}` });
    if (k.waardelijst && type !== "keuze") p.push({ sleutel: k.sleutel, ernst: "fout", melding: `Alleen een keuzeveld kan een waardelijst hebben.` });
    if (k.verplicht && !k.aan) p.push({ sleutel: k.sleutel, ernst: "fout", melding: `"${k.label ?? cat?.label ?? k.sleutel}" is verplicht maar staat uit.` });
    const rol = k.eigen?.rol ?? cat?.rol;
    if (rol && k.aan) {
      if (rollen.has(rol)) p.push({ sleutel: k.sleutel, ernst: "fout", melding: `Twee velden hebben de rol "${rol}": ${rollen.get(rol)} en ${k.sleutel}.` });
      rollen.set(rol, k.sleutel);
    }
    if (cat?.verplichtInModel && !k.verplicht) p.push({ sleutel: k.sleutel, ernst: "waarschuwing", melding: `${model.naam} noemt "${cat.element}" verplicht. Zonder dit veld is overbrengen naar het archief later handwerk.` });
  }
  const titel = c.velden.find((k) => k.aan && (k.eigen?.rol ?? model.velden.find((v) => v.sleutel === k.sleutel)?.rol) === "titel");
  if (!titel) p.push({ ernst: "fout", melding: "Er moet een veld voor de titel (naam) van het stuk aan staan." });
  else if (!titel.verplicht) p.push({ sleutel: titel.sleutel, ernst: "waarschuwing", melding: "De titel is niet verplicht. Stukken zonder naam zijn slecht te vinden." });
  if (!rollen.has("informatiecategorie")) p.push({ ernst: "waarschuwing", melding: "Er staat geen Woo-informatiecategorie aan. Die is nodig om stukken actief openbaar te maken." });
  const woo = c.velden.find((k) => k.aan && (k.eigen?.rol ?? model.velden.find((v) => v.sleutel === k.sleutel)?.rol) === "informatiecategorie");
  if (woo?.verplicht && !woo.geenCategorie) {
    p.push({ sleutel: woo.sleutel, ernst: "waarschuwing", melding: `De Woo-categorie is verplicht, maar "geen categorie" staat uit. Een stuk dat in geen categorie van artikel 3.3 valt (zoals een gespreksverslag met een inwoner), krijgt dan een categorie die niet klopt.` });
  }
  if (!rollen.has("vertrouwelijkheid")) p.push({ ernst: "waarschuwing", melding: "Er staat geen veld voor vertrouwelijkheid aan." });
  // Archiefregeling 2026, artikel 2.5 en 2.12. Classificatie en bewaartermijn komen uit het classificatiemodel.
  if (!rollen.has("datum")) p.push({ ernst: "waarschuwing", melding: "Er staat geen veld voor de datum van het stuk aan. De Archiefregeling 2026 (art. 2.5) vraagt wanneer het stuk is opgemaakt of ontvangen." });
  if (!rollen.has("auteur")) p.push({ ernst: "waarschuwing", melding: "Er staat geen veld voor de auteur of opsteller aan. De Archiefregeling 2026 (art. 2.5) vraagt door wie het stuk is opgemaakt of ontvangen." });
  if (!rollen.has("taak") && !rollen.has("zaak")) p.push({ ernst: "waarschuwing", melding: "Er staat geen veld voor de taak (of de zaak) aan. De Archiefregeling 2026 (art. 2.5) vraagt uit hoofde van welke taak het stuk is opgemaakt of ontvangen." });
  if (!rollen.has("dossier") && !rollen.has("zaak")) p.push({ ernst: "waarschuwing", melding: "Er staat geen veld voor dossier of zaak aan. De Archiefregeling 2026 (art. 2.5) vraagt de samenhang met andere stukken en de plaats in de ordening." });
  if (!rollen.has("openbaarheid")) p.push({ ernst: "waarschuwing", melding: "Er staat geen veld voor openbaarheid na overbrenging aan. De Archiefregeling 2026 (art. 2.12) vraagt die uiterlijk bij overbrenging; vastleggen bij het maken is het eenvoudigst." });
  else for (const r of ["beperkingsgrond", "beperkingstermijn", "beperkingEinddatum"] as const) {
    if (!rollen.has(r)) p.push({ ernst: "waarschuwing", melding: `Openbaarheid staat aan, maar ${r === "beperkingsgrond" ? "de grond" : r === "beperkingstermijn" ? "de duur" : "de einddatum"} van een beperking niet. De Archiefregeling 2026 (art. 2.12) vraagt die bij een beperking.` });
  }
  if (!c.velden.some((k) => k.aan)) p.push({ ernst: "fout", melding: "Er staat geen enkel veld aan." });
  return p;
}

/** Een veld zoals het in het schema komt: catalogus plus de keuze van de gemeente. */
export interface SchemaVeld {
  sleutel: string;
  element: string;
  label: string;
  beschrijving?: string;
  type: VeldType;
  rol?: Rol;
  opties?: readonly string[];
  maxLengte?: number;
  standaard?: string;
  verplicht: boolean;
  eigen: boolean;
  toonAls?: { rol: Rol; waarde: string };
}

/** De velden die aan staan, in volgorde. */
export function actieveVelden(c: MetadatamodelConfig): SchemaVeld[] {
  const model = METADATAMODELLEN[c.basis];
  return c.velden
    .filter((k) => k.aan)
    .map((k): SchemaVeld => {
      const cat = model.velden.find((v) => v.sleutel === k.sleutel);
      const type = k.eigen?.type ?? cat?.type ?? "tekst";
      const lijst = k.waardelijst ?? cat?.waardelijst;
      const geen = !!k.geenCategorie && type === "keuze";
      const opties = type === "keuze" ? (lijst ? WAARDELIJSTEN[lijst]?.waarden : k.eigen?.opties) : undefined;
      const beschrijving = (k.beschrijving?.trim() || cat?.beschrijving) ?? undefined;
      return {
        sleutel: k.sleutel,
        element: cat?.element ?? "eigen veld",
        label: k.label?.trim() || cat?.label || k.sleutel,
        beschrijving: geen ? `${beschrijving ?? ""}${GEEN_UITLEG}`.trim() : beschrijving,
        type,
        rol: k.eigen?.rol ?? cat?.rol,
        opties: opties && geen ? [...opties, GEEN_WOO_CATEGORIE] : opties,
        maxLengte: k.eigen?.maxLengte ?? cat?.maxLengte,
        standaard: cat?.standaard,
        verplicht: k.verplicht,
        eigen: !!k.eigen,
        ...(cat?.toonAls ? { toonAls: cat.toonAls } : {}),
      };
    });
}

/**
 * Het JSON Schema voor het objecttype. Elk veld krijgt het element uit het
 * model (x-mdto, x-rgbz of x-tmlo) en zo nodig zijn rol (x-oa-rol).
 */
export function schemaUitConfig(c: MetadatamodelConfig): Record<string, unknown> {
  const fouten = controleerConfig(c).filter((p) => p.ernst === "fout");
  if (fouten.length) throw new Error(fouten.map((f) => f.melding).join(" "));
  const properties: Record<string, Record<string, unknown>> = {};
  const actief = actieveVelden(c);
  const sleutelVan = (rol: Rol) => actief.find((v) => v.rol === rol)?.sleutel;
  // Velden die alleen gelden als een ander veld een waarde heeft (zoals de grond bij "beperkt openbaar").
  const verplichtAls: { veld: string; waarde: string; velden: string[] }[] = [];
  const voorwaardelijk = new Set<string>();
  for (const v of actief) {
    const veld = v.toonAls && sleutelVan(v.toonAls.rol);
    if (!veld || !v.toonAls) continue;
    voorwaardelijk.add(v.sleutel);
    if (!v.verplicht) continue;
    const regel = verplichtAls.find((r) => r.veld === veld && r.waarde === v.toonAls!.waarde);
    if (regel) regel.velden.push(v.sleutel);
    else verplichtAls.push({ veld, waarde: v.toonAls.waarde, velden: [v.sleutel] });
  }
  for (const v of actief) {
    const e: Record<string, unknown> = { title: v.label };
    if (v.beschrijving) e.description = v.beschrijving;
    if (v.type === "keuze") e.enum = [...(v.opties ?? [])];
    else if (v.type === "getal") e.type = "number";
    else if (v.type === "datum") {
      e.type = "string";
      e.pattern = "^\\d{4}-\\d{2}-\\d{2}$";
      e["x-oa-type"] = "datum";
    } else {
      e.type = "string";
      if (v.maxLengte) e.maxLength = v.maxLengte;
      if (v.type === "lange-tekst") e["x-oa-type"] = "lange-tekst";
    }
    if (v.standaard) e.default = v.standaard;
    if (!v.eigen && v.element !== "—") e[`x-${c.basis}`] = v.element;
    if (v.rol) e["x-oa-rol"] = v.rol;
    if (v.eigen) e["x-oa-eigen"] = true;
    if (v.rol === "beperkingstermijn") Object.assign(e, { type: "integer", minimum: 1, maximum: 110 });
    const toon = v.toonAls && sleutelVan(v.toonAls.rol);
    if (toon && v.toonAls) e["x-oa-toon-als"] = { veld: toon, waarde: v.toonAls.waarde };
    properties[v.sleutel] = e;
  }
  // Artikel 7.4 Archiefwet 2026: de duur hangt af van de grond.
  const grond = sleutelVan("beperkingsgrond");
  const termijn = sleutelVan("beperkingstermijn");
  const allOf = grond && termijn
    ? BEPERKINGSGRONDEN.filter((g) => g.maxJaren < 110).map((g) => ({
        if: { properties: { [grond]: { const: grondWaarde(g) } }, required: [grond] },
        then: { properties: { [termijn]: { maximum: g.maxJaren } } },
      }))
    : [];
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    "x-oa-model": c.basis,
    "x-oa-config": c,
    required: actief.filter((v) => v.verplicht && !voorwaardelijk.has(v.sleutel)).map((v) => v.sleutel),
    ...(verplichtAls.length ? { "x-oa-verplicht-als": verplichtAls } : {}),
    ...(allOf.length ? { allOf } : {}),
    additionalProperties: false,
    properties,
  };
}

/**
 * Welke verplichte velden nog leeg zijn: de vaste (required) en de
 * voorwaardelijke (x-oa-verplicht-als, zoals de grond bij "beperkt
 * openbaar"). Leeg mag; het stuk heet dan onvolledig.
 */
export function ontbrekendeVelden(schema: unknown, metadata: Record<string, unknown> | null | undefined): string[] {
  const s = (schema ?? {}) as { required?: string[]; "x-oa-verplicht-als"?: { veld: string; waarde: string; velden: string[] }[] };
  const m = metadata ?? {};
  const leeg = (k: string) => m[k] === undefined || m[k] === null || m[k] === "";
  const uit = (s.required ?? []).filter(leeg);
  for (const r of s["x-oa-verplicht-als"] ?? []) {
    if (m[r.veld] !== r.waarde) continue;
    for (const k of r.velden) if (leeg(k) && !uit.includes(k)) uit.push(k);
  }
  return uit;
}

export const MODELNAAM_MAX = 80;

/** De naam van een model zoals medewerkers die zien: de eigen naam, of die van het basismodel. */
export function modelnaam(c: Pick<MetadatamodelConfig, "basis" | "naam"> | null | undefined): string {
  if (!c) return "Standaardmodel";
  return c.naam?.trim() || METADATAMODELLEN[c.basis]?.naam || "Standaardmodel";
}

/** Naam en versie van het metadatamodel van een objecttype ("RGBZ Haarlem", 3). */
export function modelVan(type: { versie: number; schema: unknown }): { naam: string; versie: number } {
  return { naam: modelnaam(configUitSchema(type.schema)), versie: type.versie };
}

/** De keuze die bij een schema hoort, als het uit het beheerportaal komt. */
export function configUitSchema(schema: unknown): MetadatamodelConfig | null {
  const c = (schema as { "x-oa-config"?: MetadatamodelConfig } | null)?.["x-oa-config"];
  return c && METADATAMODELLEN[c.basis] && Array.isArray(c.velden) ? c : null;
}

/** Oude schema's (zonder x-oa-rol): de rollen van objecttype document versie 1. */
const ROL_VERSIE_1: Record<string, Rol> = {
  naam: "titel",
  omschrijving: "omschrijving",
  informatiecategorie: "informatiecategorie",
  vertrouwelijkheid: "vertrouwelijkheid",
  taal: "taal",
  dossier: "dossier",
  zaak: "zaak",
};

/** Welke sleutel welke rol heeft in dit schema. */
export function rollenVan(schema: unknown): Partial<Record<Rol, string>> {
  const props = (schema as { properties?: Record<string, Record<string, unknown> & { "x-oa-rol"?: Rol }> } | null)?.properties ?? {};
  const uit: Partial<Record<Rol, string>> = {};
  const heeftRollen = Object.values(props).some((e) => e["x-oa-rol"]);
  for (const [sleutel, e] of Object.entries(props)) {
    const rol = heeftRollen ? e["x-oa-rol"] : ROL_VERSIE_1[sleutel];
    if (rol && !uit[rol]) uit[rol] = sleutel;
  }
  // Een rol die later in de catalogus kwam (zoals status), geldt ook voor een
  // ouder schema: via het element uit het basismodel, als geen ander veld die rol heeft.
  const basis = (schema as { "x-oa-model"?: ModelId } | null)?.["x-oa-model"];
  const model = basis ? METADATAMODELLEN[basis] : undefined;
  if (model && heeftRollen) {
    for (const [sleutel, e] of Object.entries(props)) {
      if (e["x-oa-rol"] || e["x-oa-eigen"]) continue;
      const rol = model.velden.find((v) => v.sleutel === sleutel && v.element === e[`x-${basis}`])?.rol;
      if (rol && !uit[rol]) uit[rol] = sleutel;
    }
  }
  return uit;
}

/** De waarden per rol, voor zoeken, filteren en tonen, ongeacht het model. */
export function rolWaarden(schema: unknown, metadata: Record<string, unknown>): Partial<Record<Rol, string>> {
  const uit: Partial<Record<Rol, string>> = {};
  for (const [rol, sleutel] of Object.entries(rollenVan(schema)) as [Rol, string][]) {
    const w = metadata[sleutel];
    if (w !== undefined && w !== null && w !== "") uit[rol] = String(w);
  }
  return uit;
}
