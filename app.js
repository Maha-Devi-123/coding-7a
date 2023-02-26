const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

//db and server installation
const databasePath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;
const connectServerAndDB = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running Successfully");
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};
connectServerAndDB();

//change case
const changeCase = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};
//changing case for match
const changeCaseForMatch = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};
//API 1
app.get("/players/", async (request, response) => {
  const queryForAllPlayers = `SELECT * 
    FROM player_details 
    ORDER BY player_id ;`;
  const playersArray = await database.all(queryForAllPlayers);
  response.send(playersArray.map(changeCase));
});
//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const queryForSpecificPlayer = `
    SELECT * FROM player_details 
    WHERE player_id =${playerId};`;
  const playerObject = await database.get(queryForSpecificPlayer);
  response.send(changeCase(playerObject));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `UPDATE player_details 
    SET player_name = "${playerName}" 
    WHERE player_id = ${playerId};`;
  await database.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const queryForSpecificMatch = `
    SELECT * FROM match_details 
    WHERE match_id =${matchId};`;
  const MatchObject = await database.get(queryForSpecificMatch);
  response.send(changeCaseForMatch(MatchObject));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const queryForAllMatchesByAPlayer = `
    SELECT match_id FROM player_match_score
    WHERE player_id =${playerId};`;
  const MatchIdArray = await database.all(queryForAllMatchesByAPlayer);
  const newArray = [];
  for (let obj of MatchIdArray) {
    let matchId = obj.match_id;
    const queryForMatchDetails = `
      SELECT * FROM match_details 
      WHERE match_id = ${matchId} ;`;
    const matchDetails = await database.get(queryForMatchDetails);
    newArray.push(matchDetails);
  }
  response.send(newArray.map(changeCaseForMatch));
});

//API6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const queryForPlayerId = `
    SELECT player_id FROM player_match_score
    WHERE match_id =${matchId};`;
  const playerIdArray = await database.all(queryForPlayerId);
  const newArray = [];
  for (let obj of playerIdArray) {
    let playerId = obj.player_id;
    const queryForPlayerDetails = `
      SELECT * FROM player_details 
      WHERE player_id = ${playerId} ;`;
    const playerDetails = await database.get(queryForPlayerDetails);
    newArray.push(playerDetails);
  }
  response.send(newArray.map(changeCase));
});

//API7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const queryForScoreDetails = `
    SELECT score,fours,sixes FROM player_match_score
    WHERE player_id =${playerId};`;
  const ScoresArray = await database.all(queryForScoreDetails);
  const newArray = {
    playerId: playerId,
    playerName: null,
    totalScore: 0,
    totalFours: 0,
    totalSixes: 0,
  };
  for (let obj of ScoresArray) {
    newArray.totalScore = obj.score + newArray.totalScore;
    newArray.totalFours = obj.fours + newArray.totalFours;
    newArray.totalSixes = obj.sixes + newArray.totalSixes;
  }

  const getPlayerName = `SELECT player_name 
FROM player_details WHERE player_id=${playerId}`;
  const playerName = await database.get(getPlayerName);
  newArray.playerName = playerName.player_name;
  response.send(newArray);
  console.log(ScoresArray);
});

module.exports = app;
