--prepare one geojson file of all entities
DROP SCHEMA IF EXISTS jsonprepare CASCADE;


CREATE SCHEMA jsonprepare;
--create temp tables


-- all types tree
DROP TABLE IF EXISTS jsonprepare.types_all;
CREATE TABLE jsonprepare.types_all AS
 WITH RECURSIVE path(id, path, parent, name, description, parent_id, name_path) AS (
         SELECT types_all.child_id,
            ''::text || types_all.child_id::text AS path,
            NULL::text AS text,
            types_all.child_name,
            types_all.description,
            types_all.parent_id,
            ''::text || types_all.child_name AS name_path
           FROM ( SELECT x.child_id,
                    x.child_name,
                    x.description,
                    x.parent_id,
                    e.name AS parent_name
                   FROM ( SELECT entity.id AS child_id,
                            entity.name AS child_name,
                            entity.description AS description,
                            link.range_id AS parent_id,
                            link.property_code
                           FROM model.entity
                             LEFT JOIN model.link ON entity.id = link.domain_id
                          WHERE entity.class_code ~~ 'E55'::text) x
                     LEFT JOIN model.entity e ON x.parent_id = e.id
                  ORDER BY e.name) types_all
          WHERE types_all.parent_name IS NULL
        UNION ALL
         SELECT types_all.child_id,
            (parentpath.path ||
                CASE parentpath.path
                    WHEN ' > '::text THEN ''::text
                    ELSE ' > '::text
                END) || types_all.child_id::text,
            parentpath.path,
            types_all.child_name,
            types_all.description,
            types_all.parent_id,
            (parentpath.name_path ||
                CASE parentpath.name_path
                    WHEN ' > '::text THEN ''::text
                    ELSE ' > '::text
                END) || types_all.child_name
           FROM ( SELECT x.child_id,
                    x.child_name,
                    x.description,
                    x.parent_id,
                    e.name AS parent_name
                   FROM ( SELECT entity.id AS child_id,
                            entity.name AS child_name,
                            entity.description AS description,
                            link.range_id AS parent_id,
                            link.property_code
                           FROM model.entity
                             LEFT JOIN model.link ON entity.id = link.domain_id
                          WHERE entity.class_code ~~ 'E55'::text) x
                     LEFT JOIN model.entity e ON x.parent_id = e.id
                  ORDER BY e.name) types_all,
            path parentpath
          WHERE types_all.parent_id::text = parentpath.id::text
        )
 SELECT path.name,
    path.description,
    path.id,
    path.path,
    path.parent_id,
    path.name_path
   FROM path
  ORDER BY path.path;




-- create table with sites to be used
DROP TABLE IF EXISTS jsonprepare.sites;
CREATE TABLE jsonprepare.sites AS (
SELECT
       NULL::integer AS parent_id,
       s.name AS child_name,
       s.id AS child_id,
       s.description,
       s.begin_from,
       s.begin_to,
       s.begin_comment,
       s.end_from,
       s.end_to,
       s.end_comment,
       s.system_type,
       NULL::TEXT as geom
FROM
(SELECT
    e.id,
    e.name,
    e.description,
    date_part('year', e.begin_from)::integer AS begin_from,
    date_part('year', e.begin_to)::integer AS begin_to,
    e.begin_comment,
    date_part('year', e.end_from)::integer AS end_from,
    date_part('year', e.end_to)::integer AS end_to,
    e.end_comment,
    e.system_type,
    l.range_id
    FROM model.entity e JOIN model.link l ON e.id = l.domain_id WHERE l.property_code = 'P2' AND e.system_type = 'place' AND e.id in (50505, 50497, 111285)) AS s
    JOIN jsonprepare.types_all t ON t.id = s.range_id WHERE t.name_path LIKE 'Place > Burial Site%'
);

UPDATE jsonprepare.sites
SET geom = poly.geom FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
   e.id
   FROM model.entity e JOIN model.link l ON e.id = l.domain_id JOIN gis.polygon pl ON l.range_id = pl.entity_id WHERE l.property_code = 'P53') AS poly WHERE child_id = poly.id;

UPDATE jsonprepare.sites
SET geom = point.geom FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
   e.id
   FROM model.entity e JOIN model.link l ON e.id = l.domain_id JOIN gis.point pnt ON l.range_id = pnt.entity_id WHERE l.property_code = 'P53') AS point WHERE child_id = point.id AND jsonprepare.sites.geom ISNULL;


-- graves
DROP TABLE IF EXISTS jsonprepare.graves;
CREATE TABLE jsonprepare.graves AS
SELECT parent.id AS parent_id,
    child.name AS child_name,
    child.id AS child_id,
    child.description,
    date_part('year', child.begin_from)::integer AS begin_from,
    date_part('year', child.begin_to)::integer AS begin_to,
    child.begin_comment,
    date_part('year', child.end_from)::integer AS end_from,
    date_part('year', child.end_to)::integer AS end_to,
    child.end_comment,
    child.system_type,
    NULL::TEXT as geom
   FROM model.entity parent JOIN model.link l_p_c ON parent.id = l_p_c.domain_id JOIN model.entity child ON l_p_c.range_id = child.id
        WHERE parent.id in (SELECT child_id FROM jsonprepare.sites) AND l_p_c.property_code = 'P46' ORDER BY child.system_type, parent.id, child.name;


UPDATE jsonprepare.graves
SET geom = poly.geom FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
   e.id
   FROM model.entity e JOIN model.link l ON e.id = l.domain_id JOIN gis.polygon pl ON l.range_id = pl.entity_id WHERE l.property_code = 'P53') AS poly WHERE child_id = poly.id;

UPDATE jsonprepare.graves
SET geom = point.geom FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
   e.id
   FROM model.entity e JOIN model.link l ON e.id = l.domain_id JOIN gis.point pnt ON l.range_id = pnt.entity_id WHERE l.property_code = 'P53') AS point WHERE child_id = point.id AND jsonprepare.graves.geom ISNULL;


--burials
DROP TABLE IF EXISTS jsonprepare.burials;
CREATE TABLE jsonprepare.burials AS
SELECT parent.id AS parent_id,
    child.name AS child_name,
    child.id AS child_id,
    child.description,
    date_part('year', child.begin_from)::integer AS begin_from,
    date_part('year', child.begin_to)::integer AS begin_to,
    child.begin_comment,
    date_part('year', child.end_from)::integer AS end_from,
    date_part('year', child.end_to)::integer AS end_to,
    child.end_comment,
    child.system_type,
    NULL::TEXT as geom
   FROM model.entity parent JOIN model.link l_p_c ON parent.id = l_p_c.domain_id JOIN model.entity child ON l_p_c.range_id = child.id
        WHERE parent.id in (SELECT child_id FROM jsonprepare.graves) AND l_p_c.property_code = 'P46' ORDER BY child.system_type, parent.id, child.name;


UPDATE jsonprepare.burials
SET geom = poly.geom FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
   e.id
   FROM model.entity e JOIN model.link l ON e.id = l.domain_id JOIN gis.polygon pl ON l.range_id = pl.entity_id WHERE l.property_code = 'P53') AS poly WHERE child_id = poly.id;

UPDATE jsonprepare.burials
SET geom = point.geom FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
   e.id
   FROM model.entity e JOIN model.link l ON e.id = l.domain_id JOIN gis.point pnt ON l.range_id = pnt.entity_id WHERE l.property_code = 'P53') AS point WHERE child_id = point.id AND jsonprepare.burials.geom ISNULL;

--finds
DROP TABLE IF EXISTS jsonprepare.finds;
CREATE TABLE jsonprepare.finds AS
SELECT parent.id AS parent_id,
    child.name AS child_name,
    child.id AS child_id,
    child.description,
    date_part('year', child.begin_from)::integer AS begin_from,
    date_part('year', child.begin_to)::integer AS begin_to,
    child.begin_comment,
    date_part('year', child.end_from)::integer AS end_from,
    date_part('year', child.end_to)::integer AS end_to,
    child.end_comment,
    child.system_type,
    NULL::TEXT as geom
   FROM model.entity parent JOIN model.link l_p_c ON parent.id = l_p_c.domain_id JOIN model.entity child ON l_p_c.range_id = child.id
        WHERE parent.id in (SELECT child_id FROM jsonprepare.burials) AND l_p_c.property_code = 'P46' ORDER BY child.system_type, parent.id, child.name;


UPDATE jsonprepare.finds
SET geom = poly.geom FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
   e.id
   FROM model.entity e JOIN model.link l ON e.id = l.domain_id JOIN gis.polygon pl ON l.range_id = pl.entity_id WHERE l.property_code = 'P53') AS poly WHERE child_id = poly.id;

UPDATE jsonprepare.finds
SET geom = point.geom FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
   e.id
   FROM model.entity e JOIN model.link l ON e.id = l.domain_id JOIN gis.point pnt ON l.range_id = pnt.entity_id WHERE l.property_code = 'P53') AS point WHERE child_id = point.id AND jsonprepare.finds.geom ISNULL;

-- all entities union
CREATE TABLE jsonprepare.entitiestmp AS
SELECT * FROM jsonprepare.sites
UNION ALL
SELECT * FROM jsonprepare.graves
UNION ALL
SELECT * FROM jsonprepare.burials
UNION ALL
SELECT * FROM jsonprepare.finds
ORDER BY parent_id, child_name;

UPDATE jsonprepare.entitiestmp SET begin_comment = NULL WHERE begin_comment = '';
UPDATE jsonprepare.entitiestmp SET end_comment = NULL WHERE end_comment = '';
UPDATE jsonprepare.entitiestmp SET description = NULL WHERE description = '';


--types
DROP VIEW IF EXISTS jsonprepare.types_main;
DROP TABLE IF EXISTS jsonprepare.types_main;
CREATE TABLE jsonprepare.types_main AS
    SELECT DISTINCT
    types_all.id,
    types_all.parent_id,
    entitiestmp.child_id AS entity_id,
    types_all.name,
    types_all.description,
    link.description AS value,
    types_all.name_path AS path
   FROM jsonprepare.types_all,
    jsonprepare.entitiestmp,
    model.link
  WHERE entitiestmp.child_id = link.domain_id AND link.range_id = types_all.id
  ORDER BY entity_id, types_all.name_path;

  UPDATE jsonprepare.types_main SET description = NULL WHERE description = '';

--types main
DROP VIEW IF EXISTS jsonprepare.maintype;
DROP TABLE IF EXISTS jsonprepare.maintype;
CREATE TABLE jsonprepare.maintype AS
    SELECT * FROM jsonprepare.types_main WHERE
    path LIKE 'Place >%' OR path LIKE 'Feature >%' OR path LIKE 'Stratigraphic Unit >%' OR path LIKE 'Find >%'
  ORDER BY entity_id, path;

--types dimensions
DROP VIEW IF EXISTS jsonprepare.dimensiontypes;
DROP TABLE IF EXISTS jsonprepare.dimensiontypes;
CREATE TABLE jsonprepare.dimensiontypes AS
    SELECT * FROM jsonprepare.types_main WHERE
    path LIKE 'Dimensions >%'
  ORDER BY entity_id, path;

--types material
DROP VIEW IF EXISTS jsonprepare.materialtypes;
DROP TABLE IF EXISTS jsonprepare.materialtypes;
CREATE TABLE jsonprepare.materialtypes AS
    SELECT * FROM jsonprepare.types_main WHERE
    path LIKE 'Material >%'
  ORDER BY entity_id, path;


--other types
DROP VIEW IF EXISTS jsonprepare.types;
DROP TABLE IF EXISTS jsonprepare.types;
CREATE TABLE jsonprepare.types AS
    SELECT * FROM jsonprepare.types_main WHERE
    path NOT LIKE 'Dimensions >%' AND path NOT LIKE 'Place >%' AND path NOT LIKE 'Feature >%' AND path NOT LIKE 'Stratigraphic Unit >%' AND path NOT LIKE 'Find >%' AND path NOT LIKE 'Material >%'
  ORDER BY entity_id, path;

--entities with maintypes
CREATE TABLE jsonprepare.entities AS
SELECT
  e.*,
  t.id AS type_id,
  t.parent_id AS parenttype_id,
  t.name AS typename,
  t.path
  FROM jsonprepare.entitiestmp e JOIN jsonprepare.maintype t ON e.child_id = t.entity_id;

--files
DROP TABLE IF EXISTS jsonprepare.files;
CREATE TABLE jsonprepare.files AS
 SELECT entities.child_id AS parent_id,
    entity.name,
    entity.id
   FROM jsonprepare.entities,
    model.link,
    model.entity
  WHERE entities.child_id = link.range_id AND link.domain_id = entity.id AND entity.system_type ~~ 'file'::text
  ORDER BY entities.child_id;

DROP TABLE IF EXISTS jsonprepare.filestmp;
CREATE TABLE jsonprepare.filestmp AS
(SELECT files.*,
       fe.description AS Source,
       fl.description AS Reference
FROM (
SELECT f.*,
       lic.name AS license
FROM
(SELECT license.*
       FROM
   (SELECT l.range_id,
           l.domain_id,
           e.name
           FROM model.link l JOIN model.entity e ON l.range_id = e.id WHERE l.property_code = 'P2') AS license LEFT JOIN jsonprepare.types_all t ON t.id = license.range_id WHERE t.name_path LIKE 'License%') AS lic RIGHT JOIN jsonprepare.files f ON f.id = lic.domain_id) as files LEFT JOIN model.link fl ON files.id = fl.range_id LEFT JOIN model.entity fe ON fl.domain_id = fe.id);


DROP TABLE jsonprepare.files;
CREATE TABLE jsonprepare.files AS
(SELECT * FROM jsonprepare.filestmp);


--references
DROP TABLE IF EXISTS jsonprepare.reference;
CREATE TABLE jsonprepare.reference AS
 SELECT entities.child_id AS parent_id,
    entity.name as abbreviation,
    entity.description AS title,
    link.description AS reference,
    entity.id
   FROM jsonprepare.entities,
    model.link,
    model.entity
  WHERE entities.child_id = link.range_id AND link.domain_id = entity.id AND entity.system_type ~~ 'bibliography'::text
  ORDER BY entities.child_id;


UPDATE jsonprepare.reference SET abbreviation = NULL WHERE abbreviation = '';
UPDATE jsonprepare.reference SET title = NULL WHERE title = '';
UPDATE jsonprepare.reference SET reference = NULL WHERE reference = '';

--external references/urls
DROP TABLE IF EXISTS jsonprepare.extrefs;
CREATE TABLE jsonprepare.extrefs AS
 SELECT entities.child_id AS parent_id,
    entity.name as url,
    link.description AS name,
    entity.description AS description,
    entity.id
   FROM jsonprepare.entities,
    model.link,
    model.entity
  WHERE entities.child_id = link.range_id AND link.domain_id = entity.id AND entity.system_type ~~ 'external reference'::text
  ORDER BY entities.child_id;


UPDATE jsonprepare.extrefs SET description = NULL WHERE description = '';
UPDATE jsonprepare.extrefs SET name = NULL WHERE name = '';

-- create table with types and files of all entities
DROP TABLE IF EXISTS jsonprepare.types_and_files;
CREATE TABLE jsonprepare.types_and_files (entity_id integer, types jsonb, files jsonb, dimensions jsonb, material jsonb, timespan jsonb, reference jsonb, extrefs jsonb);

-- insert type data
INSERT INTO jsonprepare.types_and_files (entity_id, types)
    SELECT e.child_id, types
    FROM jsonprepare.entities e INNER JOIN
          (select t.entity_id, jsonb_agg(jsonb_build_object(
                                          'id', t.id,
                                          'name',t.name,
                                          'description', t.description,
                                          'value', t.value,
                                          'path', t.path)) AS types FROM jsonprepare.types t GROUP BY entity_id) AS irgendwas
ON e.child_id = irgendwas.entity_id;


-- insert file data
UPDATE jsonprepare.types_and_files SET files = (SELECT files FROM (
SELECT e.child_id, files
    FROM jsonprepare.entities e INNER JOIN
          (select t.parent_id, jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                                          'id', t.id,
                                          'name',t.name,
                                          'license',t.license,
                                          'source',t.source,
                                          'reference',t.reference
                                          ))) AS files FROM jsonprepare.files t GROUP BY parent_id) AS irgendwas
ON e.child_id = irgendwas.parent_id) f where entity_id = f.child_id);


-- insert bibliography data
UPDATE jsonprepare.types_and_files SET reference = (SELECT reference FROM (
SELECT e.child_id, reference
    FROM jsonprepare.entities e INNER JOIN
          (select t.parent_id, jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                                          'id', t.id,
                                          'abbreviation',t.abbreviation,
                                          'title',t.title,
                                          'reference',t.reference
                                          ))) AS reference FROM jsonprepare.reference t GROUP BY parent_id) AS irgendwas
ON e.child_id = irgendwas.parent_id) f where entity_id = f.child_id);

--insert external refs data
UPDATE jsonprepare.types_and_files SET extrefs = (SELECT extref FROM (
SELECT e.child_id, extref
    FROM jsonprepare.entities e INNER JOIN
          (select t.parent_id, jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                                          'id', t.id,
                                          'url',t.url,
                                          'name',t.name,
                                          'description',t.description
                                          ))) AS extref FROM jsonprepare.extrefs t GROUP BY parent_id) AS irgendwas
ON e.child_id = irgendwas.parent_id) f where entity_id = f.child_id);

-- insert dimension data
UPDATE jsonprepare.types_and_files SET dimensions = (SELECT types FROM (
SELECT e.child_id, types
    FROM jsonprepare.entities e INNER JOIN
           (select t.entity_id, jsonb_agg(jsonb_build_object(
                                          'id', t.id,
                                          'name',t.name,
                                          'value', t.value,
                                          'path', t.path)) AS types FROM jsonprepare.dimensiontypes t GROUP BY entity_id) AS irgendwas
ON e.child_id = irgendwas.entity_id) f where entity_id = f.child_id);

-- insert material data
UPDATE jsonprepare.types_and_files SET material = (SELECT types FROM (
SELECT e.child_id, types
    FROM jsonprepare.entities e INNER JOIN
           (select t.entity_id, jsonb_agg(jsonb_build_object(
                                          'id', t.id,
                                          'name',t.name,
                                          'value', t.value,
                                          'path', t.path)) AS types FROM jsonprepare.materialtypes t GROUP BY entity_id) AS irgendwas
ON e.child_id = irgendwas.entity_id) f where entity_id = f.child_id);



-- insert timespan data
UPDATE jsonprepare.types_and_files SET timespan = (SELECT time FROM (
SELECT child_id,
       jsonb_strip_nulls(jsonb_build_object(
                      'begin_from', f.begin_from,
                      'begin_to', f.begin_to,
                      'begin_comment', f.begin_comment,
                      'end_from', f.end_from,
                      'end_to', f.end_to,
                      'end_comment', f.end_comment)) AS time
       FROM jsonprepare.entities f) AS irgendwas
WHERE entity_id = irgendwas.child_id);



--temp table with all info
DROP TABLE IF EXISTS jsonprepare.tmp;
CREATE TABLE jsonprepare.tmp AS
(SELECT * FROM jsonprepare.entities e RIGHT OUTER JOIN jsonprepare.types_and_files t ON e.child_id = t.entity_id);

UPDATE jsonprepare.tmp SET timespan = NULL WHERE timespan = '{}';
UPDATE jsonprepare.tmp SET description = NULL WHERE description = '';
UPDATE jsonprepare.tmp SET begin_comment = NULL WHERE begin_comment = '';
UPDATE jsonprepare.tmp SET end_comment = NULL WHERE end_comment = '';


---finds json
DROP TABLE IF EXISTS jsonprepare.tbl_finds;
CREATE TABLE jsonprepare.tbl_finds (id integer, parent_id integer, properties jsonb, files jsonb);

INSERT INTO jsonprepare.tbl_finds (id, parent_id, files, properties)
SELECT f.child_id, f.parent_id, f.files, jsonb_strip_nulls(jsonb_build_object(
                'name', f.child_name,
                'maintype', jsonb_build_object(
                      'name', f.typename,
                      'path', f.path,
                      'id', f.type_id,
                      'parent_id', f.parenttype_id,
                      'systemtype', f.system_type
                ),
                'types', f.types,
                'description', f.description,
                'timespan', f.timespan,
                'dimensions', f.dimensions,
                'material', f.material,
                'references', f.reference,
                'externalreference', f.extrefs
                )) AS finds FROM (SELECT * FROM jsonprepare.tmp WHERE system_type LIKE 'find') f ORDER BY f.child_name;




DROP TABLE IF EXISTS jsonprepare.tbl_findscomplete;
CREATE TABLE jsonprepare.tbl_findscomplete (id integer, parent_id integer, find jsonb);

INSERT INTO jsonprepare.tbl_findscomplete (id, parent_id, find)
SELECT id, parent_id, jsonb_strip_nulls(jsonb_build_object(
                'id', f.id,
                'properties', f.properties,
                'files', f.files
                )) AS finds FROM jsonprepare.tbl_finds f ORDER BY f.properties->'name' asc;


--burial
DROP TABLE IF EXISTS jsonprepare.tbl_burials;
CREATE TABLE jsonprepare.tbl_burials (id integer, parent_id integer, properties jsonb, finds jsonb, files jsonb);

INSERT INTO jsonprepare.tbl_burials (id, parent_id, files, properties, finds)
SELECT f.child_id AS id,
       f.parent_id,
       f.files,
       jsonb_strip_nulls(jsonb_build_object(
                'name', f.child_name,
                'maintype', jsonb_build_object(
                      'name', f.typename,
                      'path', f.path,
                      'id', f.type_id,
                      'parent_id', f.parenttype_id,
                      'systemtype', f.system_type
                ),
                'types', f.types,
                'description', f.description,
                'timespan', f.timespan,
                'dimensions', f.dimensions,
                'material', f.material,
                'references', f.reference,
                'externalreference', f.extrefs
                )) AS burials,
        jsonb_strip_nulls(jsonb_agg(fi.find))
                 FROM (SELECT * FROM jsonprepare.tmp WHERE system_type LIKE 'stratigraphic unit') f
                 LEFT JOIN jsonprepare.tbl_findscomplete fi ON f.child_id = fi.parent_id
                 GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.typename, f.path,
                          f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files, f.system_type, f.reference, f.extrefs
                 ORDER BY f.child_name;

UPDATE jsonprepare.tbl_burials f SET finds = NULL WHERE f.finds = '[null]';

DROP TABLE IF EXISTS jsonprepare.tbl_burialscomplete;
CREATE TABLE jsonprepare.tbl_burialscomplete (id integer, parent_id integer, burial jsonb);

INSERT INTO jsonprepare.tbl_burialscomplete (id, parent_id, burial)
SELECT id, parent_id, jsonb_strip_nulls(jsonb_build_object(
                'id', f.id,
                'properties', f.properties,
                'files', f.files,
                'finds', f.finds
                )) AS burials FROM jsonprepare.tbl_burials f ORDER BY f.properties->'name' asc;

--graves
DROP TABLE IF EXISTS jsonprepare.tbl_graves;
CREATE TABLE jsonprepare.tbl_graves (id integer, parent_id integer, geom jsonb, properties jsonb, files jsonb, burials jsonb);

INSERT INTO jsonprepare.tbl_graves (id, parent_id, files, geom, properties, burials)
SELECT f.child_id,
       f.parent_id,
       f.files,
       f.geom::jsonb,
       jsonb_strip_nulls(jsonb_build_object(
                'name', f.child_name,
                'maintype', jsonb_build_object(
                      'name', f.typename,
                      'path', f.path,
                      'id', f.type_id,
                      'parent_id', f.parenttype_id,
                      'systemtype', f.system_type
                ),
                'types', f.types,
                'description', f.description,
                'timespan', f.timespan,
                'dimensions', f.dimensions,
                'material', f.material,
                'references', f.reference,
                'externalreference', f.extrefs
                )) AS graves,
        jsonb_strip_nulls(jsonb_agg(fi.burial))
                 FROM (SELECT * FROM jsonprepare.tmp WHERE system_type LIKE 'feature') f LEFT JOIN jsonprepare.tbl_burialscomplete fi ON f.child_id = fi.parent_id
                 GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
                          f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files, f.system_type
                 ORDER BY f.child_name;

UPDATE jsonprepare.tbl_graves f SET burials = NULL WHERE f.burials = '[null]';


DROP TABLE IF EXISTS jsonprepare.tbl_gravescomplete;
CREATE TABLE jsonprepare.tbl_gravescomplete (id integer, parent_id integer, grave jsonb);

INSERT INTO jsonprepare.tbl_gravescomplete (id, parent_id, grave)
SELECT id, parent_id, jsonb_strip_nulls(jsonb_build_object(
                'type', 'Feature',
                'geometry', f.geom,
                'id', f.id,
                'parent', f.parent_id,
                'properties', f.properties,
                'files', f.files,
                'burials', f.burials
                )) AS graves FROM jsonprepare.tbl_graves f ORDER BY f.properties->'name' asc;

-- get data for sites
DROP TABLE IF EXISTS jsonprepare.tbl_sites;
CREATE TABLE jsonprepare.tbl_sites (id integer, name text, polygon text, point text);

INSERT INTO jsonprepare.tbl_sites (id, name)
SELECT child_id,
       child_name
FROM jsonprepare.sites;

UPDATE jsonprepare.tbl_sites
SET polygon = (SELECT g.geom FROM
   (SELECT ST_AsGeoJSON(geom) AS geom,
       domain_id
       FROM gis.polygon p JOIN model.link l ON p.entity_id = l.range_id) g WHERE jsonprepare.tbl_sites.id = g.domain_id);

UPDATE jsonprepare.tbl_sites
SET point = (SELECT g.geom FROM
   (SELECT ST_AsGeoJSON(geom) AS geom,
       domain_id
       FROM gis.point p JOIN model.link l ON p.entity_id = l.range_id) g WHERE jsonprepare.tbl_sites.id = g.domain_id);


DROP TABLE IF EXISTS jsonprepare.tbl_sitescomplete;
CREATE TABLE jsonprepare.tbl_sitescomplete (id integer, name text, properties jsonb);
INSERT INTO jsonprepare.tbl_sitescomplete (id, name, properties)
SELECT s.id,
       s.name,
       jsonb_strip_nulls(jsonb_build_object(
                'maintype', jsonb_build_object(
                      'name', f.typename,
                      'path', f.path,
                      'id', f.type_id,
                      'parent_id', f.parenttype_id,
                      'systemtype', f.system_type
                ),
                'types', f.types,
                'description', f.description,
                'timespan', f.timespan,
                'dimensions', f.dimensions,
                'material', f.material,
                'references', f.reference,
                'externalreference', f.extrefs,
                'files', f.files,
                'center', s.point::jsonb,
                'shape', s.polygon::jsonb
                )) AS sites
              FROM (SELECT * FROM jsonprepare.tmp WHERE system_type LIKE 'place') f LEFT JOIN jsonprepare.tbl_sites s ON f.child_id = s.id
                 GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
                          f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files, f.system_type, s.id, s.name,
                          s.point, s.polygon
                 ORDER BY f.child_name;


DROP TABLE IF EXISTS jsonprepare.tbl_medcem_data;
CREATE TABLE jsonprepare.tbl_medcem_data (id integer, name text, data jsonb);

INSERT INTO jsonprepare.tbl_medcem_data (id, name, data)
   SELECT
     s.id AS id,
     s.name AS name,
     (jsonb_strip_nulls(jsonb_build_object(
        'type',     'FeatureCollection',
        'site_id',  s.id,
        'name',     s.name,
        'properties', s.properties,
        'features', jsonb_strip_nulls(jsonb_agg(f.grave))
    )))
    FROM jsonprepare.tbl_sitescomplete s LEFT JOIN (SELECT * FROM jsonprepare.tbl_gravescomplete ORDER BY parent_id, grave ->'properties'->>'name') f ON s.id = f.parent_id
    GROUP BY s.id, s.name, s.properties;


-- DELETE Centerpoints of all entities used if polygons exists

-- DELETE FROM gis.point WHERE id in (
-- SELECT
--   point.id
--
-- FROM
--   jsonprepare.entities AS ent,
--   gis.point,
--   model.link,
--   model.entity
-- WHERE
--   ent.child_id = link.domain_id AND
--   point.entity_id = entity.id AND
--   link.range_id = entity.id);
--
-- Create Centerpoints (on surface) of existing polygons
--
-- INSERT INTO gis.point (entity_id, type, geom) (
-- SELECT id2, ('centerpoint'), ST_PointOnSurface(polyg) AS geom2 FROM
--
-- (SELECT
--   ent.child_id,
--   ent.child_name,
--   ent.parent_id,
--   polygon.geom AS polyg,
--   polygon.entity_id AS id2
--
-- FROM
--   jsonprepare.entities AS ent,
--   gis.polygon,
--   model.link,
--   model.entity
-- WHERE
--   ent.child_id = link.domain_id AND
--   polygon.entity_id = entity.id AND
--   link.range_id = entity.id) AS x);



-- create table with all types for json
DROP TABLE IF EXISTS jsonprepare.typesforjson;
CREATE TABLE jsonprepare.typesforjson AS
SELECT DISTINCT 'type' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path FROM jsonprepare.types_all WHERE --set types to display in jstree
                                                                                        name_path LIKE 'Anthropology%' OR
                                                                                        name_path LIKE 'Grave Construction%' OR
                                                                                        name_path LIKE 'Grave Shape%' OR
                                                                                        name_path LIKE 'Position of Find in Grave%' OR
                                                                                        name_path LIKE 'Sex%' OR
                                                                                        name_path LIKE 'Stylistic Classification%'
UNION ALL
SELECT DISTINCT 'dimensions' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path FROM jsonprepare.types_all WHERE name_path LIKE 'Dimensions%'
UNION ALL
SELECT DISTINCT 'material' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path FROM jsonprepare.types_all WHERE name_path LIKE 'Material%'
UNION ALL
SELECT DISTINCT 'find' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path FROM jsonprepare.types_all WHERE name_path LIKE 'Find >%'
UNION ALL
SELECT DISTINCT 'strat' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path FROM jsonprepare.types_all WHERE name_path LIKE 'Stratigraphic Unit%'
UNION ALL
SELECT DISTINCT 'feature' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path FROM jsonprepare.types_all WHERE name_path LIKE 'Feature%'

ORDER BY level, name_path;

UPDATE jsonprepare.typesforjson SET parent = '#' WHERE parent ISNULL; --necessary for jstree
INSERT INTO jsonprepare.typesforjson (level, id, text, parent, path, name_path) VALUES ('find', '13368', 'Find', '#', '13368', 'Find'); --hack because find has no parent

-- create table with all types as json
DROP TABLE IF EXISTS jsonprepare.typesjson;
CREATE TABLE jsonprepare.typesjson AS (
SELECT jsonb_agg(jsonb_build_object('id', id,
                          'text', text,
                          'parent', parent,
                          'namepath', name_path,
                          'path', path,
                          'level', level
                          )) as types FROM (SELECT * FROM jsonprepare.typesforjson AS types GROUP BY
                                types.level, types.id, types.text, types.parent, types.name_path, types.path ORDER BY name_path) as u);

