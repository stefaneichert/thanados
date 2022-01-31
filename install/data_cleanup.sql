

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
ORDER BY system_type, id;

-- check for files without references and add reference of entity if available

DROP TABLE IF EXISTS thanados.refFilesTmp;

CREATE table thanados.refFilesTmp AS (
SELECT
	f.child_name,
	f.child_id,
	fi.id AS range_id,
	fi.filename
FROM thanados.finds f JOIN thanados.files fi ON f.child_id = fi.parent_id WHERE source ISNULL);

INSERT INTO thanados.refFilesTmp
	SELECT
	f.child_name,
	f.child_id,
	fi.id AS range_id,
	fi.filename
FROM thanados.burials f JOIN thanados.files fi ON f.child_id = fi.parent_id WHERE source ISNULL;

INSERT INTO thanados.refFilesTmp
	SELECT
	f.child_name,
	f.child_id,
	fi.id AS range_id,
	fi.filename
FROM thanados.graves f JOIN thanados.files fi ON f.child_id = fi.parent_id WHERE source ISNULL;

INSERT INTO thanados.refFilesTmp
	SELECT
	f.child_name,
	f.child_id,
	fi.id AS range_id,
	fi.filename
FROM thanados.sites f JOIN thanados.files fi ON f.child_id = fi.parent_id WHERE source ISNULL;



INSERT INTO model.link (range_id, domain_id, property_code, description)

SELECT 	f.range_id,
	r.id AS domain_id,
	'P67' AS property_code,
	r.reference AS description

FROM thanados.reffilestmp f JOIN thanados.reference r ON r.parent_id = f.child_id;


-- check for files without license
SELECT * FROM model.entity WHERE id in
(SELECT entity.id
FROM thanados.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entities.child_id != 0
  AND entity.openatlas_class_name ~~ 'file'::text
ORDER BY entities.child_id)


