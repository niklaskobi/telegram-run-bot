const chalk = require('chalk')
const fs = require('fs')

const add = (nickName, distance, duration) => {
    const notes = loadNotes()
    const duplicateNote = notes.find((note) => note.nickName === nickName)

    if (!duplicateNote) {
        createNewNote(nickName, distance, duration)
    } else {
        addRun(nickName, distance, duration)
    }
}

const createNewNote = (nickName, distance, duration) => {
    const notes = loadNotes();
    const runJson = createRun(distance, duration)
    notes.push({
        nickName: nickName,
        stats: {
            allDistance: distance,
            allDuration: duration,
            allPace: getPace(distance, duration)
        },
        runs: [runJson]
    })
    saveNotes(notes)
    console.log(chalk.green.inverse('New note added!'))
}

const getPace = (distance, duration) => duration / distance

const createRun = (distance, duration) => {
    const pace = getPace(distance, duration)
    var date = new Date();
    return {
        date: date,
        distance: distance,
        duration: duration,
        pace: pace
    }
}

const addRun = (nickNameGiven, distance, duration) => {
    const notes = loadNotes()
    var newRun = createRun(distance, duration)
    for (let i=0; i<notes.length; i++) {
        if (notes[i].nickName == nickNameGiven) {
            notes[i].stats.allDistance = notes[i].stats.allDistance + distance
            notes[i].stats.allDuration = notes[i].stats.allDuration + duration
            notes[i]['runs'].push(newRun);
            break;
        }
    }
    console.log(chalk.green.inverse('Stats added!'))
    saveNotes(notes)
}

const removeNote = (nickName) => {
    const notes = loadNotes()
    const notesToKeep = notes.filter((note) => note.nickName !== nickName)

    if (notes.length > notesToKeep.length) {
        console.log(chalk.green.inverse('Note removed!'))
        saveNotes(notesToKeep)
    } else {
        console.log(chalk.red.inverse('No note found!'))
    }    
}

const listNotes = () => {
    const notes = loadNotes()

    console.log(chalk.inverse('Your notes'))

    notes.forEach((note) => {
        console.log(note.nickName)
    })
}

  

const readNote = (nickName) => {
    const notes = loadNotes()
    const note = notes.find((note) => note.nickName === nickName)

    if (note) {
        console.log(chalk.inverse(note.nickName))
        console.log(note.distance)
    } else {
        console.log(chalk.red.inverse('Note not found!'))
    }
}

const saveNotes = (notes) => {
    const dataJSON = JSON.stringify(notes)
    fs.writeFileSync('notes.json', dataJSON)
}

const loadNotes = () => {
    try {
        const dataBuffer = fs.readFileSync('notes.json')
        const dataJSON = dataBuffer.toString()
        return JSON.parse(dataJSON)
    } catch (e) {
        return []
    }
}

module.exports = {
    add: add,
    removeNote: removeNote,
    listNotes: listNotes,
    readNote: readNote,
    loadNotes: loadNotes
}