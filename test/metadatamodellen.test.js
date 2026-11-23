import { test } from "node:test";
import assert from "node:assert/strict";
import {
  METADATAMODELLEN,
  WAARDELIJSTEN,
  OBJECTTYPE_DOCUMENT_V1,
  standaardConfig,
  controleerConfig,
  schemaUitConfig,
  configUitSchema,
  rollenVan,
  rolWaarden,
  modelnaam,
  modelVan,
  GEEN_WOO_CATEGORIE,
} from "../dist/index.js";

test("elk model heeft een titel, en elk veld verwijst naar een bestaande waardelijst", () => {
  for (const m of Object.values(METADATAMODELLEN)) {
    assert.ok(m.velden.some((v) => v.rol === "titel"), m.id);
    for (const v of m.velden) {
      if (v.waardelijst) assert.ok(WAARDELIJSTEN[v.waardelijst], `${m.id}.${v.sleutel}`);
      if (v.type === "keuze") assert.ok(v.waardelijst, `${m.id}.${v.sleutel} keuze zonder lijst`);
    }
    const sleutels = m.velden.map((v) => v.sleutel);
    assert.equal(new Set(sleutels).size, sleutels.length, `dubbele sleutel in ${m.id}`);
    assert.deepEqual(controleerConfig(standaardConfig(m.id)).filter((p) => p.ernst === "fout"), [], `standaard ${m.id} is geldig`);
  }
});

test("MDTO standaard: schema met elementen, rollen en verplichte velden", () => {
  const s = schemaUitConfig(standaardConfig("mdto"));
  assert.deepEqual(s.required, ["naam", "informatiecategorie", "beperkingGebruik"]);
  assert.equal(s.properties.naam["x-mdto"], "naam");
  assert.equal(s.properties.naam["x-oa-rol"], "titel");
  assert.equal(s.properties.beperkingGebruik["x-oa-rol"], "vertrouwelijkheid");
  assert.equal(s.properties.zaak["x-mdto"], undefined, "een aanvulling is geen MDTO-element");
  assert.equal(s.properties.trefwoord, undefined, "staat standaard uit");
  assert.equal(s["x-oa-model"], "mdto");
  assert.deepEqual(configUitSchema(s), standaardConfig("mdto"));
});

test("RGBZ: andere sleutels, dezelfde rollen; datum en drie-letter-taal", () => {
  const s = schemaUitConfig(standaardConfig("rgbz"));
  assert.equal(s.properties.titel["x-rgbz"], "titel");
  assert.equal(s.properties.creatiedatum.pattern, "^\\d{4}-\\d{2}-\\d{2}$");
  assert.equal(s.properties.taal.default, "dut");
  assert.ok(s.properties.taal.enum.includes("dut"));
  assert.deepEqual(rolWaarden(s, { titel: "Besluit", vertrouwelijkheidaanduiding: "intern", taal: "dut" }), { titel: "Besluit", vertrouwelijkheid: "intern", taal: "dut" });
});

test("aanpassen: label, hulptekst, andere waardelijst, eigen veld, volgorde", () => {
  const c = standaardConfig("mdto");
  const naam = c.velden.find((v) => v.sleutel === "naam");
  naam.label = "Titel van het stuk";
  const vertr = c.velden.find((v) => v.sleutel === "beperkingGebruik");
  vertr.waardelijst = "rgbz-vertrouwelijkheidaanduiding";
  c.velden.unshift({ sleutel: "kostenplaats", aan: true, verplicht: false, label: "Kostenplaats", eigen: { type: "tekst", maxLengte: 20 } });
  c.velden.push({ sleutel: "wijk", aan: true, verplicht: true, label: "Wijk", eigen: { type: "keuze", opties: ["Centrum", "Noord", "Schalkwijk"] } });
  const s = schemaUitConfig(c);
  assert.equal(Object.keys(s.properties)[0], "kostenplaats", "volgorde van de keuze");
  assert.equal(s.properties.naam.title, "Titel van het stuk");
  assert.equal(s.properties.beperkingGebruik.enum.length, 8);
  assert.deepEqual(s.properties.wijk.enum, ["Centrum", "Noord", "Schalkwijk"]);
  assert.equal(s.properties.wijk["x-oa-eigen"], true);
  assert.ok(s.required.includes("wijk"));
});

test("fouten en waarschuwingen", () => {
  const zonderTitel = standaardConfig("mdto");
  zonderTitel.velden.find((v) => v.sleutel === "naam").aan = false;
  zonderTitel.velden.find((v) => v.sleutel === "naam").verplicht = false;
  assert.ok(controleerConfig(zonderTitel).some((p) => p.ernst === "fout" && /titel/.test(p.melding)));
  assert.throws(() => schemaUitConfig(zonderTitel), /titel/);

  const c = standaardConfig("rgbz");
  c.velden.find((v) => v.sleutel === "auteur").verplicht = false;
  c.velden.push({ sleutel: "titel2", aan: true, verplicht: false, eigen: { type: "tekst", rol: "titel" } });
  c.velden.push({ sleutel: "Fout veld", aan: true, verplicht: false, eigen: { type: "tekst" } });
  c.velden.push({ sleutel: "leeg", aan: true, verplicht: false, eigen: { type: "keuze" } });
  c.velden.push({ sleutel: "titel", aan: true, verplicht: false, eigen: { type: "tekst" } });
  const p = controleerConfig(c);
  assert.ok(p.some((x) => x.ernst === "waarschuwing" && x.sleutel === "auteur"), "verplicht in RGBZ");
  assert.ok(p.some((x) => x.ernst === "fout" && /twee velden hebben de rol/i.test(x.melding)));
  assert.ok(p.some((x) => x.ernst === "fout" && x.sleutel === "Fout veld"));
  assert.ok(p.some((x) => x.ernst === "fout" && x.sleutel === "leeg"));
  assert.ok(p.some((x) => x.ernst === "fout" && /twee keer/.test(x.melding)));

  const geenWoo = standaardConfig("mdto");
  const ic = geenWoo.velden.find((v) => v.sleutel === "informatiecategorie");
  ic.aan = false;
  ic.verplicht = false;
  assert.ok(controleerConfig(geenWoo).some((x) => x.ernst === "waarschuwing" && /Woo/.test(x.melding)));
});

test("oude schema's (versie 1) krijgen hun rollen uit de vaste veldnamen", () => {
  assert.deepEqual(rollenVan(OBJECTTYPE_DOCUMENT_V1.schema).titel, "naam");
  assert.deepEqual(rolWaarden(OBJECTTYPE_DOCUMENT_V1.schema, { naam: "Brief", informatiecategorie: "adviezen", zaak: "" }), { titel: "Brief", informatiecategorie: "adviezen" });
});

test("de naam van een model: eigen naam, anders die van het basismodel; gaat mee in het schema", () => {
  assert.equal(modelnaam(null), "Standaardmodel");
  assert.equal(modelnaam({ basis: "rgbz" }), "RGBZ");
  assert.equal(modelnaam({ basis: "rgbz", naam: "  " }), "RGBZ");
  const c = { ...standaardConfig("rgbz"), naam: "RGBZ Haarlem" };
  const schema = schemaUitConfig(c);
  assert.deepEqual(modelVan({ versie: 3, schema }), { naam: "RGBZ Haarlem", versie: 3 });
  assert.deepEqual(modelVan({ versie: 1, schema: { properties: {} } }), { naam: "Standaardmodel", versie: 1 });
  assert.ok(controleerConfig({ ...c, naam: "x".repeat(81) }).some((p) => p.ernst === "fout" && /naam van het model/.test(p.melding)));
  assert.equal(rollenVan(schema).status, "status", "de status van RGBZ heeft een rol");
  // Een ouder schema, van voor de rol status: de rol volgt uit het element.
  const oud = structuredClone(schema);
  delete oud.properties.status["x-oa-rol"];
  assert.equal(rollenVan(oud).status, "status");
  assert.equal(rolWaarden(oud, { status: "definitief" }).status, "definitief");
});

test("Woo: ook \"geen categorie\" kan een keuze zijn, alleen bij de informatiecategorie", () => {
  const c = standaardConfig("rgbz");
  assert.equal(c.velden.find((v) => v.sleutel === "informatiecategorie").geenCategorie, true, "nieuwe modellen bieden het aan");
  const s = schemaUitConfig(c);
  assert.ok(s.properties.informatiecategorie.enum.includes(GEEN_WOO_CATEGORIE));
  assert.ok(s.properties.informatiecategorie.enum.includes("beschikkingen"));
  assert.match(s.properties.informatiecategorie.description, /gespreksverslag met een inwoner/);
  const zonder = { ...c, velden: c.velden.map((v) => (v.sleutel === "informatiecategorie" ? { ...v, geenCategorie: false } : v)) };
  assert.equal(schemaUitConfig(zonder).properties.informatiecategorie.enum.includes(GEEN_WOO_CATEGORIE), false);
  const fout = { ...c, velden: c.velden.map((v) => (v.sleutel === "titel" ? { ...v, geenCategorie: true } : v)) };
  assert.ok(controleerConfig(fout).some((p) => p.ernst === "fout" && /Geen categorie/.test(p.melding)));
});

test("Archiefregeling 2026: openbaarheid, grond, duur en einddatum in elk basismodel", async () => {
  const c = await import("../dist/index.js");
  for (const basis of ["mdto", "rgbz", "tmlo"]) {
    const schema = c.schemaUitConfig(c.standaardConfig(basis));
    const r = c.rollenVan(schema);
    for (const rol of ["openbaarheid", "beperkingsgrond", "beperkingstermijn", "beperkingEinddatum"]) assert.ok(r[rol], `${basis}: ${rol}`);
    // Grond, duur en einddatum tonen alleen bij "beperkt openbaar", en zijn dan verplicht.
    assert.deepEqual(schema.properties[r.beperkingsgrond]["x-oa-toon-als"], { veld: r.openbaarheid, waarde: "beperkt openbaar" });
    assert.ok(!schema.required.includes(r.beperkingsgrond));
    const vw = [r.beperkingsgrond, r.beperkingstermijn, r.beperkingEinddatum];
    assert.deepEqual(c.ontbrekendeVelden(schema, { [r.openbaarheid]: "openbaar" }).filter((k) => vw.includes(k)), []);
    assert.deepEqual(
      c.ontbrekendeVelden(schema, { [r.openbaarheid]: "beperkt openbaar" }).filter((k) => [r.beperkingsgrond, r.beperkingstermijn, r.beperkingEinddatum].includes(k)).sort(),
      [r.beperkingsgrond, r.beperkingstermijn, r.beperkingEinddatum].sort(),
    );
    // De maximale duur per grond staat in het schema (artikel 7.4).
    const regel = schema.allOf.find((a) => a.if.properties[r.beperkingsgrond].const.includes("lid 2 onder b"));
    assert.equal(regel.then.properties[r.beperkingstermijn].maximum, 20);
  }
  // MDTO en TMLO hebben een taak (activiteit); RGBZ kent hem als aanvulling, standaard uit (de zaak dekt hem).
  assert.equal(c.rollenVan(c.schemaUitConfig(c.standaardConfig("mdto"))).taak, "activiteit");
  assert.equal(c.rollenVan(c.schemaUitConfig(c.standaardConfig("rgbz"))).taak, undefined);
});

test("Archiefwet 2026: gronden, maximale termijnen en de einddatum", async () => {
  const c = await import("../dist/index.js");
  assert.equal(c.BEPERKINGSGRONDEN.length, 13);
  assert.equal(c.beperkingsgrond("art. 7.2 lid 2 onder e — eerbiediging van de persoonlijke levenssfeer")?.maxJaren, 110);
  assert.equal(c.beperkingsgrond("art. 7.2 lid 1 onder a — eenheid van de Kroon")?.maxJaren, 75);
  assert.equal(c.einddatumBeperking("2026-11-23", 20), "2046-11-23");
  assert.equal(c.einddatumBeperking("2028-02-29", 1), "2029-02-28");
  assert.equal(c.einddatumBeperking("2026-11-23", 0), undefined);
  assert.equal(c.einddatumBeperking("23-11-2026", 5), undefined);
});

test("modelcontrole: waarschuwingen voor wat de Archiefregeling 2026 vraagt", async () => {
  const c = await import("../dist/index.js");
  const leeg = { basis: "mdto", velden: [{ sleutel: "naam", aan: true, verplicht: true }] };
  const m = c.controleerConfig(leeg).map((p) => p.melding).join("\n");
  for (const woord of ["art. 2.5) vraagt wanneer", "door wie", "uit hoofde van welke taak", "samenhang", "art. 2.12"]) assert.ok(m.includes(woord), woord);
  // Het standaardmodel van MDTO geeft geen van deze waarschuwingen.
  const std = c.controleerConfig(c.standaardConfig("mdto")).map((p) => p.melding).join("\n");
  assert.ok(!std.includes("Archiefregeling"), std);
});
