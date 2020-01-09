UPDATE model.entity
SET 
   name = REPLACE (
     name,
   'Grab',
   'Grave'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

 UPDATE model.entity
SET 
   name = REPLACE (
     name,
   'Bestattung',
   'Burial'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

 UPDATE model.entity
SET 
   name = REPLACE (
     name,
   'Streufund',
   'Strayfind'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

   UPDATE model.entity
SET 
   name = REPLACE (
     name,
   'Inv. Nr.',
   'Inv. No.'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

 UPDATE model.entity
SET 
   name = REPLACE (
     name,
   'Invnr.',
   'Inv. No.'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

   UPDATE model.entity
SET 
   name = REPLACE (
     name,
   'Grabfund',
   'Grave'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

   UPDATE model.entity
SET 
   name = REPLACE (
     name,
   'Ohne',
   'No'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

 UPDATE model.entity
   SET 
   name = REPLACE (
     name,
   'Inv Nr.',
   'Inv. No.'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

   
 UPDATE model.entity
SET 
   name = REPLACE (
     name,
   'invnr',
   'Inv. No.'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

   UPDATE model.entity
SET 
   name = REPLACE (
     name,
   'ohne Inv',
   'No Inv'
   ) WHERE id IN (SELECT child_id FROM thanados.entities);git