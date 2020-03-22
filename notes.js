const chalk = require("chalk");
const fs = require("fs");

const add = (nickName, distance, duration) => {
  if (!nickName) return { error: "no nickname!" };
  const notes = loadNotes();
  const duplicateNote = notes.find(note => note.nickName === nickName);
  if (!duplicateNote) {
    createNewNote(nickName, distance, duration);
  } else {
    addRun(nickName, distance, duration);
  }
};

const getNrOfRuns = nickName => {
  const notes = loadNotes();
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].nickName == nickName) {
      return notes[i].runs.length;
    }
  }
};

const getAllUsers = () => {
  const notes = loadNotes();
  let users = [];
  for (let i = 0; i < notes.length; i++) {
    users.push(notes[i].nickName);
  }
  return users;
};

const createNewNote = (nickName, distance, duration) => {
  const notes = loadNotes();
  const runJson = createRun(distance, duration);
  notes.push({
    nickName: nickName,
    stats: {
      allDistance: distance,
      allDuration: duration,
      allPace: getPace(distance, duration)
    },
    runs: [runJson]
  });
  saveNotes(notes);
  console.log(chalk.green.inverse("New note added!"));
};

const getJson1User = userName => {
  const notes = loadNotes();
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].nickName == userName) {
      return notes[i];
    }
  }
};

const getAllStats = userName => {
  const stats = getJson1User(userName);
  if (!stats) return { err: `no stats for user ${userName}` };
  let sumDist = 0;
  let sumDur = 0;
  for (let i = 0; i < stats.runs.length; i++) {
    sumDist += stats.runs[i].distance;
    sumDur += stats.runs[i].duration;
  }
  return {
    distance: sumDist,
    duration: sumDur,
    pace: getPace(sumDist, sumDur),
    runs: stats.runs.length
  };
};

const getLastXStats = (runsCnt, userName) => {
  const lastNRuns = getLastNRuns(runsCnt, userName);
  if (!lastNRuns) return { error: "no data" };
  let sumDist = 0;
  let sumDur = 0;
  for (let i = 0; i < lastNRuns.length; i++) {
    sumDist += lastNRuns[i].distance;
    sumDur += lastNRuns[i].duration;
  }
  return {
    distance: sumDist,
    duration: sumDur,
    pace: getPace(sumDist, sumDur)
  };
};

const sortArrayByDate = array => {
  let sortedArray = array.sort((in1, in2) => {
    let a = new Date(in1.date);
    let b = new Date(in2.date);
    if (a > b) return -1;
    else if (a < b) return 1;
    else 0;
  });
  return sortedArray;
};

const getLastNRuns = (runsCnt, userName) => {
  let lastXStats;
  const stats = getJson1User(userName);
  if (!stats) return;
  const statsSorted = sortArrayByDate(stats.runs);
  if (runsCnt == 0) {
    return statsSorted;
  } else {
    //return statsSorted.slice(Math.max(statsSorted.length - runsCnt, 0));
    return statsSorted.slice(0, runsCnt);
  }
};

const deleteAllStats = userName => {
  const notes = loadNotes();
  if (!notes) return false;
  else {
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].nickName == userName) {
        notes.splice(i, 1);
        saveNotes(notes);
        return true;
      }
    }
  }
  console.log("not deleted");
  return false;
};

const deleteNthRun = (username, index) => {
  const notes = loadNotes();
  if (!notes) return { error: "no data" };
  else {
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].nickName == username) {
        let date = notes[i].runs[index - 1].date;
        // last run?
        if (notes[i].runs.length == 1) {
          notes.splice(i, 1);
        } else {
          const runsSorted = sortArrayByDate(notes[i].runs);
          //update stats:
          notes[i].stats.allDistance -= runsSorted[index - 1].distance;
          notes[i].stats.allDuration -= runsSorted[index - 1].duration;
          // remove run
          runsSorted.splice(index - 1, 1);
          notes[i].runs = runsSorted;
        }
        saveNotes(notes);
        return { success: `run ${date} deleted` };
      }
    }
  }
};

const getPace = (distance, duration) => duration / distance;

const createRun = (distance, duration) => {
  const pace = getPace(distance, duration);
  var date = new Date();
  return {
    date: date,
    distance: distance,
    duration: duration,
    pace: pace
  };
};

const addRun = (nickNameGiven, distance, duration) => {
  const notes = loadNotes();
  var newRun = createRun(distance, duration);
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].nickName == nickNameGiven) {
      notes[i].stats.allDistance = notes[i].stats.allDistance + distance;
      notes[i].stats.allDuration = notes[i].stats.allDuration + duration;
      notes[i]["runs"].push(newRun);
      break;
    }
  }
  console.log(chalk.green.inverse("Stats added!"));
  saveNotes(notes);
};

const removeNote = nickName => {
  const notes = loadNotes();
  const notesToKeep = notes.filter(note => note.nickName !== nickName);

  if (notes.length > notesToKeep.length) {
    console.log(chalk.green.inverse("Note removed!"));
    saveNotes(notesToKeep);
  } else {
    console.log(chalk.red.inverse("No note found!"));
  }
};

const saveNotes = notes => {
  const dataJSON = JSON.stringify(notes);
  fs.writeFileSync("notes.json", dataJSON);
};

const loadNotes = () => {
  try {
    const dataBuffer = fs.readFileSync("notes.json");
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (e) {
    return [];
  }
};

module.exports = {
  add,
  removeNote,
  loadNotes,
  getLastXStats,
  getPace,
  deleteAllStats,
  getNrOfRuns,
  getAllUsers,
  getAllStats,
  getLastNRuns,
  deleteNthRun
};
