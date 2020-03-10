-- various data cleanup queries

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
   ) WHERE id IN (SELECT child_id FROM thanados.entities);

--check for entities without main type

SELECT  f.*
FROM model.entity f  WHERE f.system_type = 'find' AND id NOT IN
(SELECT DISTINCT
	l.domain_id
	FROM model.link l JOIN thanados.typesforjson t ON l.range_id = t.id::INT WHERE t.name_path LIKE 'Find%' AND l.property_code = 'P2')
UNION ALL
SELECT  f.*
FROM model.entity f  WHERE f.system_type = 'stratigraphic unit' AND id NOT IN
(SELECT DISTINCT
	l.domain_id
	FROM model.link l JOIN thanados.typesforjson t ON l.range_id = t.id::INT WHERE t.name_path LIKE 'Stratigra%' AND l.property_code = 'P2')
UNION ALL
SELECT  f.*
FROM model.entity f  WHERE f.system_type = 'feature' AND id NOT IN
(SELECT DISTINCT
	l.domain_id
	FROM model.link l JOIN thanados.typesforjson t ON l.range_id = t.id::INT WHERE t.name_path LIKE 'Feature%' AND l.property_code = 'P2')
ORDER BY system_type, id