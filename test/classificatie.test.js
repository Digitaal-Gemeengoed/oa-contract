import { test } from "node:test";
import assert from "node:assert/strict";
import {
  telOp,
  duurInWoorden,
  standaardClassificatiemodel,
  controleerClassificatiemodel,
  resultatenInGebruik,
  bepaalBewaren,
  isVergrendeld,
  classificatiemodelnaam,
  ONDERSTEUNEND,
  OPZET_ONDERSTEUNEND,
  isOndersteunend,
  ondersteunendeKlassen,
  ondersteunendResultaat,
} from "../dist/index.js";
import { SELECTIELIJST_2020 as L } from "@digitaalgemeengoed/oa-contract/selectielijst";

const STATUSSEN = ["in bewerking", "ter vaststelling", "definitief", "gearchiveerd"];

test("de Selectielijst 2020: 29 procestypen, resultaten met waardering en termijn", () => {
  assert.equal(L.procestypen.length, 29);
  assert.ok(L.resultaten.length > 300);
  const r = L.resultaten.find((x) => x.id === "1.1");
  assert.deepEqual([r.naam, r.waardering, r.procestermijn, r.bewaartermijn], ["Ingericht", "vernietigen", "nihil", "P10Y"]);
  assert.equal(L.resultaten.find((x) => x.id === "1.1.1").waardering, "blijvend-bewaren");
  for (const x of L.resultaten) {
    assert.ok(x.waardering, x.id);
    if (x.waardering === "vernietigen") assert.ok(x.bewaartermijn || x.bewaartermijnTekst, `${x.id} heeft een termijn`);
    else assert.equal(x.bewaartermijn, undefined, `${x.id}: blijvend bewaren heeft geen termijn`);
    if (x.generiek) assert.ok(L.resultaten.some((g) => g.id === x.generiek), `${x.id} hangt onder ${x.generiek}`);
  }
});

test("datums: een duur optellen, in woorden", () => {
  assert.equal(telOp("2026-11-10", "P10Y"), "2036-11-10");
  assert.equal(telOp("2024-02-29", "P1Y"), "2025-02-28");
  assert.equal(telOp("2026-01-31", "P1M"), "2026-02-28");
  assert.equal(telOp("2026-11-10", "P1Y6M"), "2028-05-10");
  assert.equal(telOp("2026-11-10", "P6W"), "2026-12-22");
  assert.equal(telOp("2026-11-10", "P0D"), "2026-11-10");
  assert.equal(duurInWoorden("P1Y6M"), "1 jaar en 6 maanden");
  assert.equal(duurInWoorden("P0D"), "direct");
});

test("het model toetsen: ten minste één status om te vergrendelen; afwijken alleen met een reden", () => {
  const c = standaardClassificatiemodel();
  assert.deepEqual(controleerClassificatiemodel(c, L, STATUSSEN), []);
  assert.ok(controleerClassificatiemodel({ ...c, vergrendelBij: [] }, L, STATUSSEN).some((p) => p.ernst === "fout" && /ten minste één status/.test(p.melding)));
  assert.ok(controleerClassificatiemodel({ ...c, vergrendelBij: ["klaar"] }, L, STATUSSEN).some((p) => /geen status/.test(p.melding)));
  assert.ok(controleerClassificatiemodel(c, L, null).some((p) => p.ernst === "waarschuwing" && /geen statusveld/.test(p.melding)));
  const afw = { ...c, afwijkingen: [{ resultaat: "1.1", bewaartermijn: "P12Y", reden: "" }] };
  assert.ok(controleerClassificatiemodel(afw, L, STATUSSEN).some((p) => /reden/.test(p.melding)));
  assert.ok(controleerClassificatiemodel({ ...c, afwijkingen: [{ resultaat: "1.1.1", waardering: "vernietigen", bewaartermijn: "P20Y", reden: "Eigen beleid" }] }, L, STATUSSEN).some((p) => p.ernst === "waarschuwing" && /archivaris/.test(p.melding)));
  assert.ok(controleerClassificatiemodel({ ...c, attributen: [{ sleutel: "biv", label: "BIV", type: "keuze", verplicht: false }] }, L, STATUSSEN).some((p) => /geen opties/.test(p.melding)));
  assert.equal(classificatiemodelnaam(c, L), L.naam);
  assert.equal(classificatiemodelnaam({ naam: "Haarlem 2026" }, L), "Haarlem 2026");
});

test("in gebruik: uitgezette resultaten vallen weg, afwijkingen tellen", () => {
  const c = { ...standaardClassificatiemodel(), uitgezet: ["1.1.2"], afwijkingen: [{ resultaat: "1.1", bewaartermijn: "P12Y", reden: "Langer voor de audit" }] };
  const r = resultatenInGebruik(c, L);
  assert.equal(r.some((x) => x.id === "1.1.2"), false);
  assert.equal(r.find((x) => x.id === "1.1").bewaartermijn, "P12Y");
});

test("bewaren: termijn vanaf definitief; blijvend; procesobject; met afwijking", () => {
  const c = standaardClassificatiemodel();
  const nog = bepaalBewaren(c, L, { resultaat: "1.1" }, {});
  assert.equal(nog.archiefactiedatum, undefined);
  assert.match(nog.uitleg, /10 jaar na definitief \(het stuk is nog niet definitief\)/);
  const b = bepaalBewaren(c, L, { resultaat: "1.1" }, { definitief: "2026-11-10" });
  assert.deepEqual([b.brondatum, b.archiefactiedatum], ["2026-11-10", "2036-11-10"]);
  assert.equal(b.uitleg, "Vernietigen na 10-11-2036: 10 jaar na definitief (10-11-2026).");
  assert.equal(bepaalBewaren(c, L, { resultaat: "1.1.1" }, { definitief: "2026-11-10" }).waardering, "blijvend-bewaren");
  const po = L.resultaten.find((x) => x.procestermijn === "procesobject" && x.bewaartermijn);
  const p1 = bepaalBewaren(c, L, { resultaat: po.id }, { definitief: "2026-11-10" });
  assert.equal(p1.start, "procesobject");
  assert.equal(p1.archiefactiedatum, undefined, "de status telt niet: het procesobject bestaat nog");
  assert.equal(bepaalBewaren(c, L, { resultaat: po.id, einddatumProcesobject: "2030-01-01" }).archiefactiedatum, telOp("2030-01-01", po.bewaartermijn));
  const afw = bepaalBewaren({ ...c, afwijkingen: [{ resultaat: "1.1", bewaartermijn: "P12Y", reden: "Langer" }] }, L, { resultaat: "1.1" }, { definitief: "2026-11-10" });
  assert.deepEqual([afw.archiefactiedatum, afw.afgeweken], ["2038-11-10", true]);
  assert.equal(bepaalBewaren(c, L, { resultaat: "99.9" }), null);
  assert.equal(isVergrendeld("definitief", c), true);
  assert.equal(isVergrendeld("in bewerking", c), false);
  assert.equal(isVergrendeld(undefined, c), false);
});

test("zoektermen: getoetst en meegegeven met de resultaten in gebruik", () => {
  const c = { ...standaardClassificatiemodel(), uitgezet: ["1.1"], zoektermen: [{ resultaat: "3.1", termen: ["projectplan", " plan van aanpak "] }, { resultaat: "1.1", termen: ["x1"] }] };
  const p = controleerClassificatiemodel(c, L, ["concept", "definitief"]);
  assert.ok(p.some((x) => x.sleutel === "1.1" && x.ernst === "waarschuwing"), "zoektermen bij een uitgezet resultaat");
  assert.ok(!p.some((x) => x.ernst === "fout"), JSON.stringify(p));
  assert.ok(controleerClassificatiemodel({ ...c, zoektermen: [{ resultaat: "99.9", termen: ["a"] }] }, L).some((x) => x.ernst === "fout"));
  const r = resultatenInGebruik(c, L).find((x) => x.id === "3.1");
  assert.deepEqual(r.zoektermen, ["projectplan", "plan van aanpak"]);
});

test("ondersteunend: getoetst; de termijn loopt vanaf het classificeren", () => {
  const o = { omschrijving: "Kopieën, kladversies en stukken ter kennisname", bewaartermijn: "P1Y", grondslag: "Richtlijn informatiebeheer 2026" };
  const c = { ...standaardClassificatiemodel(), ondersteunend: o };
  assert.ok(!controleerClassificatiemodel(c, L, ["definitief"]).some((x) => x.ernst === "fout"));
  assert.equal(controleerClassificatiemodel({ ...c, ondersteunend: { ...o, grondslag: "" } }, L, ["definitief"]).filter((x) => x.sleutel === ONDERSTEUNEND && x.ernst === "fout").length, 1);
  const b = bepaalBewaren(c, L, { resultaat: ONDERSTEUNEND, op: "2026-11-19T10:00:00Z" });
  assert.equal(b.start, "classificatie");
  assert.equal(b.archiefactiedatum, "2027-11-19");
  assert.match(b.uitleg, /Richtlijn informatiebeheer 2026/);
  assert.equal(bepaalBewaren(standaardClassificatiemodel(), L, { resultaat: ONDERSTEUNEND }), null, "zonder ondersteunend in het model");
  assert.equal(ondersteunendResultaat(o).id, ONDERSTEUNEND);
});

test("ondersteunend met categorieën en toetsvragen: de opzet klopt, elke categorie een eigen termijn", () => {
  const c = { ...standaardClassificatiemodel(), ondersteunend: OPZET_ONDERSTEUNEND };
  assert.deepEqual(controleerClassificatiemodel(c, L, ["definitief"]).filter((x) => x.sleutel === ONDERSTEUNEND), [], "de opzet zelf heeft geen problemen");
  assert.deepEqual(ondersteunendeKlassen(OPZET_ONDERSTEUNEND).map((k) => [k.id, k.bewaartermijn]), [
    ["ondersteunend.O1", "P1Y"], ["ondersteunend.O2", "P1Y"], ["ondersteunend.O3", "P6M"], ["ondersteunend.O4", "P1Y"], ["ondersteunend.O5", "P6M"],
  ]);
  assert.equal(ondersteunendResultaat(OPZET_ONDERSTEUNEND), undefined, "met categorieën bestaat het kale ondersteunend niet");
  assert.ok(isOndersteunend("ondersteunend.O3") && isOndersteunend(ONDERSTEUNEND) && !isOndersteunend("1.1") && !isOndersteunend(null));
  const b = bepaalBewaren(c, L, { resultaat: "ondersteunend.O3", op: "2026-11-19T10:00:00Z" });
  assert.equal(b.archiefactiedatum, "2027-05-19");
  assert.equal(b.klasse, "Ondersteunend · O3 Tussenversie");
  assert.match(b.uitleg, /6 maanden na het classificeren/);
  assert.equal(bepaalBewaren(c, L, { resultaat: "ondersteunend.O9" }), null);
  // Fouten in categorieën.
  const fout = (o) => controleerClassificatiemodel({ ...c, ondersteunend: { ...OPZET_ONDERSTEUNEND, ...o } }, L).filter((x) => x.sleutel === ONDERSTEUNEND && x.ernst === "fout");
  const k = OPZET_ONDERSTEUNEND.categorieen;
  assert.equal(fout({ categorieen: [...k, k[0]] }).length, 1, "dubbele code");
  assert.equal(fout({ categorieen: [{ ...k[0], code: "o1" }] }).length, 1, "code met kleine letter");
  assert.equal(fout({ categorieen: [{ ...k[0], bewaartermijn: "een jaar" }] }).length, 1);
  assert.equal(fout({ toetsvragen: ["Kort?"] }).length, 1);
  assert.ok(controleerClassificatiemodel({ ...c, ondersteunend: { ...OPZET_ONDERSTEUNEND, toetsvragen: [] } }, L).some((x) => x.sleutel === ONDERSTEUNEND && x.ernst === "waarschuwing"));
});
