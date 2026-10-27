export { CARDS } from "./cards.js";

export const nextTeam = (teamIndex, teamCount) => (teamIndex + 1) % teamCount;

export function createGame(teamNames, duration = 60) {
  return {
    teams: teamNames.map((name) => ({ name, score: 0 })),
    activeTeam: 0,
    timeLeft: duration,
    round: 1,
  };
}

export function applyTurn(state, action) {
  const delta = action === "correct" ? 1 : action === "violation" ? -1 : 0;
  const teams = state.teams.map((team, index) => ({
    ...team,
    score:
      index === state.activeTeam ? Math.max(0, team.score + delta) : team.score,
  }));
  return { ...state, teams };
}
