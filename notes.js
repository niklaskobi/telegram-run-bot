const chalk = require('chalk')
const fs = require('fs')

const addNote = (nickName, distance) => {
    const notes = loadNotes()
    const duplicateNote = notes.find((note) => note.nickName === nickName)

    if (!duplicateNote) {
        notes.push({
            nickName: nickName,
            distance: distance
        })
        saveNotes(notes)
        console.log(chalk.green.inverse('New note added!'))
    } else {
        console.log(chalk.red.inverse('Note nickName taken!'))
    }
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
    addNote: addNote,
    removeNote: removeNote,
    listNotes: listNotes,
    readNote: readNote
}