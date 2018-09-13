'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');


router.post('/tags', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  knex.select('id', 'name')
    .from('tags')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get('/:id', (req, res, next)=>{
  const id = req.params.id;
  knex.select('id', 'name')
    .from('tags')
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
  knex('tags')
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

  knex('tags')
    .insert({name: req.body.name})
    .then(response=>{
      res.json(response);
    })
    .catch( err => console.log( err ));
});

router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  knex('tags')
    .where({id: id})
    .delete()
    .then(response=>{
      res.sendStatus(204);
    })
});


module.exports = router;
