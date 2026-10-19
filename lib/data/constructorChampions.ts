// Final constructors' standings for finished seasons (the title started in
// 1958), generated from the Jolpica F1 API like lib/data/champions.ts. Past
// titles never change, so they ship with the app. Seasons that finish after
// the last line come from the API (getConstructorChampionList), so adding a
// line is optional: it just stops that season from being fetched.
export type ConstructorChampion = {
  season: string;
  rounds: number;
  teamId: string;
  team: string;
  points: number;
  wins: number;
  // Second in the final standings
  runnerUp: string;
  runnerUpPoints: number;
};

// prettier-ignore
export const CONSTRUCTOR_CHAMPIONS: ConstructorChampion[] = [
  { season: "1958", rounds: 11, teamId: "vanwall", team: "Vanwall", points: 48, wins: 6, runnerUp: "Ferrari", runnerUpPoints: 40 },
  { season: "1959", rounds: 9, teamId: "cooper-climax", team: "Cooper-Climax", points: 40, wins: 5, runnerUp: "Ferrari", runnerUpPoints: 32 },
  { season: "1960", rounds: 10, teamId: "cooper-climax", team: "Cooper-Climax", points: 48, wins: 6, runnerUp: "Team Lotus", runnerUpPoints: 34 },
  { season: "1961", rounds: 8, teamId: "ferrari", team: "Ferrari", points: 45, wins: 5, runnerUp: "Lotus-Climax", runnerUpPoints: 35 },
  { season: "1962", rounds: 9, teamId: "brm", team: "BRM", points: 42, wins: 4, runnerUp: "Lotus-Climax", runnerUpPoints: 36 },
  { season: "1963", rounds: 10, teamId: "lotus-climax", team: "Lotus-Climax", points: 54, wins: 7, runnerUp: "BRM", runnerUpPoints: 36 },
  { season: "1964", rounds: 10, teamId: "ferrari", team: "Ferrari", points: 45, wins: 3, runnerUp: "BRM", runnerUpPoints: 42 },
  { season: "1965", rounds: 10, teamId: "lotus-climax", team: "Lotus-Climax", points: 54, wins: 6, runnerUp: "BRM", runnerUpPoints: 45 },
  { season: "1966", rounds: 9, teamId: "brabham-repco", team: "Brabham-Repco", points: 42, wins: 4, runnerUp: "Ferrari", runnerUpPoints: 31 },
  { season: "1967", rounds: 11, teamId: "brabham-repco", team: "Brabham-Repco", points: 67, wins: 4, runnerUp: "Lotus-Ford", runnerUpPoints: 44 },
  { season: "1968", rounds: 12, teamId: "lotus-ford", team: "Lotus-Ford", points: 62, wins: 5, runnerUp: "McLaren-Ford", runnerUpPoints: 49 },
  { season: "1969", rounds: 11, teamId: "matra-ford", team: "Matra-Ford", points: 66, wins: 6, runnerUp: "Brabham-Ford", runnerUpPoints: 51 },
  { season: "1970", rounds: 13, teamId: "team_lotus", team: "Team Lotus", points: 59, wins: 6, runnerUp: "Ferrari", runnerUpPoints: 55 },
  { season: "1971", rounds: 11, teamId: "tyrrell", team: "Tyrrell", points: 73, wins: 7, runnerUp: "BRM", runnerUpPoints: 36 },
  { season: "1972", rounds: 12, teamId: "team_lotus", team: "Team Lotus", points: 61, wins: 5, runnerUp: "Tyrrell", runnerUpPoints: 51 },
  { season: "1973", rounds: 15, teamId: "team_lotus", team: "Team Lotus", points: 91, wins: 7, runnerUp: "Tyrrell", runnerUpPoints: 80 },
  { season: "1974", rounds: 15, teamId: "mclaren", team: "McLaren", points: 72, wins: 4, runnerUp: "Ferrari", runnerUpPoints: 65 },
  { season: "1975", rounds: 14, teamId: "ferrari", team: "Ferrari", points: 72.5, wins: 6, runnerUp: "Brabham", runnerUpPoints: 54 },
  { season: "1976", rounds: 16, teamId: "ferrari", team: "Ferrari", points: 83, wins: 6, runnerUp: "McLaren", runnerUpPoints: 74 },
  { season: "1977", rounds: 17, teamId: "ferrari", team: "Ferrari", points: 84, wins: 4, runnerUp: "Team Lotus", runnerUpPoints: 62 },
  { season: "1978", rounds: 16, teamId: "team_lotus", team: "Team Lotus", points: 86, wins: 8, runnerUp: "Ferrari", runnerUpPoints: 58 },
  { season: "1979", rounds: 15, teamId: "ferrari", team: "Ferrari", points: 113, wins: 6, runnerUp: "Williams", runnerUpPoints: 75 },
  { season: "1980", rounds: 14, teamId: "williams", team: "Williams", points: 120, wins: 6, runnerUp: "Ligier", runnerUpPoints: 66 },
  { season: "1981", rounds: 15, teamId: "williams", team: "Williams", points: 95, wins: 4, runnerUp: "Brabham", runnerUpPoints: 61 },
  { season: "1982", rounds: 16, teamId: "ferrari", team: "Ferrari", points: 74, wins: 3, runnerUp: "McLaren", runnerUpPoints: 69 },
  { season: "1983", rounds: 15, teamId: "ferrari", team: "Ferrari", points: 89, wins: 4, runnerUp: "Renault", runnerUpPoints: 79 },
  { season: "1984", rounds: 16, teamId: "mclaren", team: "McLaren", points: 143.5, wins: 12, runnerUp: "Ferrari", runnerUpPoints: 57.5 },
  { season: "1985", rounds: 16, teamId: "mclaren", team: "McLaren", points: 90, wins: 6, runnerUp: "Ferrari", runnerUpPoints: 82 },
  { season: "1986", rounds: 16, teamId: "williams", team: "Williams", points: 141, wins: 9, runnerUp: "McLaren", runnerUpPoints: 96 },
  { season: "1987", rounds: 16, teamId: "williams", team: "Williams", points: 137, wins: 9, runnerUp: "McLaren", runnerUpPoints: 76 },
  { season: "1988", rounds: 16, teamId: "mclaren", team: "McLaren", points: 199, wins: 15, runnerUp: "Ferrari", runnerUpPoints: 65 },
  { season: "1989", rounds: 16, teamId: "mclaren", team: "McLaren", points: 141, wins: 10, runnerUp: "Williams", runnerUpPoints: 77 },
  { season: "1990", rounds: 16, teamId: "mclaren", team: "McLaren", points: 121, wins: 6, runnerUp: "Ferrari", runnerUpPoints: 110 },
  { season: "1991", rounds: 16, teamId: "mclaren", team: "McLaren", points: 139, wins: 8, runnerUp: "Williams", runnerUpPoints: 125 },
  { season: "1992", rounds: 16, teamId: "williams", team: "Williams", points: 164, wins: 10, runnerUp: "McLaren", runnerUpPoints: 99 },
  { season: "1993", rounds: 16, teamId: "williams", team: "Williams", points: 168, wins: 10, runnerUp: "McLaren", runnerUpPoints: 84 },
  { season: "1994", rounds: 16, teamId: "williams", team: "Williams", points: 118, wins: 7, runnerUp: "Benetton", runnerUpPoints: 103 },
  { season: "1995", rounds: 17, teamId: "benetton", team: "Benetton", points: 147, wins: 11, runnerUp: "Williams", runnerUpPoints: 118 },
  { season: "1996", rounds: 16, teamId: "williams", team: "Williams", points: 175, wins: 12, runnerUp: "Ferrari", runnerUpPoints: 70 },
  { season: "1997", rounds: 17, teamId: "williams", team: "Williams", points: 123, wins: 8, runnerUp: "Ferrari", runnerUpPoints: 102 },
  { season: "1998", rounds: 16, teamId: "mclaren", team: "McLaren", points: 156, wins: 9, runnerUp: "Ferrari", runnerUpPoints: 133 },
  { season: "1999", rounds: 16, teamId: "ferrari", team: "Ferrari", points: 128, wins: 6, runnerUp: "McLaren", runnerUpPoints: 124 },
  { season: "2000", rounds: 17, teamId: "ferrari", team: "Ferrari", points: 170, wins: 10, runnerUp: "McLaren", runnerUpPoints: 162 },
  { season: "2001", rounds: 17, teamId: "ferrari", team: "Ferrari", points: 179, wins: 9, runnerUp: "McLaren", runnerUpPoints: 102 },
  { season: "2002", rounds: 17, teamId: "ferrari", team: "Ferrari", points: 221, wins: 15, runnerUp: "Williams", runnerUpPoints: 92 },
  { season: "2003", rounds: 16, teamId: "ferrari", team: "Ferrari", points: 158, wins: 8, runnerUp: "Williams", runnerUpPoints: 144 },
  { season: "2004", rounds: 18, teamId: "ferrari", team: "Ferrari", points: 262, wins: 15, runnerUp: "BAR", runnerUpPoints: 119 },
  { season: "2005", rounds: 19, teamId: "renault", team: "Renault", points: 191, wins: 8, runnerUp: "McLaren", runnerUpPoints: 182 },
  { season: "2006", rounds: 18, teamId: "renault", team: "Renault", points: 206, wins: 8, runnerUp: "Ferrari", runnerUpPoints: 201 },
  { season: "2007", rounds: 17, teamId: "ferrari", team: "Ferrari", points: 204, wins: 9, runnerUp: "BMW Sauber", runnerUpPoints: 101 },
  { season: "2008", rounds: 18, teamId: "ferrari", team: "Ferrari", points: 172, wins: 8, runnerUp: "McLaren", runnerUpPoints: 151 },
  { season: "2009", rounds: 17, teamId: "brawn", team: "Brawn", points: 172, wins: 8, runnerUp: "Red Bull", runnerUpPoints: 153.5 },
  { season: "2010", rounds: 19, teamId: "red_bull", team: "Red Bull", points: 498, wins: 9, runnerUp: "McLaren", runnerUpPoints: 454 },
  { season: "2011", rounds: 19, teamId: "red_bull", team: "Red Bull", points: 650, wins: 12, runnerUp: "McLaren", runnerUpPoints: 497 },
  { season: "2012", rounds: 20, teamId: "red_bull", team: "Red Bull", points: 460, wins: 7, runnerUp: "Ferrari", runnerUpPoints: 400 },
  { season: "2013", rounds: 19, teamId: "red_bull", team: "Red Bull", points: 596, wins: 13, runnerUp: "Mercedes", runnerUpPoints: 360 },
  { season: "2014", rounds: 19, teamId: "mercedes", team: "Mercedes", points: 701, wins: 16, runnerUp: "Red Bull", runnerUpPoints: 405 },
  { season: "2015", rounds: 19, teamId: "mercedes", team: "Mercedes", points: 703, wins: 16, runnerUp: "Ferrari", runnerUpPoints: 428 },
  { season: "2016", rounds: 21, teamId: "mercedes", team: "Mercedes", points: 765, wins: 19, runnerUp: "Red Bull", runnerUpPoints: 468 },
  { season: "2017", rounds: 20, teamId: "mercedes", team: "Mercedes", points: 668, wins: 12, runnerUp: "Ferrari", runnerUpPoints: 522 },
  { season: "2018", rounds: 21, teamId: "mercedes", team: "Mercedes", points: 655, wins: 11, runnerUp: "Ferrari", runnerUpPoints: 571 },
  { season: "2019", rounds: 21, teamId: "mercedes", team: "Mercedes", points: 739, wins: 15, runnerUp: "Ferrari", runnerUpPoints: 504 },
  { season: "2020", rounds: 17, teamId: "mercedes", team: "Mercedes", points: 573, wins: 13, runnerUp: "Red Bull", runnerUpPoints: 319 },
  { season: "2021", rounds: 22, teamId: "mercedes", team: "Mercedes", points: 613.5, wins: 9, runnerUp: "Red Bull", runnerUpPoints: 585.5 },
  { season: "2022", rounds: 22, teamId: "red_bull", team: "Red Bull", points: 759, wins: 17, runnerUp: "Ferrari", runnerUpPoints: 554 },
  { season: "2023", rounds: 22, teamId: "red_bull", team: "Red Bull", points: 860, wins: 21, runnerUp: "Mercedes", runnerUpPoints: 409 },
  { season: "2024", rounds: 24, teamId: "mclaren", team: "McLaren", points: 666, wins: 6, runnerUp: "Ferrari", runnerUpPoints: 652 },
  { season: "2025", rounds: 24, teamId: "mclaren", team: "McLaren", points: 833, wins: 14, runnerUp: "Mercedes", runnerUpPoints: 469 },
];
