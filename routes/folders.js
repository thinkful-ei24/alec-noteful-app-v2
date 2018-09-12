'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');

router.get('/', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get('/:id', (req, res, next)=>{
  const id = req.params.id;
  knex.select('id', 'name')
    .from('folders')
    .where({id: id})
    .then(results => res.json(results))
    .catch( err => console.log( err ) );
});

router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['name'];

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
  knex('folders')
  .update(updateObj)
  .where({id: id})
  .returning(['name'])
  .then(item => {
  if(item[0]) res.json(item[0]);
  else next();
 });
});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const name = req.body.name;

  const newItem = { name };
  /***** Never trust users - validate input *****/
  if (!newItem.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .insert({name: req.body.name})
    .then(response=>{
      res.json(response);
    })
    .catch( err => console.log( err ) );
});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  knex('folders')
    .where({id: id})
    .delete()
    .then(response=>{
      res.sendStatus(204);
    })
});



module.exports = router;
