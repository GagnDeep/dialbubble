/**
 * E.164 formatting and length hints. Pure functions, usable in the browser and under `node --test`.
 *
 * The country data below is derived from Google's libphonenumber metadata (PhoneNumberMetadata.xml,
 * Apache License 2.0, fetched November 2026). Fields: ISO region; calling code; national prefix;
 * national lengths for landline and mobile numbers; national lengths for every number type;
 * international dialing prefix pattern; English name.
 */
const RAW_COUNTRIES: readonly string[] = [
  "AC;247;;5;5,6;00;Ascension Island",
  "AD;376;;6,9;6,8,9;00;Andorra",
  "AE;971;0;8,9;5,6,7,8,9,10,11,12;00;United Arab Emirates",
  "AF;93;0;9;9;00;Afghanistan",
  "AG;1;1;10;10;011;Antigua & Barbuda",
  "AI;1;1;10;10;011;Anguilla",
  "AL;355;0;8,9;6,7,8,9;00;Albania",
  "AM;374;0;8;8;00;Armenia",
  "AO;244;;9;9;00;Angola",
  "AR;54;0;10,11;10,11;00;Argentina",
  "AS;1;1;10;10;011;American Samoa",
  "AT;43;0;4,5,6,7,8,9,10,11,12,13;4,5,6,7,8,9,10,11,12,13;00;Austria",
  "AU;61;0;9;5,6,7,8,9,10,12;001[14-689]|14(?:1[14]|34|4[17]|[56]6|7[47]|88)0011;Australia",
  "AW;297;;7;7;00;Aruba",
  "AX;358;0;6,7,8,9,10;5,6,7,8,9,10,11,12;00|99(?:[01469]|5(?:[14]1|3[23]|5[59]|77|88|9[09]));Åland Islands",
  "AZ;994;0;9;9;00;Azerbaijan",
  "BA;387;0;8,9;8,9;00;Bosnia & Herzegovina",
  "BB;1;1;10;10;011;Barbados",
  "BD;880;0;6,7,8,9,10;6,7,8,9,10;00;Bangladesh",
  "BE;32;0;8,9;8,9;00;Belgium",
  "BF;226;;8;8;00;Burkina Faso",
  "BG;359;0;6,7,8,9;6,7,8,9,12;00;Bulgaria",
  "BH;973;;8;8;00;Bahrain",
  "BI;257;;8;8;00;Burundi",
  "BJ;229;;10;8,10;00;Benin",
  "BL;590;0;9;9;00;St. Barthélemy",
  "BM;1;1;10;10;011;Bermuda",
  "BN;673;;7;7;00;Brunei",
  "BO;591;0;8;8,9;00(?:1\\d)?;Bolivia",
  "BQ;599;;7;7;00;Caribbean Netherlands",
  "BR;55;0;10,11;8,9,10,11;00(?:1[245]|2[1-35]|31|4[13]|[56]5|99);Brazil",
  "BS;1;1;10;10;011;Bahamas",
  "BT;975;;7,8;7,8;00;Bhutan",
  "BW;267;;7,8;7,8,10;00;Botswana",
  "BY;375;8;9;6,7,8,9,10,11;810;Belarus",
  "BZ;501;;7;7,11;00;Belize",
  "CA;1;1;10;7,10;011;Canada",
  "CC;61;0;9;6,7,8,9,10,12;001[14-689]|14(?:1[14]|34|4[17]|[56]6|7[47]|88)0011;Cocos (Keeling) Islands",
  "CD;243;0;7,8,9,10;7,8,9,10;00;Congo - Kinshasa",
  "CF;236;;8;8;00;Central African Republic",
  "CG;242;;9;9;00;Congo - Brazzaville",
  "CH;41;0;9;9,12;00;Switzerland",
  "CI;225;;10;10;00;Côte d’Ivoire",
  "CK;682;;5;5;00;Cook Islands",
  "CL;56;;9;9,10,11;(?:0|1(?:1[0-69]|2[02-5]|5[13-58]|69|7[0167]|8[018]))0;Chile",
  "CM;237;;9;8,9;00;Cameroon",
  "CN;86;0;7,8,9,10,11;7,8,9,10,11,12;00|1(?:[12]\\d|79)\\d\\d00;China",
  "CO;57;0;8,10;8,10,11;00(?:4(?:[14]4|56)|[579]);Colombia",
  "CR;506;;8;8,10;00;Costa Rica",
  "CU;53;0;6,7,8,10;6,7,8,10;119;Cuba",
  "CV;238;;7;7;0;Cape Verde",
  "CW;599;;7,8;7,8;00;Curaçao",
  "CX;61;0;9;6,7,8,9,10,12;001[14-689]|14(?:1[14]|34|4[17]|[56]6|7[47]|88)0011;Christmas Island",
  "CY;357;;8;8;00;Cyprus",
  "CZ;420;;9;9,10,11,12;00;Czechia",
  "DE;49;0;5,6,7,8,9,10,11,12,13,14,15;4,5,6,7,8,9,10,11,12,13,14,15;00;Germany",
  "DJ;253;;8;8;00;Djibouti",
  "DK;45;;8;8;00;Denmark",
  "DM;1;1;10;10;011;Dominica",
  "DO;1;1;10;10;011;Dominican Republic",
  "DZ;213;0;8,9;8,9;00;Algeria",
  "EC;593;0;8,9;8,9,10,11;00;Ecuador",
  "EE;372;;7,8;7,8,10;00;Estonia",
  "EG;20;0;8,9,10;8,9,10;00;Egypt",
  "EH;212;0;9;9;00;Western Sahara",
  "ER;291;0;7;7;00;Eritrea",
  "ES;34;;9;9;00;Spain",
  "ET;251;0;9;9;00;Ethiopia",
  "FI;358;0;5,6,7,8,9,10;5,6,7,8,9,10,11,12;00|99(?:[01469]|5(?:[14]1|3[23]|5[59]|77|88|9[09]));Finland",
  "FJ;679;;7;7,11;0(?:0|52);Fiji",
  "FK;500;;5;5;00;Falkland Islands",
  "FM;691;;7;7;00;Micronesia",
  "FO;298;;6;6;00;Faroe Islands",
  "FR;33;0;9;9;00;France",
  "GA;241;;7,8;7,8;00;Gabon",
  "GB;44;0;9,10;7,9,10;00;United Kingdom",
  "GD;1;1;10;10;011;Grenada",
  "GE;995;0;9;9;00;Georgia",
  "GF;594;0;9;9;00;French Guiana",
  "GG;44;0;10;7,9,10;00;Guernsey",
  "GH;233;0;9;8,9;00;Ghana",
  "GI;350;;8;8;00;Gibraltar",
  "GL;299;;6;6;00;Greenland",
  "GM;220;;7,9;7,9;00;Gambia",
  "GN;224;;8,9;8,9;00;Guinea",
  "GP;590;0;9;9;00;Guadeloupe",
  "GQ;240;;9;9;00;Equatorial Guinea",
  "GR;30;;10;10,11,12;00;Greece",
  "GT;502;;8;8,11;00;Guatemala",
  "GU;1;1;10;10;011;Guam",
  "GW;245;;9;7,9;00;Guinea-Bissau",
  "GY;592;;7;7;001;Guyana",
  "HK;852;;8;5,6,7,8,9,11;00(?:30|5[09]|[126-9]?);Hong Kong SAR China",
  "HN;504;;8;8,11;00;Honduras",
  "HR;385;0;8,9;7,8,9;00;Croatia",
  "HT;509;;8;8;00;Haiti",
  "HU;36;06;8,9;8,9;00;Hungary",
  "ID;62;0;7,8,9,10,11,12;7,8,9,10,11,12,13,14,15,16,17;00[89];Indonesia",
  "IE;353;0;7,8,9,10;7,8,9,10;00;Ireland",
  "IL;972;0;8,9,11,12;7,8,9,10,11,12;0(?:0|1(?:05|[2-9]));Israel",
  "IM;44;0;10;10;00;Isle of Man",
  "IN;91;0;10;8,9,10,11,12,13;00;India",
  "IO;246;;7;7;00;British Indian Ocean Territory",
  "IQ;964;0;8,9,10;8,9,10;00;Iraq",
  "IR;98;0;6,7,10;4,5,6,7,10;00;Iran",
  "IS;354;;7,9;7,9;00|1(?:0(?:01|[12]0)|100);Iceland",
  "IT;39;;6,7,8,9,10,11,12;6,7,8,9,10,11,12;00;Italy",
  "JE;44;0;10;10;00;Jersey",
  "JM;1;1;10;10;011;Jamaica",
  "JO;962;0;8,9;8,9;00;Jordan",
  "JP;81;0;9,10;8,9,10,11,12,13,14,15,16,17;010;Japan",
  "KE;254;0;7,8,9;7,8,9,10;000;Kenya",
  "KG;996;0;9;9,10;00;Kyrgyzstan",
  "KH;855;0;8,9;8,9,10;00[14-9];Cambodia",
  "KI;686;0;5,8;5,8;00;Kiribati",
  "KM;269;;7;7;00;Comoros",
  "KN;1;1;10;10;011;St. Kitts & Nevis",
  "KP;850;0;8,10;8,10;00|99;North Korea",
  "KR;82;0;5,6,8,9,10;5,6,8,9,10,11,12,13,14;00(?:[125689]|3(?:[46]5|91)|7(?:00|27|3|55|6[126]));South Korea",
  "KW;965;;8;7,8;00;Kuwait",
  "KY;1;1;10;10;011;Cayman Islands",
  "KZ;7;8;10;10,14;810;Kazakhstan",
  "LA;856;0;8,9,10;8,9,10;00;Laos",
  "LB;961;0;7,8;7,8;00;Lebanon",
  "LC;1;1;10;10;011;St. Lucia",
  "LI;423;0;7,9;7,9;00;Liechtenstein",
  "LK;94;0;9;9;00;Sri Lanka",
  "LR;231;0;7,8,9;7,8,9;00;Liberia",
  "LS;266;;8;8;00;Lesotho",
  "LT;370;0;8;8;00;Lithuania",
  "LU;352;;4,5,6,7,8,9,10,11;4,5,6,7,8,9,10,11;00;Luxembourg",
  "LV;371;;8;8;00;Latvia",
  "LY;218;0;9;9;00;Libya",
  "MA;212;0;9;9;00;Morocco",
  "MC;377;0;8,9;8,9;00;Monaco",
  "MD;373;0;8;8;00;Moldova",
  "ME;382;0;8;8,9;00;Montenegro",
  "MF;590;0;9;9;00;St. Martin",
  "MG;261;0;9;9;00;Madagascar",
  "MH;692;1;7;7;011;Marshall Islands",
  "MK;389;0;8;8;00;North Macedonia",
  "ML;223;;8;8;00;Mali",
  "MM;95;0;6,7,8,9,10;6,7,8,9,10;00;Myanmar",
  "MN;976;0;8,9,10;8,9,10;001;Mongolia",
  "MO;853;;8;7,8;00;Macao SAR China",
  "MP;1;1;10;10;011;Northern Mariana Islands",
  "MQ;596;0;9;9;00;Martinique",
  "MR;222;;8;8;00;Mauritania",
  "MS;1;1;10;10;011;Montserrat",
  "MT;356;;8;8;00;Malta",
  "MU;230;;7,8;7,8,10;0(?:0|[24-7]0|3[03]);Mauritius",
  "MV;960;;7;7,10;0(?:0|19);Maldives",
  "MW;265;0;7,9;7,9;00;Malawi",
  "MX;52;;10;10;0[09];Mexico",
  "MY;60;0;8,9,10;8,9,10;00;Malaysia",
  "MZ;258;;8,9;8,9;00;Mozambique",
  "NA;264;0;8,9;8,9;00;Namibia",
  "NC;687;;6;6;00;New Caledonia",
  "NE;227;;8;8;00;Niger",
  "NF;672;;6;6;00;Norfolk Island",
  "NG;234;0;10;10,11,12,13,14;009;Nigeria",
  "NI;505;;8;8;00;Nicaragua",
  "NL;31;0;9,11;5,6,7,8,9,10,11;00;Netherlands",
  "NO;47;;8;5,8;00;Norway",
  "NP;977;0;8,10;8,10,11;00;Nepal",
  "NR;674;;7;7;00;Nauru",
  "NU;683;;4,7;4,7;00;Niue",
  "NZ;64;0;8,9,10;5,6,7,8,9,10;0(?:0|161);New Zealand",
  "OM;968;;8;7,8,9;00;Oman",
  "PA;507;;7,8;7,8,10,11;00;Panama",
  "PE;51;0;8,9;8,9;00|19(?:1[124]|77|90)00;Peru",
  "PF;689;;8;6,8,9;00;French Polynesia",
  "PG;675;;7,8;7,8;00|140[1-3];Papua New Guinea",
  "PH;63;0;6,8,9,10;6,8,9,10,11,12,13;00;Philippines",
  "PK;92;0;9,10;8,9,10,11,12;00;Pakistan",
  "PL;48;;7,9;6,7,8,9,10;00;Poland",
  "PM;508;0;6,9;6,9;00;St. Pierre & Miquelon",
  "PR;1;1;10;10;011;Puerto Rico",
  "PS;970;0;8,9;8,9,10;00;Palestinian Territories",
  "PT;351;;9;9;00;Portugal",
  "PW;680;;7;7;01[12];Palau",
  "PY;595;0;7,8,9;6,7,8,9,10,11;00;Paraguay",
  "QA;974;;8;7,8,9,11;00;Qatar",
  "RE;262;0;9;9;00;Réunion",
  "RO;40;0;6,9;6,9;00;Romania",
  "RS;381;0;7,8,9,10,11,12;6,7,8,9,10,11,12;00;Serbia",
  "RU;7;8;10;10,14;810;Russia",
  "RW;250;0;8,9;8,9;00;Rwanda",
  "SA;966;0;9;9,10;00;Saudi Arabia",
  "SB;677;;5,7;5,7;0[01];Solomon Islands",
  "SC;248;;7;7;010|0[0-2];Seychelles",
  "SD;249;0;9;9;00;Sudan",
  "SE;46;0;7,8,9;6,7,8,9,10,12;00;Sweden",
  "SG;65;;8;8,10,11;0[0-3]\\d;Singapore",
  "SH;290;;4,5;4,5;00;St. Helena",
  "SI;386;0;8;5,6,7,8;00|10(?:22|66|88|99);Slovenia",
  "SJ;47;;8;5,8;00;Svalbard & Jan Mayen",
  "SK;421;0;6,7,9;6,7,9;00;Slovakia",
  "SL;232;0;8;8;00;Sierra Leone",
  "SM;378;;8,10;8,10;00;San Marino",
  "SN;221;;9;9;00;Senegal",
  "SO;252;0;6,7,8,9;6,7,8,9;00;Somalia",
  "SR;597;;6,7;6,7;00;Suriname",
  "SS;211;0;9;9;00;South Sudan",
  "ST;239;;7;7;00;São Tomé & Príncipe",
  "SV;503;;8;7,8,11;00;El Salvador",
  "SX;1;1;10;10;011;Sint Maarten",
  "SY;963;0;8,9;8,9;00;Syria",
  "SZ;268;;8;8,9;00;Eswatini",
  "TA;290;;4;4;00;Tristan da Cunha",
  "TC;1;1;10;10;011;Turks & Caicos Islands",
  "TD;235;;8;8;00|16;Chad",
  "TG;228;;8;8;00;Togo",
  "TH;66;0;8,9;8,9,10,13;00[1-9];Thailand",
  "TJ;992;;9;9;810;Tajikistan",
  "TK;690;;4,5,6,7;4,5,6,7;00;Tokelau",
  "TL;670;;7,8;7,8;00;Timor-Leste",
  "TM;993;8;8;8;810;Turkmenistan",
  "TN;216;;8;8;00;Tunisia",
  "TO;676;;5,7;5,7;00;Tonga",
  "TR;90;0;10;7,10,12,13;00;Türkiye",
  "TT;1;1;10;10;011;Trinidad & Tobago",
  "TV;688;;5,6,7;5,6,7;00;Tuvalu",
  "TW;886;0;8,9;7,8,9,10,11;0(?:0[25-79]|19);Taiwan",
  "TZ;255;0;9;9;00[056];Tanzania",
  "UA;380;0;9;9,10;00;Ukraine",
  "UG;256;0;9;9;00[057];Uganda",
  "US;1;1;10;10;011;United States",
  "UY;598;0;8;4,5,6,7,8,9,10,11,12,13;0(?:0|1[3-9]\\d);Uruguay",
  "UZ;998;;9;9;00;Uzbekistan",
  "VA;39;;6,7,8,9,10,11;6,7,8,9,10,11,12;00;Vatican City",
  "VC;1;1;10;10;011;St. Vincent & Grenadines",
  "VE;58;0;10;10;00;Venezuela",
  "VG;1;1;10;10;011;British Virgin Islands",
  "VI;1;1;10;10;011;U.S. Virgin Islands",
  "VN;84;0;9,10;7,8,9,10;00;Vietnam",
  "VU;678;;5,7;5,7;00;Vanuatu",
  "WF;681;;6;6,9;00;Wallis & Futuna",
  "WS;685;;5,6,7,10;5,6,7,10;0;Samoa",
  "XK;383;0;8,9,10,11,12;8,9,10,11,12;00;Kosovo",
  "YE;967;0;7,8,9;7,8,9;00;Yemen",
  "YT;262;0;9;9;00;Mayotte",
  "ZA;27;0;5,6,7,8,9;5,6,7,8,9,10;00;South Africa",
  "ZM;260;0;9;9;00;Zambia",
  "ZW;263;0;7,9;7,9,10;00;Zimbabwe",
  "001;800;;8;8;;Non-geographic",
  "001;808;;8;8;;Non-geographic",
  "001;870;;9,12;9,12;;Non-geographic",
  "001;878;;12;12;;Non-geographic",
  "001;881;;9,10;9,10;;Non-geographic",
  "001;882;;7,8,9,10,12;7,8,9,10,11,12;;Non-geographic",
  "001;883;;8,9,10,11,12;8,9,10,11,12;;Non-geographic",
  "001;888;;11;11;;Non-geographic",
  "001;979;;9;9;;Non-geographic",
];

export type Country = {
  iso: string;
  name: string;
  code: string;
  nationalPrefix: string;
  typical: number[];
  all: number[];
  idd: RegExp | null;
};

function nums(list: string | undefined): number[] {
  return list ? list.split(",").map(Number) : [];
}

const parsed: Country[] = RAW_COUNTRIES.map((row) => {
  const [iso = "", code = "", nationalPrefix = "", typical, all, idd, name = ""] = row.split(";");
  return {
    iso,
    code,
    nationalPrefix,
    typical: nums(typical),
    all: nums(all),
    idd: idd ? new RegExp(`^(?:${idd})`) : null,
    name,
  };
});

/** Countries and territories, sorted by name. Non-geographic calling codes such as +800 are left out. */
export const COUNTRIES: readonly Country[] = parsed
  .filter((c) => c.iso !== "001")
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

const byIso = new Map(COUNTRIES.map((c) => [c.iso, c]));
const byCode = new Map<string, Country[]>();
for (const c of parsed) {
  const list = byCode.get(c.code);
  if (list) list.push(c);
  else byCode.set(c.code, [c]);
}

export function getCountry(iso: string): Country | undefined {
  return byIso.get(iso);
}

export type NumberStatus = "ok" | "check" | "invalid";

export type FormatResult = {
  input: string;
  /** The E.164 number, or null when one can't be built. */
  e164: string | null;
  status: NumberStatus;
  /** What this tool did or what looks wrong, in plain words. */
  note: string;
  /** The country the calling code belongs to, when known. */
  country: string | null;
};

const MAX_DIGITS = 15;

/** Finds the calling code at the start of a digit string. Codes are prefix-free, so longest match isn't needed. */
export function splitCallingCode(digits: string): { code: string; rest: string; countries: Country[] } | null {
  for (let len = 1; len <= 3; len++) {
    const code = digits.slice(0, len);
    const countries = byCode.get(code);
    if (countries) return { code, rest: digits.slice(len), countries };
  }
  return null;
}

function union(list: Country[], key: "typical" | "all"): Set<number> {
  const out = new Set<number>();
  for (const c of list) for (const n of c[key]) out.add(n);
  return out;
}

function describeLengths(set: Set<number>): string {
  const sorted = Array.from(set).sort((a, b) => a - b);
  if (sorted.length === 0) return "an unknown number of";
  if (sorted.length === 1) return String(sorted[0]);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const continuous = last !== undefined && first !== undefined && last - first === sorted.length - 1;
  return continuous ? `${first} to ${last}` : `${sorted.slice(0, -1).join(", ")} or ${last}`;
}

function regionLabel(code: string, countries: Country[], preferred?: Country): string {
  if (preferred && preferred.code === code) return preferred.name;
  if (code === "1") return "US, Canada or another +1 country";
  const named = countries.filter((c) => c.iso !== "001");
  const first = named[0];
  if (!first) return "Non-geographic";
  if (named.length === 1) return first.name;
  return `${first.name} or another +${code} territory`;
}

type Judged = { status: NumberStatus; note: string };

function judge(code: string, rest: string, countries: Country[]): Judged {
  const typical = union(countries, "typical");
  const all = union(countries, "all");
  const total = code.length + rest.length;
  if (total > MAX_DIGITS) {
    return { status: "invalid", note: `E.164 allows 15 digits at most, and this has ${total}.` };
  }
  if (code === "1" && rest.length === 10 && !/^[2-9]\d{2}[2-9]\d{6}$/.test(rest)) {
    return { status: "invalid", note: "In +1 numbers, the area code and the next three digits can't start with 0 or 1." };
  }
  if (typical.has(rest.length)) return { status: "ok", note: "" };
  if (all.has(rest.length)) {
    return { status: "check", note: `This length is used only by special numbers such as toll-free. Landlines and mobiles here have ${describeLengths(typical)} digits.` };
  }
  const direction = rest.length < Math.min(...all) ? "Too short" : rest.length > Math.max(...all) ? "Too long" : "Unusual length";
  return { status: "invalid", note: `${direction}: numbers here have ${describeLengths(typical)} digits after +${code}, and this has ${rest.length}.` };
}

function international(input: string, digits: string, note: string, preferred?: Country): FormatResult {
  if (digits.startsWith("0")) {
    return { input, e164: null, status: "invalid", note: "No country code starts with 0.", country: null };
  }
  const split = splitCallingCode(digits);
  if (!split) {
    return { input, e164: null, status: "invalid", note: `No country uses the code at the start of +${digits}.`, country: null };
  }
  const judged = judge(split.code, split.rest, split.countries);
  const e164 = judged.status === "invalid" ? null : `+${digits}`;
  return {
    input,
    e164,
    status: judged.status,
    note: [note, judged.note].filter(Boolean).join(" "),
    country: regionLabel(split.code, split.countries, preferred),
  };
}

const EXTENSION = /\s*(?:[;,]\s*)?\b(?:ext(?:ension)?\.?\s*=?|x)\s*\d+\s*$/i;

/** Turns one pasted value into E.164, using the default country when the value has no country code. */
export function formatNumber(raw: string, defaultIso: string): FormatResult {
  const input = raw.trim();
  const country = getCountry(defaultIso);
  if (!country) {
    return { input, e164: null, status: "invalid", note: "Pick a default country.", country: null };
  }
  if (!input) return { input, e164: null, status: "invalid", note: "Empty value.", country: null };

  let value = input.normalize("NFKC");
  let extensionNote = "";
  if (EXTENSION.test(value)) {
    value = value.replace(EXTENSION, "");
    extensionNote = "Extension removed, because E.164 has no place for one.";
  }
  if (/\p{L}/u.test(value)) {
    return { input, e164: null, status: "invalid", note: "Contains letters. Spell vanity numbers out as digits.", country: null };
  }
  // "+44 (0)20 7183 8750" carries a national 0 in brackets that must not be dialed internationally.
  value = value.replace(/\(\s*0\s*\)/g, "");
  const hasPlus = /^[\s(]*\+/.test(value);
  const digits = value.replace(/\D/g, "");
  if (!digits) return { input, e164: null, status: "invalid", note: "No digits found.", country: null };

  if (hasPlus) return international(input, digits, extensionNote, country);

  // 1. The default country's own international dialing prefix.
  const iddMatch = country.idd?.exec(digits);
  if (iddMatch && iddMatch[0].length < digits.length) {
    const rest = digits.slice(iddMatch[0].length);
    const candidate = international(input, rest, `Removed the international prefix ${iddMatch[0]}.`, country);
    if (candidate.status !== "invalid") return appendNote(candidate, extensionNote);
  }

  const foreign = /^(00|011)/.exec(digits);
  const foreignCandidate = foreign
    ? international(input, digits.slice(foreign[0].length), `Read ${foreign[0]} as an international prefix.`, country)
    : null;
  const foreignOk = foreignCandidate?.status === "ok";

  // 2. 00 is never how a national number starts. 011 can be (Japan, Leeds, Delhi), so it wins only
  // where national lengths vary so much that length can't tell the two readings apart.
  const spread = Math.max(...country.typical) - Math.min(...country.typical);
  if (foreignCandidate && foreignOk && (foreign?.[0] === "00" || spread >= 3)) {
    return appendNote(foreignCandidate, extensionNote);
  }

  // 3. A national number, with or without the national prefix.
  const prefix = country.nationalPrefix;
  const withoutPrefix = prefix && digits.startsWith(prefix) ? digits.slice(prefix.length) : digits;
  const removed = withoutPrefix !== digits ? `Removed the national prefix ${prefix}.` : "";
  const typical = (national: string) => country.typical.includes(national.length);
  const possible = (national: string) => country.all.includes(national.length);
  const hasCode = digits.startsWith(country.code);
  const afterCode = digits.slice(country.code.length);

  if (typical(withoutPrefix)) return appendNote(international(input, country.code + withoutPrefix, removed, country), extensionNote);
  if (typical(digits)) return appendNote(international(input, country.code + digits, "", country), extensionNote);

  // 4. The country code typed without a plus sign, then the remaining ways of reading it.
  if (hasCode && typical(afterCode)) {
    return appendNote(international(input, digits, `Read ${country.code} as the country code.`, country), extensionNote);
  }
  if (foreignCandidate && foreignOk) return appendNote(foreignCandidate, extensionNote);
  if (possible(withoutPrefix)) return appendNote(international(input, country.code + withoutPrefix, removed, country), extensionNote);
  if (possible(digits)) return appendNote(international(input, country.code + digits, "", country), extensionNote);
  if (hasCode && possible(afterCode)) {
    return appendNote(international(input, digits, `Read ${country.code} as the country code.`, country), extensionNote);
  }

  // 5. Nothing fits, so report against the default country.
  const judged = judge(country.code, withoutPrefix, [country]);
  return {
    input,
    e164: null,
    status: "invalid",
    note: [judged.note || `Doesn't fit ${country.name}.`, extensionNote].filter(Boolean).join(" "),
    country: country.name,
  };
}

function appendNote(result: FormatResult, note: string): FormatResult {
  return note ? { ...result, note: [result.note, note].filter(Boolean).join(" ") } : result;
}

/** Splits pasted text into values. Commas, semicolons and tabs separate values, unless they introduce an extension. */
export function splitInput(text: string): string[] {
  return text
    .split(/\r?\n|\t|;(?!\s*ext)|,(?!\s*ext)/i)
    .map((s) => s.trim().replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
}

export type BatchResult = {
  rows: (FormatResult & { duplicate: boolean })[];
  ok: number;
  check: number;
  invalid: number;
  duplicates: number;
};

export function formatBatch(text: string, defaultIso: string): BatchResult {
  const seen = new Set<string>();
  let ok = 0;
  let check = 0;
  let invalid = 0;
  let duplicates = 0;
  const rows = splitInput(text).map((value) => {
    const result = formatNumber(value, defaultIso);
    if (result.status === "ok") ok++;
    else if (result.status === "check") check++;
    else invalid++;
    let duplicate = false;
    if (result.e164) {
      if (seen.has(result.e164)) {
        duplicate = true;
        duplicates++;
      } else seen.add(result.e164);
    }
    return { ...result, duplicate };
  });
  return { rows, ok, check, invalid, duplicates };
}

/** One CSV cell. Text cells that a spreadsheet would run as a formula get a leading apostrophe. */
export function csvCell(value: string, guardFormula = true): string {
  let v = value;
  if (guardFormula && /^[=@\-+\t\r]/.test(v)) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const STATUS_LABEL: Record<NumberStatus, string> = {
  ok: "Length fits",
  check: "Check",
  invalid: "Invalid",
};

export function statusLabel(status: NumberStatus): string {
  return STATUS_LABEL[status];
}

/** Builds a CSV. The e164 column keeps its plus sign, because that's the value people need to import. */
export function toCsv(rows: FormatResult[]): string {
  const lines = ["input,e164,check,country,note"];
  for (const r of rows) {
    lines.push(
      [csvCell(r.input), csvCell(r.e164 ?? "", false), csvCell(statusLabel(r.status)), csvCell(r.country ?? ""), csvCell(r.note)].join(","),
    );
  }
  return `${lines.join("\r\n")}\r\n`;
}
