const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// GET PLAYERS API

app.get("/players/", async (request, response) => {
  const dbQuery = `
    SELECT
    *
    FROM
    player_details;`;
  const playerArray = await db.all(dbQuery);
  let dataBase = [];
  for (let object of playerArray) {
    const dbObject = {
      playerId: object.player_id,
      playerName: object.player_name,
    };
    dataBase.push(dbObject);
  }
  response.send(dataBase);
});

// GET PLAYER API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    SELECT 
    player_id as playerId,
    player_name as playerName
    FROM
    player_details
    WHERE
    player_id=${playerId};`;
  const dbArray = await db.get(playerQuery);
  //   const dbObject = {
  //     playerId: dbArray.player_id,
  //     playerName: dbArray.player_name,
  //   };
  response.send(dbArray);
});

//PUT PLAYER API

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;

  const { playerName } = playerDetails;

  const dbQuery = `
    UPDATE player_details
    SET
    player_name='${playerName}'
    WHERE
    player_id=${playerId};
    `;

  const dbArray = await db.run(dbQuery);

  response.send("Player Details Updated");
});

//GET MATCHDETAILS API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const dbQuery = `
    SELECT
    match_id as matchId,
    match,
    year
    FROM 
    match_details
    WHERE
    match_id=${matchId};`;
  const dbArray = await db.get(dbQuery);
  response.send(dbArray);
});

//GET LIST_OF_ALL_MATCHES API

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `
    SELECT
    match_details.match_id as matchId,
    match,
    year
    FROM
    match_details INNER JOIN player_match_score ON 
   match_details.match_id=player_match_score.match_id
   WHERE
   player_match_score.player_id=${playerId};`;

  const dbArray = await db.all(dbQuery);
  response.send(dbArray);
});

//GET LIST_OF_PLAYERS API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const dbQuery = `
    SELECT
    player_details.player_id as playerId,
    player_details.player_name as playerName
    FROM
    player_details INNER JOIN player_match_score ON
    player_details.player_id=player_match_score.player_id
    WHERE
    player_match_score.match_id=${matchId};`;
  const dbArray = await db.all(dbQuery);
  response.send(dbArray);
});
//GET STATISTICS API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `
    SELECT
    player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM
    player_details INNER JOIN player_match_score
    ON player_details.player_id=player_match_score.player_id;
    WHERE
    playerId=${playerId}
    GROUP BY
    playerName;`;
  const dbArray = await db.get(dbQuery);
  response.send(dbArray);
});
module.exports = app;
