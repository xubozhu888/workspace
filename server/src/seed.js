// All 104 matches of the 2026 FIFA World Cup, used to seed the DB on first run.
// Group-stage data and knockout structure mirror the frontend exactly.

const M = (date, time, grp, a, b, city, venue) => ({
  group: grp,
  team1: a,
  team2: b,
  match_date: `${date}T${time}:00`,
  venue: `${venue}, ${city}`,
});

const GROUP_MATCHES = [
  // GROUP A
  M("2026-06-11", "15:00", "A", "Mexico", "South Africa", "Mexico City", "Estadio Azteca"),
  M("2026-06-11", "22:00", "A", "South Korea", "Czechia", "Guadalajara", "Estadio Akron"),
  M("2026-06-18", "12:00", "A", "Czechia", "South Africa", "Atlanta", "Mercedes-Benz Stadium"),
  M("2026-06-18", "21:00", "A", "Mexico", "South Korea", "Guadalajara", "Estadio Akron"),
  M("2026-06-24", "21:00", "A", "Czechia", "Mexico", "Mexico City", "Estadio Azteca"),
  M("2026-06-24", "21:00", "A", "South Africa", "South Korea", "Monterrey", "Estadio BBVA"),
  // GROUP B
  M("2026-06-12", "15:00", "B", "Canada", "Bosnia & Herzegovina", "Toronto", "BMO Field"),
  M("2026-06-13", "15:00", "B", "Qatar", "Switzerland", "SF Bay Area", "Levi's Stadium"),
  M("2026-06-18", "15:00", "B", "Switzerland", "Bosnia & Herzegovina", "Los Angeles", "SoFi Stadium"),
  M("2026-06-18", "18:00", "B", "Canada", "Qatar", "Vancouver", "BC Place"),
  M("2026-06-24", "15:00", "B", "Switzerland", "Canada", "Vancouver", "BC Place"),
  M("2026-06-24", "15:00", "B", "Bosnia & Herzegovina", "Qatar", "Seattle", "Lumen Field"),
  // GROUP C
  M("2026-06-13", "18:00", "C", "Brazil", "Morocco", "New York NJ", "MetLife Stadium"),
  M("2026-06-13", "21:00", "C", "Haiti", "Scotland", "Boston", "Gillette Stadium"),
  M("2026-06-19", "18:00", "C", "Scotland", "Morocco", "Boston", "Gillette Stadium"),
  M("2026-06-19", "21:00", "C", "Brazil", "Haiti", "Philadelphia", "Lincoln Financial Field"),
  M("2026-06-24", "18:00", "C", "Scotland", "Brazil", "Miami", "Hard Rock Stadium"),
  M("2026-06-24", "18:00", "C", "Morocco", "Haiti", "Atlanta", "Mercedes-Benz Stadium"),
  // GROUP D
  M("2026-06-12", "21:00", "D", "USA", "Paraguay", "Los Angeles", "SoFi Stadium"),
  M("2026-06-13", "21:00", "D", "Australia", "Türkiye", "Vancouver", "BC Place"),
  M("2026-06-19", "15:00", "D", "USA", "Australia", "Seattle", "Lumen Field"),
  M("2026-06-19", "21:00", "D", "Türkiye", "Paraguay", "SF Bay Area", "Levi's Stadium"),
  M("2026-06-25", "22:00", "D", "Türkiye", "USA", "Los Angeles", "SoFi Stadium"),
  M("2026-06-25", "22:00", "D", "Paraguay", "Australia", "SF Bay Area", "Levi's Stadium"),
  // GROUP E
  M("2026-06-14", "13:00", "E", "Germany", "Curaçao", "Houston", "NRG Stadium"),
  M("2026-06-14", "19:00", "E", "Ivory Coast", "Ecuador", "Philadelphia", "Lincoln Financial Field"),
  M("2026-06-20", "16:00", "E", "Germany", "Ivory Coast", "Toronto", "BMO Field"),
  M("2026-06-20", "20:00", "E", "Ecuador", "Curaçao", "Kansas City", "Arrowhead Stadium"),
  M("2026-06-25", "16:00", "E", "Ecuador", "Germany", "New York NJ", "MetLife Stadium"),
  M("2026-06-25", "16:00", "E", "Curaçao", "Ivory Coast", "Philadelphia", "Lincoln Financial Field"),
  // GROUP F
  M("2026-06-14", "16:00", "F", "Netherlands", "Japan", "Dallas", "AT&T Stadium"),
  M("2026-06-14", "22:00", "F", "Sweden", "Tunisia", "Monterrey", "Estadio BBVA"),
  M("2026-06-20", "13:00", "F", "Netherlands", "Sweden", "Houston", "NRG Stadium"),
  M("2026-06-20", "21:00", "F", "Tunisia", "Japan", "Monterrey", "Estadio BBVA"),
  M("2026-06-25", "19:00", "F", "Japan", "Sweden", "Dallas", "AT&T Stadium"),
  M("2026-06-25", "19:00", "F", "Tunisia", "Netherlands", "Kansas City", "Arrowhead Stadium"),
  // GROUP G
  M("2026-06-15", "15:00", "G", "Belgium", "Egypt", "Seattle", "Lumen Field"),
  M("2026-06-15", "21:00", "G", "Iran", "New Zealand", "Los Angeles", "SoFi Stadium"),
  M("2026-06-21", "15:00", "G", "Belgium", "Iran", "Los Angeles", "SoFi Stadium"),
  M("2026-06-21", "21:00", "G", "New Zealand", "Egypt", "Vancouver", "BC Place"),
  M("2026-06-26", "23:00", "G", "Egypt", "Iran", "Seattle", "Lumen Field"),
  M("2026-06-26", "23:00", "G", "New Zealand", "Belgium", "Vancouver", "BC Place"),
  // GROUP H
  M("2026-06-15", "12:00", "H", "Spain", "Cape Verde", "Atlanta", "Mercedes-Benz Stadium"),
  M("2026-06-15", "18:00", "H", "Saudi Arabia", "Uruguay", "Miami", "Hard Rock Stadium"),
  M("2026-06-21", "12:00", "H", "Spain", "Saudi Arabia", "Atlanta", "Mercedes-Benz Stadium"),
  M("2026-06-21", "18:00", "H", "Uruguay", "Cape Verde", "Miami", "Hard Rock Stadium"),
  M("2026-06-26", "20:00", "H", "Cape Verde", "Saudi Arabia", "Houston", "NRG Stadium"),
  M("2026-06-26", "20:00", "H", "Uruguay", "Spain", "Guadalajara", "Estadio Akron"),
  // GROUP I
  M("2026-06-16", "15:00", "I", "France", "Senegal", "New York NJ", "MetLife Stadium"),
  M("2026-06-16", "18:00", "I", "Iraq", "Norway", "Boston", "Gillette Stadium"),
  M("2026-06-22", "17:00", "I", "France", "Iraq", "Philadelphia", "Lincoln Financial Field"),
  M("2026-06-22", "20:00", "I", "Norway", "Senegal", "New York NJ", "MetLife Stadium"),
  M("2026-06-26", "15:00", "I", "Norway", "France", "Boston", "Gillette Stadium"),
  M("2026-06-26", "15:00", "I", "Senegal", "Iraq", "Toronto", "BMO Field"),
  // GROUP J
  M("2026-06-16", "21:00", "J", "Argentina", "Algeria", "Kansas City", "Arrowhead Stadium"),
  M("2026-06-16", "21:00", "J", "Austria", "Jordan", "SF Bay Area", "Levi's Stadium"),
  M("2026-06-22", "13:00", "J", "Argentina", "Austria", "Dallas", "AT&T Stadium"),
  M("2026-06-22", "23:00", "J", "Jordan", "Algeria", "SF Bay Area", "Levi's Stadium"),
  M("2026-06-27", "22:00", "J", "Algeria", "Austria", "Kansas City", "Arrowhead Stadium"),
  M("2026-06-27", "22:00", "J", "Jordan", "Argentina", "Dallas", "AT&T Stadium"),
  // GROUP K
  M("2026-06-17", "13:00", "K", "Portugal", "DR Congo", "Houston", "NRG Stadium"),
  M("2026-06-17", "22:00", "K", "Uzbekistan", "Colombia", "Mexico City", "Estadio Azteca"),
  M("2026-06-23", "13:00", "K", "Portugal", "Uzbekistan", "Houston", "NRG Stadium"),
  M("2026-06-23", "22:00", "K", "Colombia", "DR Congo", "Guadalajara", "Estadio Akron"),
  M("2026-06-27", "19:30", "K", "Colombia", "Portugal", "Miami", "Hard Rock Stadium"),
  M("2026-06-27", "19:30", "K", "DR Congo", "Uzbekistan", "Atlanta", "Mercedes-Benz Stadium"),
  // GROUP L
  M("2026-06-17", "16:00", "L", "England", "Croatia", "Dallas", "AT&T Stadium"),
  M("2026-06-17", "19:00", "L", "Ghana", "Panama", "Toronto", "BMO Field"),
  M("2026-06-23", "16:00", "L", "England", "Ghana", "Boston", "Gillette Stadium"),
  M("2026-06-23", "19:00", "L", "Panama", "Croatia", "Toronto", "BMO Field"),
  M("2026-06-27", "17:00", "L", "Panama", "England", "New York NJ", "MetLife Stadium"),
  M("2026-06-27", "17:00", "L", "Croatia", "Ghana", "Philadelphia", "Lincoln Financial Field"),
];

// ---- Knockout stage — Round of 32 fixtures (teams set after the group stage;
// official 2026 bracket). Later rounds stay as "Winner Match N" placeholders
// until those matches are played. (Slot each pairing resolves: see comments.)
const R32 = [
  { n: 73, a: "South Africa", b: "Canada" },          // 2nd A vs 2nd B
  { n: 74, a: "Germany", b: "Paraguay" },             // 1st E vs Best 3rd
  { n: 75, a: "Netherlands", b: "Morocco" },          // 1st F vs 2nd C
  { n: 76, a: "Brazil", b: "Japan" },                 // 1st C vs 2nd F
  { n: 77, a: "France", b: "Sweden" },                // 1st I vs Best 3rd
  { n: 78, a: "Ivory Coast", b: "Norway" },           // 2nd E vs 2nd I
  { n: 79, a: "Mexico", b: "Ecuador" },               // 1st A vs Best 3rd
  { n: 80, a: "England", b: "DR Congo" },             // 1st L vs Best 3rd
  { n: 81, a: "USA", b: "Bosnia & Herzegovina" },     // 1st D vs Best 3rd
  { n: 82, a: "Belgium", b: "Senegal" },              // 1st G vs Best 3rd
  { n: 83, a: "Portugal", b: "Croatia" },             // 2nd K vs 2nd L
  { n: 84, a: "Spain", b: "Austria" },                // 1st H vs 2nd J
  { n: 85, a: "Switzerland", b: "Algeria" },          // 1st B vs Best 3rd
  { n: 86, a: "Argentina", b: "Cape Verde" },         // 1st J vs 2nd H
  { n: 87, a: "Colombia", b: "Ghana" },               // 1st K vs Best 3rd
  { n: 88, a: "Australia", b: "Egypt" },              // 2nd D vs 2nd G
];
const buildRound = (startN, count, feeders) =>
  Array.from({ length: count }, (_, i) => ({
    n: startN + i,
    a: `Winner Match ${feeders[i * 2]}`,
    b: `Winner Match ${feeders[i * 2 + 1]}`,
  }));
const R16 = buildRound(89, 8, [74, 77, 73, 75, 76, 78, 79, 80, 83, 84, 81, 82, 86, 88, 85, 87]);
const QF = buildRound(97, 4, [89, 90, 93, 94, 91, 92, 95, 96]);
const SF = buildRound(101, 2, [97, 98, 99, 100]);
const BRONZE = [{ n: 103, a: "Loser Match 101", b: "Loser Match 102" }];
const FINAL = [{ n: 104, a: "Winner Match 101", b: "Winner Match 102" }];

const KO_META = {
  73: ["2026-06-28", "15:00", "Los Angeles", "SoFi Stadium"],
  74: ["2026-06-29", "16:30", "Boston", "Gillette Stadium"],
  75: ["2026-06-29", "21:00", "Monterrey", "Estadio BBVA"],
  76: ["2026-06-29", "13:00", "Houston", "NRG Stadium"],
  77: ["2026-06-30", "17:00", "New York NJ", "MetLife Stadium"],
  78: ["2026-06-30", "13:00", "Dallas", "AT&T Stadium"],
  79: ["2026-06-30", "21:00", "Mexico City", "Estadio Azteca"],
  80: ["2026-07-01", "12:00", "Atlanta", "Mercedes-Benz Stadium"],
  81: ["2026-07-01", "20:00", "SF Bay Area", "Levi's Stadium"],
  82: ["2026-07-01", "16:00", "Seattle", "Lumen Field"],
  83: ["2026-07-02", "19:00", "Toronto", "BMO Field"],
  84: ["2026-07-02", "15:00", "Los Angeles", "SoFi Stadium"],
  85: ["2026-07-02", "23:00", "Vancouver", "BC Place"],
  86: ["2026-07-03", "18:00", "Miami", "Hard Rock Stadium"],
  87: ["2026-07-03", "21:30", "Kansas City", "Arrowhead Stadium"],
  88: ["2026-07-03", "14:00", "Dallas", "AT&T Stadium"],
  89: ["2026-07-04", "17:00", "Philadelphia", "Lincoln Financial Field"],
  90: ["2026-07-04", "13:00", "Houston", "NRG Stadium"],
  91: ["2026-07-05", "16:00", "New York NJ", "MetLife Stadium"],
  92: ["2026-07-05", "20:00", "Mexico City", "Estadio Azteca"],
  93: ["2026-07-06", "15:00", "Dallas", "AT&T Stadium"],
  94: ["2026-07-06", "20:00", "Seattle", "Lumen Field"],
  95: ["2026-07-07", "12:00", "Atlanta", "Mercedes-Benz Stadium"],
  96: ["2026-07-07", "16:00", "Vancouver", "BC Place"],
  97: ["2026-07-09", "16:00", "Boston", "Gillette Stadium"],
  98: ["2026-07-10", "15:00", "Los Angeles", "SoFi Stadium"],
  99: ["2026-07-11", "17:00", "Miami", "Hard Rock Stadium"],
  100: ["2026-07-11", "21:00", "Kansas City", "Arrowhead Stadium"],
  101: ["2026-07-14", "15:00", "Dallas", "AT&T Stadium"],
  102: ["2026-07-15", "15:00", "Atlanta", "Mercedes-Benz Stadium"],
  103: ["2026-07-18", "15:00", "Miami", "Hard Rock Stadium"],
  104: ["2026-07-19", "15:00", "New York NJ", "MetLife Stadium"],
};
const roundLabel = (n) =>
  n <= 88 ? "R32" : n <= 96 ? "R16" : n <= 100 ? "QF" : n === 103 ? "Bronze" : n <= 102 ? "SF" : "Final";

const KO_MATCHES = [...R32, ...R16, ...QF, ...SF, ...BRONZE, ...FINAL].map((m) => {
  const [date, time, city, venue] = KO_META[m.n];
  return {
    id: m.n,
    group: roundLabel(m.n),
    team1: m.a,
    team2: m.b,
    match_date: `${date}T${time}:00`,
    venue: `${venue}, ${city}`,
  };
});

const SEED_MATCHES = [
  ...GROUP_MATCHES.map((m, i) => ({ id: i + 1, ...m, status: "upcoming", result: null })),
  ...KO_MATCHES.map((m) => ({ ...m, status: "upcoming", result: null })),
];

module.exports = { SEED_MATCHES };
