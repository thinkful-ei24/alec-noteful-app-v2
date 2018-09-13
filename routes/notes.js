'use strict';

const express = require('express');
const hydrateNotes = require('../utils/hydrationNotes');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);
const knex = require('../knex');


const returnById = function(id){
  return knex
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tag_id as tagId', 'tags.name as tagName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .where({'notes.id': id});
};
// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;
  const {folderId} = req.query;
  const {tagId} = req.query;

  knex.select(
  'notes.id',
  'title', 'content',
  'folders.id as folderId',
  'folders.name as folderName',
  'tags.id as tagId',
  'tags.name as tagName'
)
  .from('notes')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
  .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
  .modify(function (queryBuilder) {
    if(searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .modify(function (queryBuilder) {
    if (folderId) {
      queryBuilder.where('folder_id', folderId);
    }
  })
  .modify(function (queryBuilder) {
     if (tagId) {
       queryBuilder.where('tag_id', tagId);
     }
   })
  .orderBy('notes.id')
  .then(results => {
    const hydrated = hydrateNotes(results);
    console.log('these are the notes after they are hydrated ');
    console.log(hydrated);
    res.json(hydrated);
  })
  .catch(err => next(err));
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  knex.select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName')
  .from('notes')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .where('notes.id', id)
  .then(results => {
    res.json(results[0]);
  })
  .catch(err => next(err));
});

// // Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
  .update(updateObj)
  .where({id: id})
  .returning(['id', 'title', 'content'])
  .then(item => {
  if(item[0]) res.json(item[0]);
  else next();
 });
});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body; // Add `folderId` to object destructure
  if(!folderId){
    folderId = null;
  }
  /*
  REMOVED FOR BREVITY
  */
  const newItem = {
    title: title,
    content: content,
    folder_id: folderId  // Add `folderId`
  };

  let noteId;

  // Insert new note, instead of returning all the fields, just return the new `id`
  knex.insert(newItem).into('notes').returning('id')
    .then(([id]) => {
      noteId = id;

      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
      // Using the new id, select the new note and the folder

    })
    .then(()=>{
      return knex.select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId)
    })
    .then(([result]) => {
      console.log('below is the result');
      console.log(result);
      // const hydrated = hydrateNotes(result)[0];
      res.status(201).json(result);
    })
    .catch(err => next(err));
});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  knex('notes')
    .where({id: id})
    .delete()
    .then(response=>{
      res.sendStatus(204);
    })
});
module.exports = router;
