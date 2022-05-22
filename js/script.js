"use-strict";

/*
Accessing the return value of an async function 
(async () => {
  console.log(await getMinerFaction(554433));
})();
*/

// button elements
const formEl = document.querySelector(".form");
const startScanBtn = document.querySelector(".btn--start");
const stopScanBtn = document.querySelector(".btn--stop");
const resetBtn = document.querySelector(".btn--reset");
const mineIDEl = document.querySelector("#mine_id");
const mineCountEl = document.querySelector("#mine_count");
const reinforcementTimeEl = document.querySelector("#last_reinforcement_time");
const faction1El = document
  .querySelector(".faction__one")
  .querySelector(".select-selected");
const faction2El = document
  .querySelector(".faction__two")
  .querySelector(".select-selected");
const scanningMineEl = document.querySelector(".scanning-mine");
const scanningMineStatusEl = document.querySelector(".scanning-mine__status");
const scanningMineOutput = document.querySelector(".scanning-mine__output");
const walletIDResultEl = document.querySelector(".wallet-address");
const crabFactionResultEl = document.querySelector(".crab-faction");
const mineIDResultResultEl = document.querySelector(".mine-id");
const reinforcementTimeResultEL = document.querySelector(".reinforcement-time");
const inputCheckerEl = document.querySelector(".input-checker");

// base variables
const defaultResult = 0;
const apiDelay = 200; //ms
let currentResult = defaultResult;
let mineID = 0;
let mineScanRange = 0;
let reinforcementTime = 0;
let count = 0;
let faction1 = "";
let faction2 = "";
let scan = false;
const baseURL = "https://idle-game-api.crabada.com/public/idle";

//sleep method
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// handles scanning message status
async function scanningStatus(msg) {
  scanningMineEl.classList.remove("hidden");
  scanningMineStatusEl.classList.remove("hidden");
  scanningMineStatusEl.textContent = msg;
}

async function popup(popStatus) {
  popStatus === "show"
    ? inputCheckerEl.classList.add("show")
    : inputCheckerEl.classList.remove("show");
}

async function pageResetHandler() {
  scan = false;
  popup("hide");
  formEl.reset();
  faction1El.textContent = "Select faction 1";
  faction2El.textContent = "Select faction 2";
  document.getElementById("clear-box").innerHTML = "";
  console.log("page refreshed.");
}

async function startScanHandler() {
  scan = true;
  mineID = parseInt(mineIDEl.value);
  mineScanRange = parseInt(mineCountEl.value);
  reinforcementTime = parseInt(reinforcementTimeEl.value);
  faction1 = faction1El.textContent.toUpperCase();
  faction2 = faction2El.textContent.toUpperCase();
  console.log(mineID, mineScanRange, reinforcementTime, faction1, faction2);
  if (!(isNaN(mineID) && isNaN(mineScanRange) && isNaN(reinforcementTime))) {
    popup("hide");
    scanningStatus("Scanning Mines...");
    mainProgram(mineID);
  } else {
    popup("show");
  }
}

async function stopBtnHandler() {
  scan = false;
  const message = `Scanned: ${count}`;
  scanningStatus(message);
}

async function outputMineResult(minerAdd, mineFac, mineId, lastRT) {
  var link = document.createElement("a");
  var div = document.createElement("div");
  var walletSpan = document.createElement("span");
  var factionSpan = document.createElement("span");
  var mineIDSpan = document.createElement("span");
  var reinforcementSpan = document.createElement("span");

  link.href = `https://crabadatracker.app/profile/${minerAdd}/summary`;
  link.target = "_blank";
  link.className = "tracker-link";

  div.className = "scanning-mine__output";
  walletSpan.className = "wallet-address";
  factionSpan.className = "cra-faction";
  mineIDSpan.className = "mine-id";
  reinforcementSpan.className = "reinforcement-time";

  scanningMineEl.appendChild(link);
  link.appendChild(div);
  walletSpan.innerHTML = `ID: ${minerAdd}`;
  factionSpan.innerHTML = `Faction: ${mineFac}`;
  mineIDSpan.innerHTML = `MineID: ${mineId}`;
  reinforcementSpan.innerHTML = `LastReinfTime: ${lastRT}`;

  div.appendChild(walletSpan);
  div.appendChild(factionSpan);
  div.appendChild(mineIDSpan);
  div.appendChild(reinforcementSpan);
}

//call API - returns json : Promise
async function apiCall(urlApi) {
  await sleep(apiDelay);
  try {
    const response = await fetch(urlApi, {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Other",
    });
    const myJson = await response.json(); //extract JSON from the http response
    return myJson;
    //console.log(myJson);
  } catch (err) {
    console.error("Failed to GET: " + err);
    if (
      typeof err.response !== "undefined" &&
      typeof err.response.data !== "undefined" &&
      err.response.data !== null
    ) {
      throw new Error(err.response.data);
    } else {
      throw err;
    }
    //console.log(`The following error occured: ${err.message}`);
  }
}

// fetch a mine that has not been attacked
async function getMinerAddress(mineID) {
  try {
    const url = baseURL + `/mine/${mineID}`;
    const stuff = await apiCall(url);
    const minerAddress =
      stuff.result.attack_team_id > 0 ? "" : stuff.result.owner;
    return minerAddress;
  } catch (err) {
    console.log(`The following error occured: ${err.message}`);
  }
}

//Get miner's faction
async function getMinerFaction(mineID) {
  try {
    const url = baseURL + `/mine/${mineID}`;
    const stuff = await apiCall(url);
    return stuff.result.defense_team_faction;
  } catch (err) {
    console.log(`The following error occured: ${err.message}`);
  }
}

//can crab join team check
async function canCrabJoinTeam(minerAddress) {
  try {
    let crabsInGame = false;
    //check to see that address returned is valid
    if (minerAddress === "") {
      return (crabsInGame = true);
    }

    const url =
      baseURL + `/crabadas/can-join-team?user_address=${minerAddress}`;
    const stuff = await apiCall(url);
    if (stuff.result.totalRecord > 0) {
      return (crabsInGame = true);
    }
    return crabsInGame;
  } catch (err) {
    console.log(`The following error occured: ${err.message}`);
  }
}

//check to see if miner has crabs in games that can be used for reinforcing
async function areCrabsInGame(minerAddress) {
  try {
    let crabsInGame = false;
    //check to see that address returned is valid
    if (minerAddress === "") {
      return (crabsInGame = true);
    }
    let url =
      baseURL +
      `/crabadas/in-game?user_address=${minerAddress}&page=1&limit=100&order=desc&orderBy=mine_point`;
    const stuff = await apiCall(url);

    //get total pages
    const totalPages = stuff.result.totalPages;
    //current page
    const currentPage = stuff.result.page;
    const totalRecord = stuff.result.totalRecord;
    const remainder = totalRecord % 3;

    //check if crab isnt a multiple of 3,
    if (remainder !== 0) {
      return (crabsInGame = true);
    }

    //handle single in-game page
    if (totalPages === currentPage) {
      //we need to limit to the index that can be processed
      for (let i = 0; i < totalRecord; i++) {
        const teamID = stuff.result.data[i].team_id;
        if (teamID == null) {
          return (crabsInGame = true);
        }
      }
    }

    //hnadles in-game multiple pages when totalPages > page
    if (totalPages > 1) {
      //loop through each page by calling the api - start from page 1
      for (let i = 1; i <= totalPages; i++) {
        //call the api starting from page 1
        let url =
          baseURL +
          `/crabadas/in-game?user_address=${minerAddress}&page=${i}&limit=100&order=desc&orderBy=mine_point`;
        const stuff = await apiCall(url);
        const dataArray = stuff.result.data;

        //loop through the data for each page
        for (let k = 0; k < dataArray.length; k++) {
          const teamID = stuff.result.data[k].team_id;

          if (teamID === "") {
            return (crabsInGame = true);
          }
        }
      }
    }
    return crabsInGame;
  } catch (err) {
    console.log(`The following error occured: ${err.message}`);
  }
}

async function getLastReinforcementTime(minerAddress) {
  try {
    //if address is invalid, no point doing stuffs
    if (minerAddress === "") {
      return 0;
    }
    const url =
      baseURL +
      `/crabadas/lending/history?borrower_address=${minerAddress}&orderBy=transaction_time&order=desc&limit=2`;
    const stuff = await apiCall(url);
    //check to see if wallet has ever been to tarvern
    const totalRecord = stuff.result.totalRecord;
    if (totalRecord <= 0) {
      return 0;
    }
    const lastReinforcementTimeInSec = stuff.result.data[0].transaction_time;
    let today = new Date();
    //get cuurent time and conver to seconds
    today = Math.floor(today.getTime() / 1000);
    //get how long ago miner reinforced (in seconds)
    const lastReinforcementSince = today - lastReinforcementTimeInSec;
    const lastReinforcementTimeInHrs = Math.floor(
      lastReinforcementSince / 3600
    );
    return lastReinforcementTimeInHrs;
  } catch (err) {
    console.log(`The following error occured: ${err.message}`);
  }
}

// main program
async function mainProgram(mineID) {
  try {
    const stopMineID = mineID + mineScanRange;
    for (
      let currentMineID = mineID;
      currentMineID <= stopMineID;
      currentMineID++
    ) {
      if (!scan) {
        break;
      }
      console.log(`Currently scanning mine: ${currentMineID}`);
      const teamFaction = await getMinerFaction(currentMineID);
      if (
        faction1 === teamFaction ||
        faction2 === teamFaction ||
        (faction1 === "SELECT FACTION 1" &&
        faction2 === "SELECT FACTION 2")
      ) {
        const minerAddress = await getMinerAddress(currentMineID);
        //check to see if last reinforcement time is greater to user specified time.
        const lastReinforcementTimeInHrs = await getLastReinforcementTime(
          minerAddress
        );
        if (lastReinforcementTimeInHrs < reinforcementTime) {
          continue;
        }
        const canCrabJoinTeamStatus = await canCrabJoinTeam(minerAddress);
        const areCrabsInGameStatus = await areCrabsInGame(minerAddress);
        //console.log(filteredResult);
        if (
          minerAddress === "" ||
          canCrabJoinTeamStatus ||
          areCrabsInGameStatus
        ) {
          //console.log("attacked");
          continue;
        } else {
          console.log(
            `CrabFaction: ${teamFaction} \t MineID: ${currentMineID} \t OwnerAdress: ${minerAddress} \t LastReinforceTime:  ${lastReinforcementTimeInHrs} Hrs`
          );

          count++;
          const message = `Scanned: ${count}`;
          scanningStatus(message);
          outputMineResult(
            minerAddress,
            teamFaction,
            currentMineID,
            lastReinforcementTimeInHrs
          );
        }
      }
    }
    console.log("Completed!!!");
  } catch (err) {
    console.log(`The following error occured: ${err.message}`);
  }
}

// handling start scan btn
startScanBtn.addEventListener("click", startScanHandler);
// handling stop scan btn
stopScanBtn.addEventListener("click", stopBtnHandler);
// handling reset scan btn
resetBtn.addEventListener("click", pageResetHandler);
