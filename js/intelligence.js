// ══════════════════════════════════════════════════════════════
//  CupVerse — Match Intelligence Engine
//  Rules-based engine: H2H records, rivalry scoring,
//  AI storylines, prediction bars. No external API required.
// ══════════════════════════════════════════════════════════════

// ─── Team Primary Colors (for national identity gradients) ──
const TEAM_COLORS = {
  Argentina:'#74ACDF',  France:'#002395',      England:'#CF091F',
  Brazil:'#009c3b',     Belgium:'#ED2939',      Portugal:'#006600',
  Netherlands:'#FF6600',Spain:'#AA151B',        Morocco:'#C1272D',
  Germany:'#1a1a1a',    USA:'#002868',          Mexico:'#006847',
  Uruguay:'#5EB6E4',    Senegal:'#00853F',      Switzerland:'#FF0000',
  Iran:'#239F40',       Australia:'#00008B',    Japan:'#BC002D',
  Colombia:'#FCD116',   Canada:'#FF0000',       Norway:'#EF2B2D',
  Sweden:'#006AA7',     Tunisia:'#E70013',      Czechia:'#D7141A',
  Ecuador:'#FFD100',    Algeria:'#006233',      Austria:'#ED2939',
  Jordan:'#007A3D',     Ghana:'#006B3F',        Croatia:'#FF0000',
  Scotland:'#003087',   Paraguay:'#D52B1E',     Egypt:'#EE1C25',
  'Korea Republic':'#C60C30',  'Saudi Arabia':'#006C35',
  'South Africa':'#007A4D',    'Bosnia and Herzegovina':'#002395',
  Curacao:'#003DA5',           "Cote D'Voire":'#009A44',
  Iraq:'#007A3D',              'New Zealand':'#000000',
  'Cabo Verde':'#003893',      'DR Congo':'#007FFF',
  Uzbekistan:'#1EB53A',        Haiti:'#00209F',
  Panama:'#DA121A',            Türkiye:'#E30A17',
  Turkey:'#E30A17',            Qatar:'#8D1B3D',
};

export function getTeamColor(name) { return TEAM_COLORS[name] || '#4DA3FF'; }
export function getTeamData(name)  { return { ...team(name), color: getTeamColor(name) }; }

// Top contenders for the Golden Boot — derived from team star players + ranking
export const GOLDEN_BOOT_CONTENDERS = [
  { name: 'Kylian Mbappé',       team: 'France',      flag: '🇫🇷', goals: 0, assists: 0 },
  { name: 'Vinícius Jr.',        team: 'Brazil',      flag: '🇧🇷', goals: 0, assists: 0 },
  { name: 'Lautaro Martínez',    team: 'Argentina',   flag: '🇦🇷', goals: 0, assists: 0 },
  { name: 'Jude Bellingham',     team: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', goals: 0, assists: 0 },
  { name: 'Erling Haaland',      team: 'Norway',      flag: '🇳🇴', goals: 0, assists: 0 },
  { name: 'Pedri',               team: 'Spain',       flag: '🇪🇸', goals: 0, assists: 0 },
  { name: 'Mohamed Salah',       team: 'Egypt',       flag: '🇪🇬', goals: 0, assists: 0 },
  { name: 'Jamal Musiala',       team: 'Germany',     flag: '🇩🇪', goals: 0, assists: 0 },
  { name: 'Achraf Hakimi',       team: 'Morocco',     flag: '🇲🇦', goals: 0, assists: 0 },
  { name: 'Cristiano Ronaldo',   team: 'Portugal',    flag: '🇵🇹', goals: 0, assists: 0 },
  { name: 'Luis Díaz',           team: 'Colombia',    flag: '🇨🇴', goals: 0, assists: 0 },
  { name: 'Christian Pulisic',   team: 'USA',         flag: '🇺🇸', goals: 0, assists: 0 },
  { name: 'Hirving Lozano',      team: 'Mexico',      flag: '🇲🇽', goals: 0, assists: 0 },
  { name: 'Son Heung-min',       team: 'Korea Republic', flag: '🇰🇷', goals: 0, assists: 0 },
  { name: 'Luka Modrić',         team: 'Croatia',     flag: '🇭🇷', goals: 0, assists: 0 },
];

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

// ─── Team Profiles (overview · strength · weakness · jersey colors) ───────────
const TEAM_PROFILES = {
  Argentina: {
    overview: "Reigning world champions and heavy favourites to defend their title in North America. Built around collective spirit forged under Scaloni, they blend tactical discipline with devastating brilliance from Lautaro Martínez and a world-class midfield. Their 2022 triumph has only sharpened their hunger.",
    strength: "Unmatched tournament mentality and a rock-solid defensive structure that rarely concedes.",
    weakness: "Ageing legs in key positions and limited squad depth could become a factor over a gruelling six-game run.",
    homeKit: { primary:"#74ACDF", secondary:"#FFFFFF", pattern:"stripes-v" },
    awayKit:  { primary:"#001C5C", secondary:"#74ACDF", pattern:"plain" },
  },
  France: {
    overview: "Les Bleus arrive as one of the most complete squads at the tournament, with pace, power and technical quality in every line. Kylian Mbappé leads an attacking unit with world-class options in reserve that few nations can match. France's ability to adapt tactically and win ugly is their hallmark.",
    strength: "Extraordinary squad depth — arguably the strongest bench options at the tournament.",
    weakness: "Internal chemistry issues and a tendency to underperform in group stages have disrupted past campaigns.",
    homeKit: { primary:"#002395", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#002395", pattern:"plain" },
  },
  England: {
    overview: "The Lions have never been more fancied to end their 60-year international drought. Jude Bellingham drives the midfield with supreme maturity, while a lethal front line can unlock any defence. A more expansive brand of football gives this generation genuine title credentials.",
    strength: "Elite talent in every position — particularly a creative midfield and ruthless forward line.",
    weakness: "Historical tendency to freeze on the biggest stages and stumble in penalty shootouts.",
    homeKit: { primary:"#FFFFFF", secondary:"#002868", pattern:"plain" },
    awayKit:  { primary:"#001C58", secondary:"#FFFFFF", pattern:"plain" },
  },
  Brazil: {
    overview: "The Seleção carry the weight of five World Cup titles and an incomparable footballing culture. Vinícius Júnior leads a front line with searing pace and creativity while Raphinha adds width and productivity. A deep, refreshed squad gives Brazil genuine title credentials.",
    strength: "Unstoppable in wide areas with some of the world's most dangerous wingers on the ball.",
    weakness: "Questions remain over defensive solidity and the ability to control tight games under pressure.",
    homeKit: { primary:"#FFDF00", secondary:"#009c3b", pattern:"plain" },
    awayKit:  { primary:"#003399", secondary:"#FFDF00", pattern:"plain" },
  },
  Spain: {
    overview: "La Roja enter in arguably their best form in over a decade — unbeaten in qualifying and playing scintillating football under De la Fuente. The midfield trio of Pedri, Gavi and Rodri is the envy of world football. Spain aim to match the dominant generation of 2008–2012.",
    strength: "Total midfield dominance — they press, control tempo and suffocate opponents like no other team.",
    weakness: "Finishing can be a concern: excellent at creating chances but occasionally wasteful in front of goal.",
    homeKit: { primary:"#AA151B", secondary:"#003399", pattern:"plain" },
    awayKit:  { primary:"#003399", secondary:"#AA151B", pattern:"plain" },
  },
  Germany: {
    overview: "Die Mannschaft enter with renewed energy and a clear identity built around Jamal Musiala's unpredictable brilliance. A blend of experienced heads and exciting youth gives Nagelsmann a flexible, dynamic squad. Germany have the quality to go all the way in North America.",
    strength: "Physical intensity, high-pressing and formidable transition play that can overwhelm any opponent.",
    weakness: "Defensive vulnerability on the counter-attack has been exposed against clinical opposition in recent tournaments.",
    homeKit: { primary:"#FFFFFF", secondary:"#000000", pattern:"plain" },
    awayKit:  { primary:"#1a1a1a", secondary:"#FFFFFF", pattern:"plain" },
  },
  Portugal: {
    overview: "The golden generation has one final window to claim football's ultimate prize. Cristiano Ronaldo remains a talismanic figure while Bruno Fernandes, Rúben Dias and Vitinha ensure Portugal are more than a one-man team. Technical quality throughout makes them a serious contender.",
    strength: "World-class technical ability in every line, particularly the creative playmakers behind the striker.",
    weakness: "Over-reliance on Cristiano Ronaldo for leadership means the team can fade if he is subdued.",
    homeKit: { primary:"#8B0000", secondary:"#006600", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#006600", pattern:"plain" },
  },
  Netherlands: {
    overview: "The Oranje are a force rebuilt with purpose under Koeman. Virgil van Dijk provides an immovable defensive anchor while Xavi Simons, Tijjani Reijnders and Cody Gakpo make them a constant attacking threat. The Dutch aim to go further than their 2022 quarterfinal exit.",
    strength: "Physical dominance at the back and electrifying pace on the break make them very difficult to beat.",
    weakness: "Consistency has been an issue — capable of brilliance one game and error-prone the next.",
    homeKit: { primary:"#FF6600", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#003DA5", secondary:"#FF6600", pattern:"plain" },
  },
  Morocco: {
    overview: "The Lions of the Atlas stunned the world in Qatar, becoming the first African side to reach the World Cup semi-finals. Walid Regragui has built a team of fearless warriors who press relentlessly and counter with devastating effect. Achraf Hakimi is one of the world's most dangerous full-backs.",
    strength: "Outstanding defensive organisation and set-piece threat backed by enormous collective will.",
    weakness: "Creativity in open play can be limited against well-organised, deep-sitting defences.",
    homeKit: { primary:"#C1272D", secondary:"#006233", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#C1272D", pattern:"plain" },
  },
  Belgium: {
    overview: "Though the golden generation has greyed at the edges, Belgium still possess world-class talent in Kevin De Bruyne — the creative heartbeat of any team he plays in. The squad blends experienced veterans with fresh faces. De Bruyne's fitness will dictate how far they go.",
    strength: "Kevin De Bruyne is perhaps the finest midfielder at the tournament when fully fit.",
    weakness: "Physical decline and an unresolved striker issue hamper their ceiling in a long tournament.",
    homeKit: { primary:"#111111", secondary:"#ED2939", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#ED2939", pattern:"plain" },
  },
  USA: {
    overview: "The co-hosts are determined to prove they belong among world football's elite on home soil. Christian Pulisic leads a vibrant, physically imposing team with quality options in midfield and attack. An electric home atmosphere could be the difference in tight matches.",
    strength: "Intensity, athleticism and home-crowd energy make them a dangerous opponent for any side.",
    weakness: "Lack of composure in key moments and defensive inconsistency can prove costly against elite opposition.",
    homeKit: { primary:"#FFFFFF", secondary:"#002868", pattern:"plain" },
    awayKit:  { primary:"#002868", secondary:"#BF0A30", pattern:"plain" },
  },
  Mexico: {
    overview: "El Tri always punch above their weight and their passionate supporters will travel in enormous numbers. Hirving Lozano brings pace and directness while a strong defensive shape makes them hard to break down. Breaking the round-of-16 curse remains the defining challenge of this generation.",
    strength: "Well-organised, tactically disciplined and never short of motivation playing on home soil.",
    weakness: "Have consistently struggled to advance past the round of 16 — a psychological ceiling that haunts them.",
    homeKit: { primary:"#006847", secondary:"#BCA04A", pattern:"plain" },
    awayKit:  { primary:"#CF091F", secondary:"#006847", pattern:"plain" },
  },
  Canada: {
    overview: "A maturing footballing nation with Alphonso Davies — one of the world's most electrifying full-backs — as their talisman. Built on energy, collective pressing and smart movement, Canada have come of age just in time to shine on home soil. A genuine first-round upset pick.",
    strength: "Alphonso Davies's pace and dynamism combined with a hard-working team ethos make them dangerous on transitions.",
    weakness: "Lack of international tournament experience at this level could prove costly in high-pressure moments.",
    homeKit: { primary:"#CC0000", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#CC0000", pattern:"plain" },
  },
  Colombia: {
    overview: "Los Cafeteros arrive in strong form with a fluid attacking style built around Luis Díaz and James Rodríguez. A gifted midfield provides the foundation while their attacking options are among the most creative in CONMEBOL. A last-16 push or beyond looks very realistic.",
    strength: "Creative flair in midfield and wide areas with quick transitions that can dismantle structured defences.",
    weakness: "Defensive lapses — particularly from set pieces — can be exploited by physical and organised sides.",
    homeKit: { primary:"#FCD116", secondary:"#003087", pattern:"plain" },
    awayKit:  { primary:"#003087", secondary:"#FCD116", pattern:"plain" },
  },
  Uruguay: {
    overview: "La Celeste bring a fierce competitive spirit that belies their small-nation size. Federico Valverde is one of the finest central midfielders in world football while Darwin Núñez provides a constant physical threat. Uruguay's proud culture demands nothing less than the latter stages.",
    strength: "Physical aggression, defensive resilience and midfield quality at the very highest level.",
    weakness: "An ageing squad in key positions and a tendency for indiscipline could hamper a deep run.",
    homeKit: { primary:"#5EB6E4", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#5EB6E4", pattern:"plain" },
  },
  Switzerland: {
    overview: "The Swiss are arguably the most underrated team at the tournament — consistently solid, tactically intelligent and difficult to beat. Granit Xhaka marshals the midfield with authority while Breel Embolo provides a constant physical outlet in attack. They rarely fear any opponent.",
    strength: "Rock-solid defensive organisation and tactical flexibility that absorbs pressure and hits on the counter.",
    weakness: "Lack of a proven elite striker and a tendency to stifle their own attacking potential under pressure.",
    homeKit: { primary:"#FF0000", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#FF0000", pattern:"plain" },
  },
  Norway: {
    overview: "Erling Haaland is a force of nature — arguably the most prolific striker on the planet — and his presence alone makes Norway a genuine outlier upset pick. The rest of the squad has improved significantly. If Haaland fires, anything is possible from this group.",
    strength: "Erling Haaland — the world's most clinical finisher, capable of winning a match single-handedly.",
    weakness: "Over-reliance on Haaland means if he is subdued, Norway have severely limited other avenues to goal.",
    homeKit: { primary:"#EF2B2D", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#EF2B2D", pattern:"plain" },
  },
  Sweden: {
    overview: "Sweden bring a familiar rugged resilience and team-first mentality. Physically imposing and disciplined, they frustrate opponents and exploit set pieces effectively. Without a galáctico, they rely on collective effort and well-drilled teamwork to compete at this level.",
    strength: "Physical toughness, excellent set-piece delivery and a team solidarity that makes them hard to beat.",
    weakness: "Limited creativity in midfield and underwhelming open-play threat against top-tier opposition.",
    homeKit: { primary:"#FCD116", secondary:"#006AA7", pattern:"plain" },
    awayKit:  { primary:"#006AA7", secondary:"#FCD116", pattern:"plain" },
  },
  Australia: {
    overview: "The Socceroos defied expectations to reach the 2022 last 16 and look to build on that momentum. A high-energy pressing game and the tireless leadership of Mathew Leckie give them a platform to upset bigger nations. Mat Ryan remains one of the most reliable shot-stoppers in the field.",
    strength: "Tenacious pressing, team spirit and an ability to raise their game against stronger opponents.",
    weakness: "Lack of genuine world-class quality in the final third limits their ceiling in tournament football.",
    homeKit: { primary:"#FFD700", secondary:"#006400", pattern:"plain" },
    awayKit:  { primary:"#006400", secondary:"#FFD700", pattern:"plain" },
  },
  Japan: {
    overview: "The Samurai Blue produced two jaw-dropping upsets in 2022 — defeating Germany and Spain in the group stage. Their chameleon-like ability to switch between deep defensive blocks and devastating counters makes them a nightmare to play against. Kubo and Kamada supply the creative spark.",
    strength: "Disciplined defensive shape and explosive counter-attacking that punishes any lapse in concentration.",
    weakness: "Struggle to control games against physical sides who sit deep and negate their transition game.",
    homeKit: { primary:"#003087", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#003087", pattern:"plain" },
  },
  'Korea Republic': {
    overview: "Son Heung-min remains one of the most lethal forwards at the tournament and leads a squad with far more quality than their seeding suggests. A dynamic and fast-moving team can cause real problems for the unwary, particularly with the flanks as primary weapons.",
    strength: "Son Heung-min's world-class finishing and the team's quick transitional play going forward.",
    weakness: "Inconsistency — capable of brilliance against top teams but occasionally flat against weaker opposition.",
    homeKit: { primary:"#C60C30", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#003DA5", pattern:"plain" },
  },
  Iran: {
    overview: "Team Melli have qualified for multiple consecutive World Cups and bring a defensive resilience that frustrates even elite opposition. A disciplined low block, effective counter-attacks and set-piece danger make them a credible threat to advance. Azmoun provides the attacking outlet in their setup.",
    strength: "An incredibly well-organised defensive unit that makes life extremely difficult for any opponent.",
    weakness: "Creative limitations in attack mean goals can be hard to come by when they need to win.",
    homeKit: { primary:"#FFFFFF", secondary:"#239F40", pattern:"plain" },
    awayKit:  { primary:"#CC0000", secondary:"#FFFFFF", pattern:"plain" },
  },
  'Saudi Arabia': {
    overview: "The Green Falcons produced the greatest upset of 2022, defeating Messi's Argentina in the group stage. They have built on that momentum with younger, more technically superior players and a more adventurous pressing style. Salem Al-Dawsari remains a danger with his pace and directness.",
    strength: "High defensive line, collective pressing and the ability to spring the ultimate surprise against unsuspecting giants.",
    weakness: "Inconsistent results suggest their 2022 performance may have been a high-water mark they struggle to replicate.",
    homeKit: { primary:"#FFFFFF", secondary:"#006C35", pattern:"plain" },
    awayKit:  { primary:"#006C35", secondary:"#FFFFFF", pattern:"plain" },
  },
  Qatar: {
    overview: "As former hosts, Qatar return looking to improve on their 2022 group-stage exit. Akram Afif is a genuine creative talent and the squad has developed significantly since hosting. Playing without home advantage removes a key crutch, but this is a maturing team with real ambition.",
    strength: "Possession-based technical football with creative midfield playmakers comfortable on the ball.",
    weakness: "Lack of physical presence in defence and limited big-game experience at World Cup level.",
    homeKit: { primary:"#8D1B3D", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#8D1B3D", pattern:"plain" },
  },
  Senegal: {
    overview: "The Lions of Teranga are perennial contenders representing the African continent with pride. A powerful, athletic squad led by the legendary Sadio Mané combines pace, power and technical quality. Idrissa Gueye remains one of the finest midfield destroyers in world football.",
    strength: "Raw athleticism, physicality and set-piece threat, with Mané's guile providing the creative link.",
    weakness: "When Mané is not at his best or absent, creativity and inspiration can dry up significantly.",
    homeKit: { primary:"#FFFFFF", secondary:"#00853F", pattern:"plain" },
    awayKit:  { primary:"#00853F", secondary:"#FFFFFF", pattern:"plain" },
  },
  Algeria: {
    overview: "Les Fennecs are a compact, well-structured team capable of causing problems for any opponent. Riyad Mahrez — the creative fulcrum — can unlock the best defences with his dribbling and passing range. Algeria are dangerous when they can frustrate possession-dominant opponents and counter at pace.",
    strength: "Defensive compactness and the creative spark of Mahrez in central attacking positions.",
    weakness: "Over-reliance on Mahrez means they can lack variation and become predictable when he is off-form.",
    homeKit: { primary:"#FFFFFF", secondary:"#006233", pattern:"plain" },
    awayKit:  { primary:"#006233", secondary:"#FFFFFF", pattern:"plain" },
  },
  Egypt: {
    overview: "Mohamed Salah returns to the World Cup stage as arguably the most dangerous forward on the planet. The Pharaohs' entire game plan revolves around his genius, supported by a compact defensive platform. If Salah is at his best, Egypt can cause a major upset in the group stage.",
    strength: "Mohamed Salah — a world-class attacking threat who can single-handedly change any match.",
    weakness: "A team built almost exclusively around one player is easy to game-plan against if Salah is subdued.",
    homeKit: { primary:"#EE1C25", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#EE1C25", pattern:"plain" },
  },
  Tunisia: {
    overview: "The Eagles of Carthage are disciplined and determined, making them difficult to break down. Their defensive organisation is one of the best in Africa while Khazri brings experience and quality in attack. Getting out of the group will require maximum points from their opening matches.",
    strength: "Defensive resilience, team organisation and the ability to frustrate possession-dominant teams.",
    weakness: "Limited attacking creativity beyond key individuals and lack of clinical finishing.",
    homeKit: { primary:"#E70013", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#E70013", pattern:"plain" },
  },
  Ghana: {
    overview: "The Black Stars are one of Africa's proudest footballing nations and have shown they can reach World Cup quarter-finals. A physically imposing squad with a blend of experience and diaspora talent from European leagues brings real quality. Jordan Ayew is a tireless and creative forward.",
    strength: "Physical presence, pace on the flanks and a competitive team ethic that makes them difficult to overrun.",
    weakness: "Inconsistency and defensive errors from set pieces have cost them dearly in past tournaments.",
    homeKit: { primary:"#FFFFFF", secondary:"#FCD116", pattern:"plain" },
    awayKit:  { primary:"#CC0000", secondary:"#FFFFFF", pattern:"plain" },
  },
  "Cote D'Voire": {
    overview: "The Elephants possess a mix of experienced European-based professionals and exciting young talent. With Premier League quality in several positions, they aim to reach the knockout rounds for the first time in recent memory. Franck Kessié provides steel and drive in central midfield.",
    strength: "A well-balanced squad with physicality, Premier League experience and a clear tactical structure.",
    weakness: "Have historically underperformed at World Cups despite strong squad quality on paper.",
    homeKit: { primary:"#FF6600", secondary:"#009A44", pattern:"plain" },
    awayKit:  { primary:"#009A44", secondary:"#FF6600", pattern:"plain" },
  },
  'DR Congo': {
    overview: "Les Léopards make their first World Cup appearance since 1974 as a genuine wildcard with real potential. The squad is littered with European-based professionals who bring experience and quality. Cédric Bakambu leads an attack combining goals and creative play — a dark-horse pick.",
    strength: "Athletic and technically gifted players, particularly in attack, with a strong collective work ethic.",
    weakness: "Inconsistency at the highest level and limited World Cup experience make results hard to predict.",
    homeKit: { primary:"#003F87", secondary:"#FFD100", pattern:"plain" },
    awayKit:  { primary:"#FFD100", secondary:"#003F87", pattern:"plain" },
  },
  'Cabo Verde': {
    overview: "Making a historic first World Cup appearance, Cabo Verde have been a revelation of African football. An industrious, well-drilled team that upset continental heavyweights in qualifying. Ryan Mendes leads a group of European-based diaspora players with genuine ambition.",
    strength: "Surprise factor, team spirit and an ability to defend deep and counter-attack with speed.",
    weakness: "Very limited experience at this level — will need to dramatically overperform to advance.",
    homeKit: { primary:"#003893", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#CF2027", pattern:"plain" },
  },
  Jordan: {
    overview: "Another debutant on the World Cup stage, Jordan's qualification was a historic achievement for Levantine football. A disciplined, defensive side who sit deep and make life difficult, they showed real resilience in qualifying. Yazan Al-Naimat provides the main attacking threat.",
    strength: "Team cohesion, disciplined defensive structure and the motivating power of a nation's first World Cup.",
    weakness: "Lack of elite quality in key positions means they need a near-perfect performance to cause an upset.",
    homeKit: { primary:"#FFFFFF", secondary:"#007A3D", pattern:"plain" },
    awayKit:  { primary:"#C8102E", secondary:"#FFFFFF", pattern:"plain" },
  },
  Iraq: {
    overview: "Iraq return to the World Cup for the first time since 1986 with a young and hungry squad. Made it through qualifying with high discipline and resilient defending. Mohanad Ali leads the line with real quality. North America 2026 is Iraq's chance to show their football has evolved.",
    strength: "Well-organised defensively and highly motivated to prove themselves on the biggest stage.",
    weakness: "Very limited World Cup experience and could physically struggle against top-tier sides.",
    homeKit: { primary:"#007A3D", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#CE1126", pattern:"plain" },
  },
  'New Zealand': {
    overview: "The All Whites return to the World Cup with a compact, hardworking team that punches above its weight. Chris Wood is one of the tournament's most underrated target men — strong, intelligent and ruthless in front of goal. New Zealand have shown they can frustrate much stronger opponents.",
    strength: "Physicality, long-ball threat through Chris Wood and a never-give-up mentality.",
    weakness: "Technical limitations and lack of depth make it very difficult to beat consecutive quality opponents.",
    homeKit: { primary:"#FFFFFF", secondary:"#000000", pattern:"plain" },
    awayKit:  { primary:"#000000", secondary:"#FFFFFF", pattern:"plain" },
  },
  Uzbekistan: {
    overview: "The White Wolves make their World Cup debut with a squad built on fast attacking football and technical precision. Eldor Shomurodov, their Serie A-tested striker, leads the line with strength and skill. They surprised many observers with their qualification campaign through Asia.",
    strength: "Energetic pressing, youthful vibrancy and technical quality that surpasses expectations.",
    weakness: "Tournament inexperience at this level and limited results against top opposition make prediction difficult.",
    homeKit: { primary:"#FFFFFF", secondary:"#1EB53A", pattern:"plain" },
    awayKit:  { primary:"#1EB53A", secondary:"#FFFFFF", pattern:"plain" },
  },
  'Bosnia and Herzegovina': {
    overview: "Back at the World Cup for only the second time, Bosnia carry genuine attacking quality. Edin Džeko — a striker who spent his career at elite clubs — still provides goals and experienced leadership. The team plays direct, aggressive football with a clear attacking identity.",
    strength: "Edin Džeko's experience, aerial ability and prolific goal-scoring pedigree up front.",
    weakness: "Defensive vulnerabilities and inconsistency behind Džeko can be exploited by organised opposition.",
    homeKit: { primary:"#002395", secondary:"#FFD700", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#002395", pattern:"plain" },
  },
  Croatia: {
    overview: "The Vatreni reached the final in 2018 and the bronze-medal match in 2022 — serial over-achievers at World Cups. Luka Modrić, possibly in his final tournament, remains technically brilliant and physically defiant of age. A team with a winning mentality that thrives in knockout football.",
    strength: "Luka Modrić's midfield genius and a collective DNA perfectly built for surviving knockout rounds.",
    weakness: "An ageing squad and reliance on Modrić means they can struggle against physically intense opponents.",
    homeKit: { primary:"#CC0000", secondary:"#FFFFFF", pattern:"stripes-v" },
    awayKit:  { primary:"#003DA5", secondary:"#FFFFFF", pattern:"plain" },
  },
  Austria: {
    overview: "An ascending footballing nation with real quality throughout the squad. David Alaba's class provides a platform even from a defensive role, while Marcel Sabitzer drives from midfield. Austria are one of the most dangerous dark horses in the European contingent.",
    strength: "High-energy pressing, tactical intelligence and a genuine work ethic under a progressive coach.",
    weakness: "Lack of a prolific world-class striker means they need to work hard to convert possession into goals.",
    homeKit: { primary:"#ED2939", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#ED2939", pattern:"plain" },
  },
  Czechia: {
    overview: "The Czechs bring a pragmatic, technical quality with a clear European pedigree. Patrik Schick — one of the most lethal strikers in the Bundesliga — is their match-winner when fit and firing. A disciplined midfield makes them hard to break down and effective in transition.",
    strength: "Schick's elite finishing quality and a technically capable, well-organised team shape.",
    weakness: "Limited creative depth behind Schick means if he is suppressed, their attacking threat diminishes sharply.",
    homeKit: { primary:"#D7141A", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#11457E", secondary:"#FFFFFF", pattern:"plain" },
  },
  Scotland: {
    overview: "The Tartan Army return to the World Cup with arguably their most talented group in a generation. Andy Robertson provides world-class output down the left, and a squad with Premier League quality in multiple positions is a genuine threat to advance. An emotional return for Scottish football.",
    strength: "Collective pressing intensity and high-quality, Premier League-experienced players in key roles.",
    weakness: "Historically fragile nerves on the biggest occasion and a tendency to self-destruct when it matters most.",
    homeKit: { primary:"#003087", secondary:"#BCA04A", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#003087", pattern:"plain" },
  },
  Türkiye: {
    overview: "The Turks have real momentum following strong European Championship campaigns, playing expansive, attacking football. Hakan Çalhanoğlu — one of Serie A's finest midfielders — pulls the strings with precision and power. Türkiye have more quality than their FIFA ranking suggests.",
    strength: "Dynamic midfield quality with Çalhanoğlu orchestrating and real attacking creativity on the flanks.",
    weakness: "Defensive vulnerabilities and emotional volatility can derail even the most promising Türkiye campaigns.",
    homeKit: { primary:"#E30A17", secondary:"#FFFFFF", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#E30A17", pattern:"plain" },
  },
  Paraguay: {
    overview: "La Albirroja bring a familiar Paraguayan tenacity — hard to beat, direct and effective from set pieces. Miguel Almirón brings Premier League quality and direct running that gives opponents constant headaches. Getting out of a competitive group will require all their experience and resolve.",
    strength: "Set-piece threat, defensive grit and a team that fights for every ball until the final whistle.",
    weakness: "Limited attacking creativity from open play and over-reliance on Almirón for moments of inspiration.",
    homeKit: { primary:"#D52B1E", secondary:"#FFFFFF", pattern:"stripes-v" },
    awayKit:  { primary:"#003087", secondary:"#FFFFFF", pattern:"plain" },
  },
  Ecuador: {
    overview: "La Tri have been consistent qualifiers and solid performers at recent World Cups. Enner Valencia remains a consistent threat and a team built on defensive solidity and direct play gives Ecuador a reasonable chance of advancing. A South American side with proven tournament nous.",
    strength: "Defensive organisation, physical conditioning and proven World Cup experience in key players.",
    weakness: "Creative limitations in midfield and a forward line that depends heavily on experienced heads.",
    homeKit: { primary:"#FFD100", secondary:"#003087", pattern:"plain" },
    awayKit:  { primary:"#003087", secondary:"#FFD100", pattern:"plain" },
  },
  'South Africa': {
    overview: "Bafana Bafana return to the World Cup with real pride and motivation. Percy Tau leads the attack with quality earned in European football, and a team built on work rate and tactical discipline aims to recreate the spirit of their 2010 host-nation campaign.",
    strength: "A motivated unit with continental support and genuine attacking quality from Percy Tau.",
    weakness: "Defensive fragility and the need to consistently punch above their weight will be the challenge.",
    homeKit: { primary:"#FCD116", secondary:"#007A4D", pattern:"plain" },
    awayKit:  { primary:"#007A4D", secondary:"#FCD116", pattern:"plain" },
  },
  Curacao: {
    overview: "The smallest nation at the tournament, Curacao's debut is a triumph of football development in the Dutch Caribbean. A technically capable squad full of Dutch league veterans will look to cause a surprise. Leandro Bacuna provides leadership and quality in midfield.",
    strength: "Compact tactical organisation and strong European league experience throughout the squad.",
    weakness: "Simply outgunned in terms of quality by the heavyweight nations they will face in the group stage.",
    homeKit: { primary:"#003DA5", secondary:"#FFD700", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#003DA5", pattern:"plain" },
  },
  Haiti: {
    overview: "Making only their second World Cup appearance since 1974, Les Grenadiers carry the dreams of a nation. A young, athletic squad plays with a directness and energy that can unsettle unprepared opponents. Duckens Nazon and a group of diaspora-born professionals provide genuine spark.",
    strength: "Explosive pace, directness and a fearless approach that can unsettle more fancied opponents.",
    weakness: "Lack of elite technical quality and defensive fragility make it difficult to compete over 90 minutes.",
    homeKit: { primary:"#00209F", secondary:"#D21034", pattern:"plain" },
    awayKit:  { primary:"#D21034", secondary:"#00209F", pattern:"plain" },
  },
  Panama: {
    overview: "Los Canaleros built on their 2018 debut experience and are back on the world stage. A physical, hard-working team with a clear defensive structure and ability to frustrate opponents with direct play. Rolando Blackburn provides a physical outlet up front in their system.",
    strength: "Collective defensive discipline and the home-region advantage of playing in CONCACAF's heartland.",
    weakness: "Limited technical quality and a history of struggling to score goals against organised defences.",
    homeKit: { primary:"#DA121A", secondary:"#002D62", pattern:"plain" },
    awayKit:  { primary:"#FFFFFF", secondary:"#DA121A", pattern:"plain" },
  },
};

export function getTeamProfile(name) {
  return TEAM_PROFILES[name] || null;
}

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
