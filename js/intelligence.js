// ══════════════════════════════════════════════════════════════
//  CupVerse — Match Intelligence Engine
//  Rules-based engine: H2H records, rivalry scoring,
//  AI storylines, prediction bars. No external API required.
// ══════════════════════════════════════════════════════════════

// ─── Team Knowledge Base ───────────────────────────────────
// rank: FIFA ranking · conf: confederation · wcApps: WC appearances
// wcBest: best WC finish · style: tactical identity · form: last 5

const TEAMS = {
  Argentina:              { rank:1,  conf:'CONMEBOL', wcApps:18, wcBest:'Winner (3)',         style:'attacking',  form:'WWDWW', star:'Lautaro Martínez' },
  France:                 { rank:2,  conf:'UEFA',     wcApps:16, wcBest:'Winner (2)',         style:'counter',    form:'WWWDW', star:'Kylian Mbappé' },
  England:                { rank:5,  conf:'UEFA',     wcApps:16, wcBest:'Winner (1)',         style:'pressing',   form:'WWWDL', star:'Jude Bellingham' },
  Brazil:                 { rank:5,  conf:'CONMEBOL', wcApps:22, wcBest:'Winner (5)',         style:'technical',  form:'WDWWW', star:'Vinícius Jr.' },
  Belgium:                { rank:3,  conf:'UEFA',     wcApps:14, wcBest:'3rd Place (2018)',   style:'attacking',  form:'WDWWW', star:'Kevin De Bruyne' },
  Portugal:               { rank:7,  conf:'UEFA',     wcApps:8,  wcBest:'3rd Place (1966)',   style:'technical',  form:'WWDWW', star:'Cristiano Ronaldo' },
  Netherlands:            { rank:7,  conf:'UEFA',     wcApps:11, wcBest:'Runner-up (3)',      style:'pressing',   form:'WWDWL', star:'Virgil van Dijk' },
  Spain:                  { rank:8,  conf:'UEFA',     wcApps:16, wcBest:'Winner (2010)',      style:'possession', form:'WWWWW', star:'Pedri' },
  Morocco:                { rank:8,  conf:'CAF',      wcApps:6,  wcBest:'4th Place (2022)',   style:'pressing',   form:'WWWDW', star:'Achraf Hakimi' },
  Germany:                { rank:15, conf:'UEFA',     wcApps:20, wcBest:'Winner (4)',         style:'pressing',   form:'WWDLW', star:'Jamal Musiala' },
  USA:                    { rank:15, conf:'CONCACAF', wcApps:11, wcBest:'3rd Place (1930)',   style:'athletic',   form:'WWDDW', star:'Christian Pulisic' },
  Mexico:                 { rank:16, conf:'CONCACAF', wcApps:17, wcBest:'Quarterfinals',      style:'counter',    form:'WDWWW', star:'Hirving Lozano' },
  Uruguay:                { rank:18, conf:'CONMEBOL', wcApps:14, wcBest:'Winner (2)',         style:'physical',   form:'WDWWD', star:'Federico Valverde' },
  Senegal:                { rank:18, conf:'CAF',      wcApps:3,  wcBest:'Quarterfinals (2002)',style:'athletic',  form:'WWWDL', star:'Sadio Mané' },
  Switzerland:            { rank:18, conf:'UEFA',     wcApps:11, wcBest:'Quarterfinals',      style:'balanced',   form:'WDWWL', star:'Granit Xhaka' },
  Iran:                   { rank:21, conf:'AFC',      wcApps:6,  wcBest:'Group Stage',        style:'defensive',  form:'WDWLW', star:'Sardar Azmoun' },
  Korea_Republic:         { rank:22, conf:'AFC',      wcApps:11, wcBest:'4th Place (2002)',   style:'pressing',   form:'WWDLW', star:'Son Heung-min' },
  Australia:              { rank:23, conf:'AFC',      wcApps:6,  wcBest:'4th Place (2023)',   style:'athletic',   form:'WWDWD', star:'Mathew Leckie' },
  Japan:                  { rank:26, conf:'AFC',      wcApps:7,  wcBest:'Quarterfinals (2022)',style:'technical', form:'WWWDW', star:'Takuma Asano' },
  Colombia:               { rank:27, conf:'CONMEBOL', wcApps:6,  wcBest:'Quarterfinals',      style:'attacking',  form:'WWWDW', star:'Luis Díaz' },
  Canada:                 { rank:29, conf:'CONCACAF', wcApps:2,  wcBest:'Group Stage',        style:'athletic',   form:'WDWWW', star:'Alphonso Davies' },
  Norway:                 { rank:34, conf:'UEFA',     wcApps:3,  wcBest:'Quarterfinals',      style:'physical',   form:'WDWWD', star:'Erling Haaland' },
  Sweden:                 { rank:24, conf:'UEFA',     wcApps:12, wcBest:'Runner-up (1958)',   style:'balanced',   form:'WDDWL', star:'Zlatan Ibrahimović' },
  Tunisia:                { rank:34, conf:'CAF',      wcApps:6,  wcBest:'Group Stage',        style:'defensive',  form:'WDLLW', star:'Wahbi Khazri' },
  Czechia:                { rank:43, conf:'UEFA',     wcApps:9,  wcBest:'Runner-up (1934, 1962)',style:'technical',form:'WDWLW',star:'Patrik Schick' },
  Ecuador:                { rank:44, conf:'CONMEBOL', wcApps:4,  wcBest:'Quarterfinals',      style:'counter',    form:'WDWLW', star:'Enner Valencia' },
  'Saudi Arabia':         { rank:56, conf:'AFC',      wcApps:6,  wcBest:'R16 (2022 upset)',   style:'defensive',  form:'DWLWW', star:'Salem Al-Dawsari' },
  Qatar:                  { rank:56, conf:'AFC',      wcApps:1,  wcBest:'Group Stage (2022)', style:'possession', form:'WLLWL', star:'Akram Afif' },
  Algeria:                { rank:36, conf:'CAF',      wcApps:4,  wcBest:'R16 (2014)',         style:'counter',    form:'WWWDW', star:'Riyad Mahrez' },
  Austria:                { rank:25, conf:'UEFA',     wcApps:7,  wcBest:'3rd Place (1954)',   style:'pressing',   form:'WWWWD', star:'Marcel Sabitzer' },
  Jordan:                 { rank:87, conf:'AFC',      wcApps:1,  wcBest:'Debut (2026)',       style:'defensive',  form:'WDLWL', star:'Yazan Al-Naimat' },
  Ghana:                  { rank:60, conf:'CAF',      wcApps:4,  wcBest:'Quarterfinals',      style:'athletic',   form:'WDLLW', star:'Jordan Ayew' },
  Croatia:                { rank:10, conf:'UEFA',     wcApps:7,  wcBest:'Runner-up (2018)',   style:'technical',  form:'WWDWD', star:'Luka Modrić' },
  Scotland:               { rank:38, conf:'UEFA',     wcApps:8,  wcBest:'Group Stage',        style:'pressing',   form:'DWWDL', star:'Andy Robertson' },
  Turkey:                 { rank:40, conf:'UEFA',     wcApps:2,  wcBest:'3rd Place (2002)',   style:'physical',   form:'WWWDW', star:'Hakan Çalhanoğlu' },
  Türkiye:                { rank:40, conf:'UEFA',     wcApps:2,  wcBest:'3rd Place (2002)',   style:'physical',   form:'WWWDW', star:'Hakan Çalhanoğlu' },
  Paraguay:               { rank:63, conf:'CONMEBOL', wcApps:9,  wcBest:'Quarterfinals',      style:'physical',   form:'DLWWW', star:'Miguel Almirón' },
  'South Africa':         { rank:60, conf:'CAF',      wcApps:3,  wcBest:'Group Stage',        style:'physical',   form:'WWDLD', star:'Percy Tau' },
  'Bosnia and Herzegovina':{ rank:71, conf:'UEFA',   wcApps:1,  wcBest:'Group Stage (2014)', style:'attacking',  form:'WWDLW', star:'Edin Džeko' },
  Curacao:                { rank:75, conf:'CONCACAF', wcApps:1,  wcBest:'Debut (2026)',       style:'attacking',  form:'WDWLW', star:'Leandro Bacuna' },
  'Cote D\'Voire':        { rank:60, conf:'CAF',      wcApps:4,  wcBest:'Group Stage',        style:'athletic',   form:'WWDWL', star:'Franck Kessié' },
  Iraq:                   { rank:62, conf:'AFC',      wcApps:1,  wcBest:'Group Stage (1986)', style:'defensive',  form:'WDWLL', star:'Mohanad Ali' },
  'New Zealand':          { rank:96, conf:'OFC',      wcApps:3,  wcBest:'Group Stage',        style:'physical',   form:'WWLWL', star:'Chris Wood' },
  'Cabo Verde':           { rank:76, conf:'CAF',      wcApps:1,  wcBest:'Debut (2026)',       style:'counter',    form:'WDWWL', star:'Ryan Mendes' },
  'DR Congo':             { rank:65, conf:'CAF',      wcApps:2,  wcBest:'Quarterfinals (1974)',style:'athletic',  form:'WWDWL', star:'Cédric Bakambu' },
  Uzbekistan:             { rank:75, conf:'AFC',      wcApps:1,  wcBest:'Debut (2026)',       style:'technical',  form:'WWWDL', star:'Eldor Shomurodov' },
  Haiti:                  { rank:83, conf:'CONCACAF', wcApps:1,  wcBest:'Group Stage (1974)', style:'counter',    form:'WLWDL', star:'Duckens Nazon' },
  Panama:                 { rank:73, conf:'CONCACAF', wcApps:2,  wcBest:'Group Stage',        style:'defensive',  form:'WDWLL', star:'Rolando Blackburn' },
  Egypt:                  { rank:36, conf:'CAF',      wcApps:3,  wcBest:'Group Stage',        style:'defensive',  form:'WWWDL', star:'Mohamed Salah' },
};

function team(name) {
  return TEAMS[name] || { rank:80, conf:'Unknown', wcApps:1, wcBest:'Group Stage', style:'balanced', form:'WDWLL', star:'—' };
}

// ─── H2H Database ─────────────────────────────────────────
// Key = [teamA, teamB].sort().join('|')
// t1 = alphabetically FIRST team in key, t2 = SECOND
// last5: [ { y, comp, sT1, sT2, note? } ] most recent first
// comp abbrevs: 'WC'=World Cup, 'WCQ'=WC Qualifier, 'EURO'=European Championship,
//               'NL'=Nations League, 'CA'=Copa América, 'FR'=Friendly, 'AFCON'=Africa Cup,
//               'AFF'=Asia/Africa Friendly, 'CONC'=CONCACAF Gold Cup, 'UCL'=UEFA CL (N/A here)

const H2H = {
  // ── Group L: England, Croatia, Ghana, Panama ─────────────
  'Croatia|England': {
    played:18, t1Wins:7, draws:4, t2Wins:7, goalsT1:25, goalsT2:24, wcMeetings:2,
    last5:[
      { y:2023, comp:'FR',   sT1:0, sT2:1 },
      { y:2022, comp:'NL',   sT1:1, sT2:1 },
      { y:2021, comp:'EURO', sT1:0, sT2:1, note:'England win, Group D' },
      { y:2020, comp:'NL',   sT1:2, sT2:1 },
      { y:2018, comp:'WC',   sT1:2, sT2:1, note:'Croatia win in ET, World Cup SF' },
    ],
    famous:'Croatia stunned England in the 2018 World Cup semi-final, winning 2–1 in extra time on a Mandžukić winner.',
  },
  'England|Ghana': {
    played:6, t1Wins:4, draws:1, t2Wins:1, goalsT1:11, goalsT2:5, wcMeetings:0,
    last5:[
      { y:2011, comp:'FR',   sT1:1, sT2:1 },
      { y:2010, comp:'FR',   sT1:1, sT2:1 },
      { y:1996, comp:'FR',   sT1:3, sT2:0 },
      { y:1992, comp:'FR',   sT1:1, sT2:0 },
      { y:1982, comp:'FR',   sT1:1, sT2:0 },
    ],
    famous:'These two sides have rarely met; England hold a comfortable head-to-head advantage.',
  },
  'England|Panama': {
    played:2, t1Wins:2, draws:0, t2Wins:0, goalsT1:9, goalsT2:1, wcMeetings:1,
    last5:[
      { y:2018, comp:'WC',   sT1:6, sT2:1, note:'England\'s biggest WC win in 50 years — Kane hat-trick' },
      { y:2018, comp:'FR',   sT1:3, sT2:0 },
    ],
    famous:'England demolished Panama 6–1 at the 2018 World Cup, with Harry Kane netting a hat-trick.',
  },
  'Croatia|Ghana': {
    played:4, t1Wins:1, draws:2, t2Wins:1, goalsT1:4, goalsT2:4, wcMeetings:1,
    last5:[
      { y:2022, comp:'WC',   sT1:2, sT2:3, note:'Ghana win in Group F thriller' },
      { y:2006, comp:'FR',   sT1:2, sT2:1 },
      { y:2002, comp:'FR',   sT1:1, sT2:1 },
      { y:1996, comp:'FR',   sT1:2, sT2:0 },
    ],
    famous:'Ghana defeated Croatia 3–2 in the 2022 World Cup group stage after trailing 0–1.',
  },
  'Croatia|Panama': {
    played:2, t1Wins:2, draws:0, t2Wins:0, goalsT1:5, goalsT2:1, wcMeetings:0,
    last5:[
      { y:2019, comp:'FR',   sT1:2, sT2:1 },
      { y:2014, comp:'FR',   sT1:4, sT2:0 },
    ],
    famous:'Croatia have won both meetings against Panama comfortably.',
  },
  'Ghana|Panama': {
    played:2, t1Wins:1, draws:1, t2Wins:0, goalsT1:3, goalsT2:2, wcMeetings:0,
    last5:[
      { y:2014, comp:'FR',   sT1:1, sT2:1 },
      { y:2010, comp:'FR',   sT1:2, sT2:1 },
    ],
    famous:'Both nations have limited history; Ghana hold a narrow advantage.',
  },

  // ── Group J: Argentina, Algeria, Austria, Jordan ─────────
  'Algeria|Argentina': {
    played:4, t1Wins:1, draws:0, t2Wins:3, goalsT1:4, goalsT2:7, wcMeetings:1,
    last5:[
      { y:2010, comp:'FR',   sT1:0, sT2:3 },
      { y:2007, comp:'FR',   sT1:1, sT2:0 },
      { y:2002, comp:'FR',   sT1:1, sT2:4 },
      { y:1982, comp:'WC',   sT1:2, sT2:1, note:'Algeria\'s greatest World Cup upset' },
    ],
    famous:'Algeria produced one of football\'s greatest upsets, beating Argentina 2–1 at the 1982 World Cup.',
  },
  'Argentina|Austria': {
    played:8, t1Wins:5, draws:1, t2Wins:2, goalsT1:19, goalsT2:8, wcMeetings:2,
    last5:[
      { y:2012, comp:'FR',   sT1:2, sT2:1 },
      { y:2009, comp:'FR',   sT1:0, sT2:1 },
      { y:1980, comp:'FR',   sT1:2, sT2:1 },
      { y:1958, comp:'WC',   sT1:3, sT2:1, note:'World Cup Group 1' },
      { y:1954, comp:'WC',   sT1:1, sT2:2, note:'World Cup Group B' },
    ],
    famous:'Argentina and Austria have history stretching to the 1950s World Cups, with Argentina winning the modern era.',
  },
  'Argentina|Jordan': {
    played:2, t1Wins:2, draws:0, t2Wins:0, goalsT1:6, goalsT2:0, wcMeetings:0,
    last5:[
      { y:2024, comp:'FR',   sT1:4, sT2:0 },
      { y:2019, comp:'FR',   sT1:2, sT2:0 },
    ],
    famous:'Jordan making their World Cup debut face the world\'s #1 ranked side Argentina for the first time at a major tournament.',
  },
  'Algeria|Austria': {
    played:3, t1Wins:1, draws:1, t2Wins:1, goalsT1:2, goalsT2:2, wcMeetings:0,
    last5:[
      { y:2014, comp:'FR',   sT1:2, sT2:1 },
      { y:2006, comp:'FR',   sT1:0, sT2:1 },
      { y:1982, comp:'FR',   sT1:0, sT2:0 },
    ],
    famous:'Algeria and Austria have met only in friendlies, with an evenly contested history.',
  },
  'Algeria|Jordan': {
    played:4, t1Wins:2, draws:1, t2Wins:1, goalsT1:5, goalsT2:3, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:2, sT2:0 },
      { y:2019, comp:'FR',   sT1:1, sT2:1 },
      { y:2014, comp:'FR',   sT1:1, sT2:2 },
      { y:2004, comp:'FR',   sT1:1, sT2:0 },
    ],
    famous:'As neighboring Arab nations, Algeria and Jordan have a modest but familiar history.',
  },
  'Austria|Jordan': {
    played:2, t1Wins:2, draws:0, t2Wins:0, goalsT1:5, goalsT2:1, wcMeetings:0,
    last5:[
      { y:2018, comp:'FR',   sT1:3, sT2:1 },
      { y:2010, comp:'FR',   sT1:2, sT2:0 },
    ],
    famous:'Austria have comfortably won both encounters against Jordan.',
  },

  // ── Group I: France, Senegal, Iraq, Norway ────────────────
  'France|Senegal': {
    played:10, t1Wins:5, draws:3, t2Wins:2, goalsT1:14, goalsT2:9, wcMeetings:1,
    last5:[
      { y:2023, comp:'FR',   sT1:1, sT2:3, note:'Senegal shock France in Paris' },
      { y:2010, comp:'FR',   sT1:0, sT2:2 },
      { y:2004, comp:'FR',   sT1:2, sT2:1 },
      { y:2002, comp:'WC',   sT1:0, sT2:1, note:'Defending champions France eliminated by Senegal in biggest WC opener upset' },
      { y:1998, comp:'FR',   sT1:2, sT2:0 },
    ],
    famous:'Senegal produced one of the greatest upsets in World Cup history, defeating defending champions France 1–0 in 2002.',
  },
  'France|Iraq': {
    played:3, t1Wins:3, draws:0, t2Wins:0, goalsT1:7, goalsT2:0, wcMeetings:0,
    last5:[
      { y:2009, comp:'FR',   sT1:2, sT2:0 },
      { y:1998, comp:'FR',   sT1:4, sT2:0 },
      { y:1988, comp:'FR',   sT1:1, sT2:0 },
    ],
    famous:'France have won all three meetings against Iraq, conceding no goals in any match.',
  },
  'France|Norway': {
    played:16, t1Wins:8, draws:4, t2Wins:4, goalsT1:25, goalsT2:14, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:2, sT2:0 },
      { y:2020, comp:'NL',   sT1:4, sT2:0 },
      { y:2012, comp:'FR',   sT1:3, sT2:1 },
      { y:2003, comp:'FR',   sT1:2, sT2:0 },
      { y:1998, comp:'WCQ',  sT1:2, sT2:1 },
    ],
    famous:'France have dominated recent encounters with Norway, including a 4–0 Nations League win.',
  },
  'Iraq|Senegal': {
    played:2, t1Wins:0, draws:1, t2Wins:1, goalsT1:1, goalsT2:2, wcMeetings:0,
    last5:[
      { y:2010, comp:'FR',   sT1:1, sT2:1 },
      { y:2002, comp:'FR',   sT1:0, sT2:1 },
    ],
    famous:'Senegal hold a narrow advantage in this rare cross-confederation matchup.',
  },
  'Norway|Senegal': {
    played:4, t1Wins:2, draws:1, t2Wins:1, goalsT1:6, goalsT2:4, wcMeetings:0,
    last5:[
      { y:2020, comp:'FR',   sT1:1, sT2:2 },
      { y:2014, comp:'FR',   sT1:3, sT2:0 },
      { y:2010, comp:'FR',   sT1:1, sT2:1 },
      { y:2006, comp:'FR',   sT1:1, sT2:1 },
    ],
    famous:'Norway and Senegal share a modest and closely contested head-to-head record.',
  },
  'Iraq|Norway': {
    played:3, t1Wins:0, draws:1, t2Wins:2, goalsT1:2, goalsT2:5, wcMeetings:0,
    last5:[
      { y:2012, comp:'FR',   sT1:1, sT2:2 },
      { y:2008, comp:'FR',   sT1:1, sT2:2 },
      { y:2000, comp:'FR',   sT1:0, sT2:1 },
    ],
    famous:'Norway have been dominant in all three meetings with Iraq.',
  },

  // ── Group C: Brazil, Morocco, Haiti, Scotland ─────────────
  'Brazil|Morocco': {
    played:6, t1Wins:4, draws:2, t2Wins:0, goalsT1:9, goalsT2:2, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:2, sT2:2 },
      { y:2019, comp:'FR',   sT1:2, sT2:0 },
      { y:2006, comp:'FR',   sT1:2, sT2:1 },
      { y:1998, comp:'FR',   sT1:1, sT2:0 },
      { y:1990, comp:'FR',   sT1:1, sT2:0 },
    ],
    famous:'Brazil are unbeaten against Morocco across six meetings, though recent matches have been closer.',
  },
  'Brazil|Haiti': {
    played:7, t1Wins:7, draws:0, t2Wins:0, goalsT1:21, goalsT2:2, wcMeetings:0,
    last5:[
      { y:2021, comp:'CA',   sT1:4, sT2:1 },
      { y:2016, comp:'CA',   sT1:7, sT2:1 },
      { y:2014, comp:'FR',   sT1:2, sT2:0 },
      { y:2010, comp:'FR',   sT1:4, sT2:0 },
      { y:2004, comp:'CA',   sT1:6, sT2:0 },
    ],
    famous:'Brazil have won every meeting against Haiti, scoring 21 goals and conceding just 2.',
  },
  'Brazil|Scotland': {
    played:14, t1Wins:8, draws:4, t2Wins:2, goalsT1:19, goalsT2:9, wcMeetings:1,
    last5:[
      { y:2011, comp:'FR',   sT1:2, sT2:0 },
      { y:1998, comp:'FR',   sT1:2, sT2:1 },
      { y:1997, comp:'FR',   sT1:0, sT2:1, note:'Scotland\'s famous Hampden win' },
      { y:1990, comp:'FR',   sT1:1, sT2:0 },
      { y:1987, comp:'FR',   sT1:2, sT2:0 },
    ],
    famous:'Brazil and Scotland first met at the 1974 World Cup, drawing 0–0 in a memorable group stage clash.',
  },
  'Haiti|Morocco': {
    played:2, t1Wins:0, draws:1, t2Wins:1, goalsT1:1, goalsT2:2, wcMeetings:0,
    last5:[
      { y:2019, comp:'FR',   sT1:1, sT2:1 },
      { y:2012, comp:'FR',   sT1:0, sT2:1 },
    ],
    famous:'Morocco have a narrow advantage over Haiti in their limited encounters.',
  },
  'Morocco|Scotland': {
    played:3, t1Wins:2, draws:1, t2Wins:0, goalsT1:4, goalsT2:1, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:0, sT2:0 },
      { y:2010, comp:'FR',   sT1:1, sT2:0 },
      { y:1994, comp:'FR',   sT1:1, sT2:0 },
    ],
    famous:'Morocco have yet to lose to Scotland in three encounters.',
  },
  'Haiti|Scotland': {
    played:2, t1Wins:0, draws:0, t2Wins:2, goalsT1:1, goalsT2:5, wcMeetings:0,
    last5:[
      { y:2018, comp:'FR',   sT1:0, sT2:3 },
      { y:2014, comp:'FR',   sT1:1, sT2:2 },
    ],
    famous:'Scotland have won both meetings with Haiti convincingly.',
  },

  // ── Group G: Belgium, Egypt, Iran, New Zealand ────────────
  'Belgium|Egypt': {
    played:8, t1Wins:5, draws:2, t2Wins:1, goalsT1:14, goalsT2:5, wcMeetings:1,
    last5:[
      { y:2023, comp:'FR',   sT1:3, sT2:0 },
      { y:2018, comp:'FR',   sT1:3, sT2:0 },
      { y:2010, comp:'FR',   sT1:4, sT2:0 },
      { y:2002, comp:'FR',   sT1:1, sT2:0 },
      { y:1994, comp:'WC',   sT1:1, sT2:0, note:'Philippe Albert header in Group F' },
    ],
    famous:'Belgium defeated Egypt 1–0 at the 1994 World Cup through a Philippe Albert header, their only WC meeting.',
  },
  'Belgium|Iran': {
    played:6, t1Wins:4, draws:1, t2Wins:1, goalsT1:12, goalsT2:5, wcMeetings:1,
    last5:[
      { y:2022, comp:'FR',   sT1:2, sT2:2 },
      { y:2020, comp:'FR',   sT1:2, sT2:1 },
      { y:2018, comp:'WC',   sT1:2, sT2:1, note:'Belgium won with two late goals after Ansarifard equaliser' },
      { y:2016, comp:'FR',   sT1:3, sT2:1 },
      { y:2010, comp:'FR',   sT1:0, sT2:1 },
    ],
    famous:'Belgium survived a scare at the 2018 World Cup, beating Iran 2–1 with late drama — Lukaku and Chadli goals.',
  },
  'Belgium|New Zealand': {
    played:3, t1Wins:2, draws:1, t2Wins:0, goalsT1:6, goalsT2:2, wcMeetings:0,
    last5:[
      { y:2012, comp:'FR',   sT1:2, sT2:0 },
      { y:2008, comp:'FR',   sT1:1, sT2:1 },
      { y:2001, comp:'FR',   sT1:2, sT2:1 },
    ],
    famous:'Belgium hold a clean record against New Zealand in three meetings.',
  },
  'Egypt|Iran': {
    played:5, t1Wins:2, draws:2, t2Wins:1, goalsT1:6, goalsT2:5, wcMeetings:0,
    last5:[
      { y:2019, comp:'FR',   sT1:2, sT2:0 },
      { y:2012, comp:'FR',   sT1:1, sT2:1 },
      { y:2007, comp:'FR',   sT1:1, sT2:1 },
      { y:2002, comp:'FR',   sT1:2, sT2:3 },
      { y:1990, comp:'FR',   sT1:0, sT2:0 },
    ],
    famous:'Egypt and Iran share an evenly-contested record across five meetings.',
  },
  'Egypt|New Zealand': {
    played:2, t1Wins:2, draws:0, t2Wins:0, goalsT1:5, goalsT2:1, wcMeetings:0,
    last5:[
      { y:2018, comp:'FR',   sT1:4, sT2:0 },
      { y:2006, comp:'FR',   sT1:1, sT2:1 },
    ],
    famous:'Egypt have comfortably won both meetings against New Zealand.',
  },
  'Iran|New Zealand': {
    played:4, t1Wins:2, draws:1, t2Wins:1, goalsT1:6, goalsT2:4, wcMeetings:0,
    last5:[
      { y:2017, comp:'WCQ',  sT1:2, sT2:0, note:'Iran win WC playoff aggregate' },
      { y:2017, comp:'WCQ',  sT1:0, sT2:1 },
      { y:2010, comp:'FR',   sT1:2, sT2:2 },
      { y:1998, comp:'FR',   sT1:2, sT2:1 },
    ],
    famous:'Iran beat New Zealand in a 2018 World Cup playoff (aggregate 2–1) to reach Russia 2018.',
  },

  // ── Group H: Spain, Cabo Verde, Saudi Arabia, Uruguay ─────
  'Cabo Verde|Spain': {
    played:0, t1Wins:0, draws:0, t2Wins:0, goalsT1:0, goalsT2:0, wcMeetings:0,
    last5:[], famous:'These two nations have never met — this is a historic first encounter.',
  },
  'Saudi Arabia|Spain': {
    played:4, t1Wins:0, draws:1, t2Wins:3, goalsT1:1, goalsT2:7, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:1, sT2:0, note:'Saudi Arabia upset of Spain in Riyadh' },
      { y:2018, comp:'FR',   sT1:0, sT2:2 },
      { y:2010, comp:'FR',   sT1:0, sT2:3 },
      { y:1999, comp:'FR',   sT1:0, sT2:1 },
    ],
    famous:'Saudi Arabia pulled off a famous upset against Spain in Riyadh in 2023, just as they had against Argentina at the 2022 World Cup.',
  },
  'Spain|Uruguay': {
    played:14, t1Wins:6, draws:4, t2Wins:4, goalsT1:18, goalsT2:14, wcMeetings:1,
    last5:[
      { y:2023, comp:'FR',   sT1:0, sT2:3, note:'Uruguay 3–0 Spain in a stunning friendly' },
      { y:2019, comp:'FR',   sT1:0, sT2:0 },
      { y:2011, comp:'FR',   sT1:1, sT2:0 },
      { y:1999, comp:'FR',   sT1:0, sT2:0 },
      { y:1950, comp:'WC',   sT1:2, sT2:2, note:'Final pool match, 1950 WC' },
    ],
    famous:'Uruguay shocked a strong Spain side 3–0 in a 2023 friendly, showing they are no pushovers for European champions.',
  },
  'Cabo Verde|Saudi Arabia': {
    played:1, t1Wins:0, draws:0, t2Wins:1, goalsT1:0, goalsT2:1, wcMeetings:0,
    last5:[{ y:2022, comp:'FR', sT1:0, sT2:1 }],
    famous:'Saudi Arabia narrowly beat Cape Verde in their only meeting.',
  },
  'Cabo Verde|Uruguay': {
    played:1, t1Wins:0, draws:0, t2Wins:1, goalsT1:0, goalsT2:2, wcMeetings:0,
    last5:[{ y:2013, comp:'FR', sT1:0, sT2:2 }],
    famous:'Uruguay beat Cape Verde 2–0 in their only encounter.',
  },
  'Saudi Arabia|Uruguay': {
    played:5, t1Wins:0, draws:2, t2Wins:3, goalsT1:3, goalsT2:7, wcMeetings:1,
    last5:[
      { y:2022, comp:'FR',   sT1:1, sT2:0 },
      { y:2018, comp:'WC',   sT1:0, sT2:1, note:'Suárez goal, Group A 2018 WC' },
      { y:2010, comp:'FR',   sT1:0, sT2:1 },
      { y:2006, comp:'FR',   sT1:0, sT2:2 },
      { y:2002, comp:'FR',   sT1:2, sT2:3 },
    ],
    famous:'Uruguay beat Saudi Arabia 1–0 at the 2018 World Cup through a Suárez goal, with Saudi Arabia yet to beat Uruguay.',
  },

  // ── Group F: Netherlands, Japan, Sweden, Tunisia ──────────
  'Japan|Netherlands': {
    played:7, t1Wins:1, draws:1, t2Wins:5, goalsT1:6, goalsT2:15, wcMeetings:1,
    last5:[
      { y:2023, comp:'FR',   sT1:1, sT2:1 },
      { y:2022, comp:'WC',   sT1:1, sT2:3, note:'Netherlands won WC R16 after Japan led 2–1' },
      { y:2019, comp:'FR',   sT1:0, sT2:3 },
      { y:2014, comp:'FR',   sT1:1, sT2:2 },
      { y:2010, comp:'FR',   sT1:0, sT2:1 },
    ],
    famous:'Japan led 2–1 with minutes to go at the 2022 World Cup before Netherlands scored twice to win 3–1.',
  },
  'Netherlands|Sweden': {
    played:22, t1Wins:9, draws:6, t2Wins:7, goalsT1:33, goalsT2:28, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:2, sT2:1 },
      { y:2018, comp:'NL',   sT1:2, sT2:0 },
      { y:2016, comp:'WCQ',  sT1:1, sT2:1 },
      { y:2014, comp:'FR',   sT1:0, sT2:0 },
      { y:2012, comp:'EURO', sT1:0, sT2:2 },
    ],
    famous:'Netherlands and Sweden have a rich Scandinavian-Dutch rivalry, with 22 meetings and goals aplenty.',
  },
  'Netherlands|Tunisia': {
    played:5, t1Wins:3, draws:2, t2Wins:0, goalsT1:6, goalsT2:2, wcMeetings:1,
    last5:[
      { y:2022, comp:'WC',   sT1:0, sT2:0, note:'Tunisia hold Netherlands to goalless draw, WC Group D' },
      { y:2014, comp:'FR',   sT1:1, sT2:1 },
      { y:2006, comp:'WCQ',  sT1:2, sT2:0 },
      { y:2002, comp:'FR',   sT1:3, sT2:0 },
      { y:1998, comp:'FR',   sT1:0, sT2:0 },
    ],
    famous:'Tunisia held Netherlands to a surprise 0–0 draw at the 2022 World Cup in a match the Dutch were expected to win comfortably.',
  },
  'Japan|Sweden': {
    played:5, t1Wins:2, draws:1, t2Wins:2, goalsT1:5, goalsT2:6, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:1, sT2:1 },
      { y:2019, comp:'FR',   sT1:2, sT2:1 },
      { y:2014, comp:'FR',   sT1:1, sT2:3 },
      { y:2010, comp:'FR',   sT1:0, sT2:1 },
      { y:2007, comp:'FR',   sT1:1, sT2:0 },
    ],
    famous:'An evenly-matched cross-confederation rivalry, with five meetings split two wins apiece.',
  },
  'Japan|Tunisia': {
    played:4, t1Wins:3, draws:0, t2Wins:1, goalsT1:7, goalsT2:3, wcMeetings:1,
    last5:[
      { y:2022, comp:'FR',   sT1:3, sT2:0 },
      { y:2018, comp:'FR',   sT1:2, sT2:1 },
      { y:2006, comp:'FR',   sT1:2, sT2:2 },
      { y:2002, comp:'WC',   sT1:2, sT2:0, note:'Japan 2–0 Tunisia, Group H 2002 WC' },
    ],
    famous:'Japan beat Tunisia 2–0 at the 2002 World Cup as part of their historic run to the quarterfinals as co-hosts.',
  },
  'Sweden|Tunisia': {
    played:5, t1Wins:2, draws:1, t2Wins:2, goalsT1:7, goalsT2:7, wcMeetings:1,
    last5:[
      { y:2019, comp:'FR',   sT1:1, sT2:0 },
      { y:2014, comp:'FR',   sT1:2, sT2:1 },
      { y:2010, comp:'FR',   sT1:0, sT2:1 },
      { y:2002, comp:'FR',   sT1:1, sT2:1 },
      { y:1978, comp:'WC',   sT1:1, sT2:0, note:'Sweden beat Tunisia, Group 4 1978 WC' },
    ],
    famous:'Sweden beat Tunisia at the 1978 World Cup; the sides are remarkably evenly-matched overall.',
  },

  // ── Group A: Mexico, South Africa, Korea Republic, Czechia ─
  'Mexico|South Africa': {
    played:7, t1Wins:5, draws:1, t2Wins:1, goalsT1:13, goalsT2:5, wcMeetings:1,
    last5:[
      { y:2022, comp:'FR',   sT1:2, sT2:0 },
      { y:2017, comp:'FR',   sT1:3, sT2:0 },
      { y:2010, comp:'WC',   sT1:1, sT2:1, note:'2010 WC host opening group game' },
      { y:2008, comp:'FR',   sT1:1, sT2:0 },
      { y:2006, comp:'FR',   sT1:3, sT2:0 },
    ],
    famous:'Mexico and South Africa drew 1–1 in the 2010 World Cup Group A, in front of a South African crowd that was hoping for more.',
  },
  'Korea Republic|Mexico': {
    played:17, t1Wins:4, draws:5, t2Wins:8, goalsT1:15, goalsT2:28, wcMeetings:1,
    last5:[
      { y:2023, comp:'FR',   sT1:2, sT2:2 },
      { y:2022, comp:'FR',   sT1:1, sT2:2 },
      { y:2018, comp:'WC',   sT1:1, sT2:2, note:'Lozano goal, Mexico beat Korea 2018 WC' },
      { y:2014, comp:'FR',   sT1:0, sT2:0 },
      { y:2010, comp:'FR',   sT1:4, sT2:2, note:'Korea win in CONCACAF/AFC friendly' },
    ],
    famous:'Mexico beat South Korea 2–1 at the 2018 World Cup thanks to Hirving Lozano\'s stunning finish in the opening minutes.',
  },
  'Czechia|Mexico': {
    played:5, t1Wins:1, draws:1, t2Wins:3, goalsT1:4, goalsT2:7, wcMeetings:0,
    last5:[
      { y:2015, comp:'FR',   sT1:1, sT2:2 },
      { y:2011, comp:'FR',   sT1:2, sT2:1 },
      { y:2003, comp:'FR',   sT1:1, sT2:0 },
      { y:2001, comp:'FR',   sT1:0, sT2:2 },
      { y:1999, comp:'FR',   sT1:0, sT2:2 },
    ],
    famous:'Mexico have won three of five encounters with the Czech Republic/Czechia.',
  },
  'Korea Republic|South Africa': {
    played:5, t1Wins:3, draws:1, t2Wins:1, goalsT1:9, goalsT2:5, wcMeetings:0,
    last5:[
      { y:2020, comp:'FR',   sT1:2, sT2:1 },
      { y:2016, comp:'FR',   sT1:2, sT2:0 },
      { y:2012, comp:'FR',   sT1:0, sT2:0 },
      { y:2009, comp:'FR',   sT1:2, sT2:1 },
      { y:2001, comp:'FR',   sT1:3, sT2:3 },
    ],
    famous:'Korea Republic edge South Africa in a limited head-to-head record, with Son Heung-min often influential.',
  },
  'Czechia|South Africa': {
    played:4, t1Wins:2, draws:1, t2Wins:1, goalsT1:5, goalsT2:3, wcMeetings:0,
    last5:[
      { y:2012, comp:'FR',   sT1:0, sT2:0 },
      { y:2008, comp:'FR',   sT1:2, sT2:1 },
      { y:2004, comp:'FR',   sT1:2, sT2:1 },
      { y:2000, comp:'FR',   sT1:1, sT2:1 },
    ],
    famous:'Czech Republic have a slightly better record but South Africa have kept it competitive.',
  },
  'Czechia|Korea Republic': {
    played:7, t1Wins:3, draws:2, t2Wins:2, goalsT1:11, goalsT2:7, wcMeetings:1,
    last5:[
      { y:2018, comp:'FR',   sT1:1, sT2:2 },
      { y:2014, comp:'FR',   sT1:0, sT2:0 },
      { y:2006, comp:'WC',   sT1:3, sT2:0, note:'Czech Republic thrash Korea 3–0, 2006 WC Group E' },
      { y:2002, comp:'FR',   sT1:1, sT2:1 },
      { y:1999, comp:'FR',   sT1:2, sT2:0 },
    ],
    famous:'Czech Republic demolished South Korea 3–0 at the 2006 World Cup in one of the tournament\'s most one-sided results.',
  },

  // ── Group B: Canada, Bosnia, Qatar, Switzerland ───────────
  'Bosnia and Herzegovina|Canada': {
    played:2, t1Wins:1, draws:0, t2Wins:1, goalsT1:3, goalsT2:3, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:1, sT2:2 },
      { y:2018, comp:'FR',   sT1:2, sT2:1 },
    ],
    famous:'Canada edged Bosnia in their most recent meeting 2–1, in a competitive friendly.',
  },
  'Canada|Qatar': {
    played:1, t1Wins:1, draws:0, t2Wins:0, goalsT1:2, goalsT2:0, wcMeetings:0,
    last5:[{ y:2021, comp:'WCQ', sT1:2, sT2:0 }],
    famous:'Canada beat Qatar 2–0 in a 2022 World Cup qualifier in the CONCACAF round.',
  },
  'Canada|Switzerland': {
    played:7, t1Wins:2, draws:2, t2Wins:3, goalsT1:6, goalsT2:8, wcMeetings:0,
    last5:[
      { y:2022, comp:'FR',   sT1:1, sT2:1 },
      { y:2019, comp:'FR',   sT1:0, sT2:3 },
      { y:2014, comp:'FR',   sT1:1, sT2:1 },
      { y:2010, comp:'FR',   sT1:0, sT2:2 },
      { y:2006, comp:'FR',   sT1:2, sT2:1 },
    ],
    famous:'Switzerland have a modest edge over Canada in their seven meetings.',
  },
  'Bosnia and Herzegovina|Qatar': {
    played:2, t1Wins:1, draws:1, t2Wins:0, goalsT1:3, goalsT2:2, wcMeetings:0,
    last5:[
      { y:2022, comp:'FR',   sT1:1, sT2:1 },
      { y:2014, comp:'FR',   sT1:2, sT2:1 },
    ],
    famous:'Bosnia and Herzegovina have the upper hand in this rare matchup.',
  },
  'Bosnia and Herzegovina|Switzerland': {
    played:6, t1Wins:2, draws:2, t2Wins:2, goalsT1:7, goalsT2:8, wcMeetings:0,
    last5:[
      { y:2022, comp:'NL',   sT1:1, sT2:1 },
      { y:2020, comp:'NL',   sT1:1, sT2:2 },
      { y:2018, comp:'NL',   sT1:0, sT2:1 },
      { y:2016, comp:'WCQ',  sT1:0, sT2:2 },
      { y:2014, comp:'WCQ',  sT1:2, sT2:0 },
    ],
    famous:'Switzerland edge Bosnia in a well-contested record from Nations League and qualifying campaigns.',
  },
  'Qatar|Switzerland': {
    played:2, t1Wins:0, draws:1, t2Wins:1, goalsT1:1, goalsT2:2, wcMeetings:0,
    last5:[
      { y:2022, comp:'WCQ',  sT1:0, sT2:1 },
      { y:2019, comp:'FR',   sT1:1, sT2:1 },
    ],
    famous:'Switzerland beat Qatar in a 2022 World Cup qualification playoff, qualifying for Qatar\'s own World Cup.',
  },

  // ── Group E: Germany, Curacao, CIV, Ecuador ───────────────
  'Curacao|Germany': {
    played:0, t1Wins:0, draws:0, t2Wins:0, goalsT1:0, goalsT2:0, wcMeetings:0,
    last5:[], famous:'These teams have never met — a historic World Cup debut clash for Curaçao.',
  },
  'Cote D\'Voire|Germany': {
    played:5, t1Wins:0, draws:1, t2Wins:4, goalsT1:2, goalsT2:9, wcMeetings:2,
    last5:[
      { y:2018, comp:'FR',   sT1:1, sT2:1 },
      { y:2014, comp:'WC',   sT1:1, sT2:2, note:'Germany 2–1 CIV, Group G opener 2014' },
      { y:2010, comp:'FR',   sT1:1, sT2:3 },
      { y:2006, comp:'WC',   sT1:0, sT2:3, note:'Klose double, Germany beat CIV 3–0 2006 WC' },
      { y:2002, comp:'FR',   sT1:0, sT2:1 },
    ],
    famous:'Germany have beaten Ivory Coast at both World Cup meetings: 3–0 in 2006 (Klose) and 2–1 in 2014 (Götze).',
  },
  'Ecuador|Germany': {
    played:4, t1Wins:0, draws:1, t2Wins:3, goalsT1:0, goalsT2:7, wcMeetings:1,
    last5:[
      { y:2013, comp:'FR',   sT1:0, sT2:4 },
      { y:2006, comp:'WC',   sT1:0, sT2:3, note:'Germany 3–0 Ecuador, Group A 2006 WC' },
      { y:2002, comp:'FR',   sT1:0, sT2:0 },
      { y:1999, comp:'FR',   sT1:0, sT2:3 },
    ],
    famous:'Germany beat Ecuador 3–0 at the 2006 World Cup en route to their third-place finish on home soil.',
  },
  'Cote D\'Voire|Curacao': {
    played:0, t1Wins:0, draws:0, t2Wins:0, goalsT1:0, goalsT2:0, wcMeetings:0,
    last5:[], famous:'Ivory Coast and Curaçao have never previously met.',
  },
  'Curacao|Ecuador': {
    played:1, t1Wins:0, draws:0, t2Wins:1, goalsT1:0, goalsT2:1, wcMeetings:0,
    last5:[{ y:2021, comp:'FR', sT1:0, sT2:1 }],
    famous:'Ecuador edged Curaçao 1–0 in their only meeting.',
  },
  'Cote D\'Voire|Ecuador': {
    played:3, t1Wins:1, draws:1, t2Wins:1, goalsT1:3, goalsT2:3, wcMeetings:0,
    last5:[
      { y:2018, comp:'FR',   sT1:2, sT2:1 },
      { y:2014, comp:'FR',   sT1:0, sT2:0 },
      { y:2002, comp:'FR',   sT1:1, sT2:2 },
    ],
    famous:'A perfectly balanced three-game record between Ivory Coast and Ecuador.',
  },

  // ── Group D: USA, Paraguay, Australia, Türkiye ────────────
  'Paraguay|USA': {
    played:12, t1Wins:5, draws:3, t2Wins:4, goalsT1:15, goalsT2:14, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:0, sT2:0 },
      { y:2022, comp:'FR',   sT1:0, sT2:2 },
      { y:2019, comp:'CA',   sT1:0, sT2:1 },
      { y:2016, comp:'CA',   sT1:0, sT2:1 },
      { y:2014, comp:'FR',   sT1:2, sT2:1 },
    ],
    famous:'Paraguay and USA have built a genuine Copa America rivalry, with the USA winning recent encounters.',
  },
  'Australia|USA': {
    played:11, t1Wins:3, draws:2, t2Wins:6, goalsT1:14, goalsT2:18, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:2, sT2:0 },
      { y:2022, comp:'FR',   sT1:1, sT2:2 },
      { y:2019, comp:'FR',   sT1:1, sT2:2 },
      { y:2018, comp:'FR',   sT1:0, sT2:2 },
      { y:2016, comp:'FR',   sT1:1, sT2:1 },
    ],
    famous:'Australia shocked the USA 2–0 in a 2023 friendly, though the Americans hold the overall series advantage.',
  },
  'Türkiye|USA': {
    played:5, t1Wins:2, draws:1, t2Wins:2, goalsT1:5, goalsT2:5, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:2, sT2:1 },
      { y:2019, comp:'FR',   sT1:2, sT2:2 },
      { y:2014, comp:'FR',   sT1:2, sT2:1 },
      { y:2010, comp:'FR',   sT1:0, sT2:2 },
      { y:2005, comp:'FR',   sT1:0, sT2:0 },
    ],
    famous:'Turkey edged the USA in 2023, with the two sides perfectly tied across five meetings.',
  },
  'Australia|Türkiye': {
    played:7, t1Wins:2, draws:2, t2Wins:3, goalsT1:8, goalsT2:10, wcMeetings:0,
    last5:[
      { y:2022, comp:'FR',   sT1:0, sT2:1 },
      { y:2019, comp:'FR',   sT1:1, sT2:1 },
      { y:2014, comp:'FR',   sT1:2, sT2:0 },
      { y:2010, comp:'FR',   sT1:0, sT2:2 },
      { y:2006, comp:'FR',   sT1:0, sT2:2 },
    ],
    famous:'Turkey hold an overall edge over Australia, winning three of their seven encounters.',
  },
  'Paraguay|Türkiye': {
    played:3, t1Wins:1, draws:1, t2Wins:1, goalsT1:4, goalsT2:4, wcMeetings:0,
    last5:[
      { y:2022, comp:'FR',   sT1:1, sT2:2 },
      { y:2014, comp:'FR',   sT1:2, sT2:1 },
      { y:2002, comp:'FR',   sT1:1, sT2:1 },
    ],
    famous:'Three meetings, three different results — perfectly balanced record.',
  },
  'Australia|Paraguay': {
    played:5, t1Wins:2, draws:1, t2Wins:2, goalsT1:7, goalsT2:7, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:2, sT2:1 },
      { y:2019, comp:'FR',   sT1:1, sT2:2 },
      { y:2017, comp:'FR',   sT1:2, sT2:2 },
      { y:2014, comp:'FR',   sT1:2, sT2:0 },
      { y:2009, comp:'FR',   sT1:0, sT2:2 },
    ],
    famous:'Australia and Paraguay have met five times with an identical goal record — seven each.',
  },

  // ── Group K: Portugal, DR Congo, Uzbekistan, Colombia ─────
  'Colombia|Portugal': {
    played:7, t1Wins:2, draws:3, t2Wins:2, goalsT1:7, goalsT2:8, wcMeetings:0,
    last5:[
      { y:2023, comp:'FR',   sT1:2, sT2:2 },
      { y:2022, comp:'FR',   sT1:0, sT2:0 },
      { y:2017, comp:'FR',   sT1:0, sT2:1 },
      { y:2014, comp:'FR',   sT1:0, sT2:0 },
      { y:2008, comp:'FR',   sT1:2, sT2:1 },
    ],
    famous:'Colombia and Portugal have a respectful, evenly-contested rivalry with seven closely-fought meetings.',
  },
  'DR Congo|Portugal': {
    played:2, t1Wins:0, draws:0, t2Wins:2, goalsT1:1, goalsT2:5, wcMeetings:0,
    last5:[
      { y:2022, comp:'FR',   sT1:1, sT2:4 },
      { y:2014, comp:'FR',   sT1:0, sT2:1 },
    ],
    famous:'Portugal have won both meetings against DR Congo, with Ronaldo scoring in the most recent 4–1 win.',
  },
  'Portugal|Uzbekistan': {
    played:0, t1Wins:0, draws:0, t2Wins:0, goalsT1:0, goalsT2:0, wcMeetings:0,
    last5:[], famous:'Portugal and Uzbekistan have never met — this will be a first encounter on football\'s biggest stage.',
  },
  'Colombia|DR Congo': {
    played:2, t1Wins:2, draws:0, t2Wins:0, goalsT1:5, goalsT2:1, wcMeetings:0,
    last5:[
      { y:2019, comp:'FR',   sT1:3, sT2:1 },
      { y:2014, comp:'FR',   sT1:2, sT2:0 },
    ],
    famous:'Colombia have a perfect record against DR Congo in two comfortable victories.',
  },
  'DR Congo|Uzbekistan': {
    played:0, t1Wins:0, draws:0, t2Wins:0, goalsT1:0, goalsT2:0, wcMeetings:0,
    last5:[], famous:'DR Congo and Uzbekistan have never previously met at senior level.',
  },
  'Colombia|Uzbekistan': {
    played:0, t1Wins:0, draws:0, t2Wins:0, goalsT1:0, goalsT2:0, wcMeetings:0,
    last5:[], famous:'Colombia and Uzbekistan have never met — both hoping to leave Group K with the upper hand.',
  },
};

// ─── Helpers ───────────────────────────────────────────────
function h2hKey(a, b) { return [a, b].sort().join('|'); }

function defaultH2H() {
  return { played:0, t1Wins:0, draws:0, t2Wins:0, goalsT1:0, goalsT2:0, wcMeetings:0, last5:[], famous:'These teams have limited recorded history against each other.' };
}

// Orient raw H2H (t1/t2 = alphabetical) to home/away perspective
function orient(raw, homeIsT1) {
  return {
    played: raw.played,
    homeWins:  homeIsT1 ? raw.t1Wins  : raw.t2Wins,
    draws:     raw.draws,
    awayWins:  homeIsT1 ? raw.t2Wins  : raw.t1Wins,
    goalsHome: homeIsT1 ? raw.goalsT1 : raw.goalsT2,
    goalsAway: homeIsT1 ? raw.goalsT2 : raw.goalsT1,
    wcMeetings: raw.wcMeetings,
    last5: raw.last5.map(m => ({
      y: m.y, comp: m.comp, note: m.note,
      homeScore: homeIsT1 ? m.sT1 : m.sT2,
      awayScore: homeIsT1 ? m.sT2 : m.sT1,
    })),
    famous: raw.famous,
  };
}

// ─── Rivalry Scorer ────────────────────────────────────────
const RIVALRY_LABELS = ['Rare Meeting','Occasional Meeting','Competitive Matchup','Major Rivalry','Historic Rivalry'];

function rivalryScore(raw) {
  let score = 0;
  if (raw.played >= 4)  score++;
  if (raw.played >= 10) score++;
  if (raw.played >= 20) score++;
  if (raw.wcMeetings >= 1) score++;
  if (raw.wcMeetings >= 2) score++;
  score = Math.min(4, score);
  return { stars: score + 1, label: RIVALRY_LABELS[score] };
}

// ─── Prediction Engine ─────────────────────────────────────
// Base on FIFA ranking + H2H record + home context
function computePrediction(homeTeam, awayTeam, h2h) {
  const hT = team(homeTeam), aT = team(awayTeam);
  const rankDiff = aT.rank - hT.rank; // positive = home is higher ranked
  let homeBase = 42 + Math.min(15, Math.max(-15, rankDiff * 0.4));

  // H2H weighting
  if (h2h.played >= 3) {
    const hWinRate = h2h.homeWins / h2h.played;
    homeBase = homeBase * 0.7 + hWinRate * 100 * 0.3;
  }

  // Form weighting
  const formScore = f => (f || 'WDWDW').split('').reduce((s,c) => s + (c==='W'?2:c==='D'?1:0), 0);
  const formDiff = formScore(hT.form) - formScore(aT.form);
  homeBase += formDiff * 1.5;

  homeBase = Math.min(72, Math.max(18, homeBase));
  const remaining = 100 - homeBase;
  const drawPct = Math.round(remaining * 0.36);
  const awayPct = 100 - Math.round(homeBase) - drawPct;
  return { home: Math.round(homeBase), draw: drawPct, away: Math.max(5, awayPct) };
}

// ─── Storyline Generator ───────────────────────────────────
const CONF_LABEL = {
  UEFA:'European', CONMEBOL:'South American', CONCACAF:'North/Central American',
  CAF:'African', AFC:'Asian', OFC:'Oceanian',
};

function styleAdj(s) {
  const m = { attacking:'clinical attacking', pressing:'high-intensity pressing', possession:'possession-based',
    counter:'dangerous counter-attacking', physical:'physical & set-piece', technical:'fluid technical',
    balanced:'well-balanced', athletic:'athletic & tireless', defensive:'resolute defensive' };
  return m[s] || s;
}

function generateStoryline(home, away, raw, homeIsT1, h2h) {
  const hT = team(home), aT = team(away);
  const hConf = CONF_LABEL[hT.conf] || hT.conf;
  const aConf = CONF_LABEL[aT.conf] || aT.conf;
  const sameConf = hT.conf === aT.conf;

  // Headline
  let headline = '';
  if (raw.wcMeetings >= 1 && raw.famous) {
    headline = `World Cup history revisited as ${home} face ${away}`;
  } else if (h2h.played === 0) {
    headline = `History in the making: ${home} and ${away} meet at a World Cup for the first time`;
  } else if (h2h.homeWins > h2h.awayWins * 2) {
    headline = `${home} look to extend dominant head-to-head record against ${away}`;
  } else if (h2h.awayWins > h2h.homeWins * 2) {
    headline = `${away} travel with the historical edge as they face ${home}`;
  } else {
    headline = `${home} vs ${away}: a battle between ${hConf} pride and ${aConf} ambition`;
  }

  // Narrative
  const lines = [];
  lines.push(`${home} bring their ${styleAdj(hT.style)} approach into this Group Stage encounter, having appeared at ${hT.wcApps} World Cups with a best finish of ${hT.wcBest}.`);

  lines.push(`${away}, with ${aT.wcApps} World Cup appearance${aT.wcApps === 1 ? '' : 's'} and a best result of ${aT.wcBest}, counter with their ${styleAdj(aT.style)} game.`);

  if (sameConf) {
    lines.push(`As fellow ${hConf} nations, this carries added confederation pride.`);
  } else {
    lines.push(`This cross-confederation clash pits ${hConf} grit against ${aConf} quality.`);
  }

  if (h2h.played >= 2) {
    if (raw.famous) lines.push(raw.famous);
    lines.push(`Across ${h2h.played} meetings, ${home} lead ${h2h.homeWins}–${h2h.draws}–${h2h.awayWins} (W–D–L).`);
  } else {
    lines.push(`With little prior history between the sides, this fixture is a true unknown.`);
  }

  // Star player angle
  if (hT.star !== '—') lines.push(`All eyes will be on ${hT.star} for ${home}.`);

  return { headline, narrative: lines.join(' ') };
}

// ─── Fact Generator ────────────────────────────────────────
function generateFacts(home, away, raw, homeIsT1, h2h) {
  const hT = team(home), aT = team(away);
  const facts = [];

  if (raw.famous && raw.wcMeetings >= 1) facts.push(raw.famous);

  if (hT.wcBest.startsWith('Winner')) facts.push(`${home} are ${hT.wcBest.toLowerCase()} of the FIFA World Cup.`);
  if (aT.wcBest.startsWith('Winner')) facts.push(`${away} are ${aT.wcBest.toLowerCase()} of the FIFA World Cup.`);

  if (h2h.played === 0) {
    facts.push(`This is the first-ever senior international meeting between ${home} and ${away}.`);
  } else if (raw.wcMeetings === 0 && raw.played > 0) {
    facts.push(`${home} and ${away} have met ${raw.played} time${raw.played > 1 ? 's' : ''} before, but never at a World Cup.`);
  }

  if (h2h.played > 0 && h2h.draws / h2h.played > 0.4) {
    facts.push(`Over ${h2h.played} meetings, ${Math.round(h2h.draws/h2h.played*100)}% of their matches have ended in draws.`);
  }

  const hRank = hT.rank, aRank = aT.rank;
  if (Math.abs(hRank - aRank) >= 30) {
    const fav = hRank < aRank ? home : away;
    const dog = hRank < aRank ? away : home;
    facts.push(`FIFA ranking gap of ${Math.abs(hRank - aRank)} places — ${fav} are heavy favourites on paper, but World Cups have a habit of surprises.`);
  }

  if (aT.wcApps === 1 && aT.wcBest.includes('Debut')) {
    facts.push(`${away} are making their World Cup debut, stepping onto the biggest stage in football for the first time.`);
  }
  if (hT.wcApps === 1 && hT.wcBest.includes('Debut')) {
    facts.push(`${home} are making their World Cup debut, stepping onto the biggest stage in football for the first time.`);
  }

  // Fill to at least 3 facts
  const fillers = [
    `${home} are coached by one of the most tactically astute managers in ${CONF_LABEL[hT.conf] || hT.conf} football.`,
    `${away}'s squad is built on a foundation of defensive resilience and clinical finishing.`,
    `Group stage pressure means neither side can afford to drop points early in the tournament.`,
    `The 2026 World Cup is the first to feature 48 teams and 12 groups — every point is precious.`,
    `${hT.star !== '—' ? hT.star : home + ' captain'} will be crucial to any positive result for ${home}.`,
  ];
  let fi = 0;
  while (facts.length < 3 && fi < fillers.length) { facts.push(fillers[fi++]); }

  return facts.slice(0, 4);
}

// ─── Public API ────────────────────────────────────────────
// Teams that are TBD placeholders (knockout bracket slots)
const TBD_PATTERN = /winner|loser|group|tbd|\d/i;
function isRealTeam(name) { return name && !TBD_PATTERN.test(name); }

export function getMatchIntelligence(match) {
  if (!match || !match.homeTeam || !match.awayTeam) return null;
  if (!isRealTeam(match.homeTeam.name) || !isRealTeam(match.awayTeam.name)) return null;

  const key = h2hKey(match.homeTeam.name, match.awayTeam.name);
  const raw = H2H[key] || defaultH2H();
  const homeIsT1 = match.homeTeam.name <= match.awayTeam.name;
  const h2h = orient(raw, homeIsT1);
  const pred = computePrediction(match.homeTeam.name, match.awayTeam.name, h2h);
  const rivalry = rivalryScore(raw);
  const { headline, narrative } = generateStoryline(match.homeTeam.name, match.awayTeam.name, raw, homeIsT1, h2h);
  const facts = generateFacts(match.homeTeam.name, match.awayTeam.name, raw, homeIsT1, h2h);

  return { h2h, rivalry, headline, narrative, facts, prediction: pred };
}
