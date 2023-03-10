const User = require("../models/User");
const Note = require("../models/Note")

const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");


// @desc Get all Notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async(req, res) =>{
    const notes = await Note.find().lean();
    if(!notes?.length){
        return res.status(400).json({message:"No notes found"});
    }

    // Add username to each note before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const notesWithUser = await Promise.all(notes.map( async (note) => {
        const user = await User.findById(note.user).lean().exec();
        if(!user){
            return {message: "No user is connected with this note"}
        }
        return {...note, username: user.username};
    }))
    res.json(notesWithUser);
})


// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async(req, res) =>{
    const {title, text, user} = req.body;

    // Confirm data
    if(!title || !text || !user){
        return res.status(400).json({message:"All fields are required"})
    }
    
    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({locale: 'en', strength: 2}).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'note title already exists' })
    }

    const noteObject = {title, text, user};

    // Create and store new note
    const note = await Note.create(noteObject)

    if(note){ // if created
        res.status(201).json({message: `New note '${note.title}' created`})
    }else{
        res.status(400).json({message: "Invalid note data received"});
    }
})


// @desc Update note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async(req, res) =>{
    const {id, user, title, text, completed} = req.body;
    if(!id || !user || !title || !text || typeof completed !== "boolean"){
        return res.status(400).json({message: "some properties are missing"});
    }

    // Confirm note exists to update
    const note = await Note.findById(id).exec();
    if(!note){
        return res.status(400).json({message: "Note not found"});
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({title}).collation({locale: 'en', strength: 2}).lean().exec();

    // Allow updates to the original note
    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({message: "Note already exists"});
    }

    note.uses = user;
    note.title = title;
    note.text = text;
    note.completed = completed;

    const updatedNote = await note.save();
    
    res.json({message: `'${updatedNote.title}' updated`});
    
})

// @desc Delete note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async(req, res) =>{
    const {id} = req.body;

    if(!id){
        return res.status(400).json({message: "Note Id required"});
    }

    // Confirm note exists to delete 
    const note = await Note.findById(id).exec();

    if(!note){
        return res.status(400).json({message: "Note not found"})
    }

    const result = await note.deleteOne();
    const reply = `Note '${result.title}' with ID ${result._id} deleted`;
    res.json({reply});
})


module.exports = {getAllNotes, createNewNote, updateNote, deleteNote};