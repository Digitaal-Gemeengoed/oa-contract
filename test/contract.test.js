import { test } from "node:test";
import assert from "node:assert/strict";
import { voldoetAanContract, OBJECTTYPE_DOCUMENT_V1, LEES, VASTLEG } from "../dist/index.js";

test("een werkomgeving met de drie basisvermogens voldoet", () => {
  const r = voldoetAanContract({ id: "x", naam: "X", vermogens: ["inhoud-opleveren", "inhoud-vervangen", "tonen"] });
  assert.equal(r.voldoet, true);
});

test("een ontbrekend basisvermogen wordt genoemd", () => {
  const r = voldoetAanContract({ id: "x", naam: "X", vermogens: ["inhoud-opleveren", "tonen"] });
  assert.deepEqual(r.ontbreekt, ["inhoud-vervangen"]);
});

test("het objecttype document heeft de verplichte MDTO-velden", () => {
  assert.deepEqual(OBJECTTYPE_DOCUMENT_V1.schema.required, ["naam", "informatiecategorie", "vertrouwelijkheid"]);
});

test("paden coderen de identificatie", () => {
  assert.equal(LEES.object("a/b"), "/api/lees/objecten/a%2Fb");
  assert.equal(VASTLEG.versies("x"), "/api/vastleg/objecten/x/versies");
});

test("een weergave van een versie heeft een eigen pad", async () => {
  const { LEES, OPTIONELE_VERMOGENS } = await import("../dist/index.js");
  assert.equal(LEES.weergave("x", 2, "html"), "/api/lees/objecten/x/versies/2/weergaven/html");
  assert.ok(OPTIONELE_VERMOGENS.includes("bestand-opleveren"));
});

test("gemeentenUitToken: organisaties uit Keycloak en de thuisgemeente", async () => {
  const { gemeentenUitToken } = await import("../dist/index.js");
  // Eén organisatie (JSON met attributen): dat is de thuisgemeente.
  assert.deepEqual(gemeentenUitToken({ organization: { haarlem: { naam: ["Gemeente Haarlem"] } } }), {
    thuis: { id: "haarlem", naam: "Gemeente Haarlem" },
    gemeenten: [{ id: "haarlem", naam: "Gemeente Haarlem" }],
  });
  // Meer organisaties (GR): de claim gemeente kiest; zonder claim geen thuisgemeente.
  const gr = { organization: { haarlem: { naam: ["Gemeente Haarlem"] }, zandvoort: { naam: ["Gemeente Zandvoort"] } } };
  assert.equal(gemeentenUitToken({ ...gr, gemeente: "zandvoort" }).thuis?.id, "zandvoort");
  assert.equal(gemeentenUitToken(gr).thuis, null);
  assert.equal(gemeentenUitToken({ ...gr, gemeente: "bloemendaal" }).thuis, null);
  // Lijst van aliassen (mapper zonder attributen): naam uit het id.
  assert.deepEqual(gemeentenUitToken({ organization: ["den-haag"] }).thuis, { id: "den-haag", naam: "Gemeente Den-Haag" });
  // Zonder organisaties: zoals vroeger alleen de claim gemeente.
  assert.deepEqual(gemeentenUitToken({ gemeente: "haarlem" }), { thuis: { id: "haarlem", naam: "Gemeente Haarlem" }, gemeenten: [] });
  assert.equal(gemeentenUitToken({ gemeente: "Haarlem!" }).thuis, null);
  // Ongeldige aliassen tellen niet mee.
  assert.deepEqual(gemeentenUitToken({ organization: { "Foute Naam": {}, haarlem: {} } }).gemeenten.map((g) => g.id), ["haarlem"]);
});
