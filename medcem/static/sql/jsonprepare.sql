-- noinspection SqlResolveForFile

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
           NULL::text                           AS text,
           types_all.child_name,
           types_all.description,
           types_all.parent_id,
           ''::text || types_all.child_name     AS name_path
    FROM (SELECT x.child_id,
                 x.child_name,
                 x.description,
                 x.parent_id,
                 e.name AS parent_name
          FROM (SELECT entity.id          AS child_id,
                       entity.name        AS child_name,
                       entity.description AS description,
                       link.range_id      AS parent_id,
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
    FROM (SELECT x.child_id,
                 x.child_name,
                 x.description,
                 x.parent_id,
                 e.name AS parent_name
          FROM (SELECT entity.id          AS child_id,
                       entity.name        AS child_name,
                       entity.description AS description,
                       link.range_id      AS parent_id,
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
    SELECT NULL::integer AS parent_id,
           s.name        AS child_name,
           s.id          AS child_id,
           s.description,
           s.begin_from,
           s.begin_to,
           s.begin_comment,
           s.end_from,
           s.end_to,
           s.end_comment,
           s.system_type,
           NULL::TEXT    as geom
    FROM (SELECT e.id,
                 e.name,
                 e.description,
                 date_part('year', e.begin_from)::integer AS begin_from,
                 date_part('year', e.begin_to)::integer   AS begin_to,
                 e.begin_comment,
                 date_part('year', e.end_from)::integer   AS end_from,
                 date_part('year', e.end_to)::integer     AS end_to,
                 e.end_comment,
                 e.system_type,
                 l.range_id
          FROM model.entity e
                   JOIN model.link l ON e.id = l.domain_id
          WHERE l.property_code = 'P2'
            AND e.system_type = 'place'
            AND e.id in (50505, 50497, 111285)) AS s
             JOIN jsonprepare.types_all t ON t.id = s.range_id
    WHERE t.name_path LIKE 'Place > Burial Site%'
);

UPDATE jsonprepare.sites
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;

UPDATE jsonprepare.sites
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id
  AND jsonprepare.sites.geom ISNULL;


-- graves
DROP TABLE IF EXISTS jsonprepare.graves;
CREATE TABLE jsonprepare.graves AS
SELECT parent.id                                    AS parent_id,
       child.name                                   AS child_name,
       child.id                                     AS child_id,
       child.description,
       date_part('year', child.begin_from)::integer AS begin_from,
       date_part('year', child.begin_to)::integer   AS begin_to,
       child.begin_comment,
       date_part('year', child.end_from)::integer   AS end_from,
       date_part('year', child.end_to)::integer     AS end_to,
       child.end_comment,
       child.system_type,
       NULL::TEXT                                   as geom
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM jsonprepare.sites)
  AND l_p_c.property_code = 'P46'
ORDER BY child.system_type, parent.id, child.name;


UPDATE jsonprepare.graves
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;

UPDATE jsonprepare.graves
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id
  AND jsonprepare.graves.geom ISNULL;


--burials
DROP TABLE IF EXISTS jsonprepare.burials;
CREATE TABLE jsonprepare.burials AS
SELECT parent.id                                    AS parent_id,
       child.name                                   AS child_name,
       child.id                                     AS child_id,
       child.description,
       date_part('year', child.begin_from)::integer AS begin_from,
       date_part('year', child.begin_to)::integer   AS begin_to,
       child.begin_comment,
       date_part('year', child.end_from)::integer   AS end_from,
       date_part('year', child.end_to)::integer     AS end_to,
       child.end_comment,
       child.system_type,
       NULL::TEXT                                   as geom
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM jsonprepare.graves)
  AND l_p_c.property_code = 'P46'
ORDER BY child.system_type, parent.id, child.name;


UPDATE jsonprepare.burials
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;

UPDATE jsonprepare.burials
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id
  AND jsonprepare.burials.geom ISNULL;

--finds
DROP TABLE IF EXISTS jsonprepare.finds;
CREATE TABLE jsonprepare.finds AS
SELECT parent.id                                    AS parent_id,
       child.name                                   AS child_name,
       child.id                                     AS child_id,
       child.description,
       date_part('year', child.begin_from)::integer AS begin_from,
       date_part('year', child.begin_to)::integer   AS begin_to,
       child.begin_comment,
       date_part('year', child.end_from)::integer   AS end_from,
       date_part('year', child.end_to)::integer     AS end_to,
       child.end_comment,
       child.system_type,
       NULL::TEXT                                   as geom
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM jsonprepare.burials)
  AND l_p_c.property_code = 'P46'
ORDER BY child.system_type, parent.id, child.name;


UPDATE jsonprepare.finds
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;

UPDATE jsonprepare.finds
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id
  AND jsonprepare.finds.geom ISNULL;

-- all entities union
CREATE TABLE jsonprepare.entitiestmp AS
SELECT *
FROM jsonprepare.sites
UNION ALL
SELECT *
FROM jsonprepare.graves
UNION ALL
SELECT *
FROM jsonprepare.burials
UNION ALL
SELECT *
FROM jsonprepare.finds
ORDER BY parent_id, child_name;

UPDATE jsonprepare.entitiestmp
SET begin_comment = NULL
WHERE begin_comment = '';
UPDATE jsonprepare.entitiestmp
SET end_comment = NULL
WHERE end_comment = '';
UPDATE jsonprepare.entitiestmp
SET description = NULL
WHERE description = '';


--types
DROP TABLE IF EXISTS jsonprepare.types_main;
CREATE TABLE jsonprepare.types_main AS
SELECT DISTINCT types_all.id,
                types_all.parent_id,
                entitiestmp.child_id AS entity_id,
                types_all.name,
                types_all.description,
                link.description     AS value,
                types_all.name_path  AS path
FROM jsonprepare.types_all,
     jsonprepare.entitiestmp,
     model.link
WHERE entitiestmp.child_id = link.domain_id
  AND link.range_id = types_all.id
ORDER BY entity_id, types_all.name_path;

UPDATE jsonprepare.types_main
SET description = NULL
WHERE description = '';

--types main
DROP TABLE IF EXISTS jsonprepare.maintype;
CREATE TABLE jsonprepare.maintype AS
SELECT *
FROM jsonprepare.types_main
WHERE path LIKE 'Place >%'
   OR path LIKE 'Feature >%'
   OR path LIKE 'Stratigraphic Unit >%'
   OR path LIKE 'Find >%'
ORDER BY entity_id, path;

--types dimensions
DROP TABLE IF EXISTS jsonprepare.dimensiontypes;
CREATE TABLE jsonprepare.dimensiontypes AS
SELECT *
FROM jsonprepare.types_main
WHERE path LIKE 'Dimensions >%'
ORDER BY entity_id, path;

--hack for setting burial orientation to grave orientation if grave does not have any
INSERT INTO model.link (domain_id, range_id, property_code, description)

SELECT domain,
       range,
       'P2',
       orientation::double precision
FROM (SELECT l.domain,
             l.range,
             l.orientation
      FROM (SELECT g.child_id AS DOMAIN,
                   d.value    AS orientation,
                   d.name,
                   d.id       AS range
            FROM jsonprepare.graves g
                     JOIN jsonprepare.burials b ON g.child_id = b.parent_id
                     JOIN jsonprepare.dimensiontypes d ON b.child_id = d.entity_id
            WHERE d.name = 'Degrees') AS l) AS d
WHERE DOMAIN || ':' || range NOT IN
      (SELECT domain_id || ':' || range_id
       FROM model.link
       WHERE property_code = 'P2'
         AND range_id = 26192)
  AND DOMAIN NOT IN
      (SELECT parent_id
       from (SELECT parent_id,
                    count(parent_id) as count
             FROM jsonprepare.burials
             GROUP BY parent_id) c
       WHERE c.count > 1);

--types dimensions (redo because of updated links)
DROP TABLE IF EXISTS jsonprepare.dimensiontypes;
CREATE TABLE jsonprepare.dimensiontypes AS
SELECT *
FROM jsonprepare.types_main
WHERE path LIKE 'Dimensions >%'
ORDER BY entity_id, path;

--types material
DROP TABLE IF EXISTS jsonprepare.materialtypes;
CREATE TABLE jsonprepare.materialtypes AS
SELECT *
FROM jsonprepare.types_main
WHERE path LIKE 'Material >%'
ORDER BY entity_id, path;


--other types
DROP TABLE IF EXISTS jsonprepare.types;
CREATE TABLE jsonprepare.types AS
SELECT *
FROM jsonprepare.types_main
WHERE path NOT LIKE 'Dimensions >%'
  AND path NOT LIKE 'Place >%'
  AND path NOT LIKE 'Feature >%'
  AND path NOT LIKE 'Stratigraphic Unit >%'
  AND path NOT LIKE 'Find >%'
  AND path NOT LIKE 'Material >%'
ORDER BY entity_id, path;

--entities with maintypes
CREATE TABLE jsonprepare.entities AS
SELECT e.*,
       t.id        AS type_id,
       t.parent_id AS parenttype_id,
       t.name      AS typename,
       t.path
FROM jsonprepare.entitiestmp e
         JOIN jsonprepare.maintype t ON e.child_id = t.entity_id;

--files
DROP TABLE IF EXISTS jsonprepare.files;
CREATE TABLE jsonprepare.files AS
SELECT entities.child_id AS parent_id,
       entity.name,
       entity.id
FROM jsonprepare.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entity.system_type ~~ 'file'::text
ORDER BY entities.child_id;

DROP TABLE IF EXISTS jsonprepare.filestmp;
CREATE TABLE jsonprepare.filestmp AS
    (SELECT files.*,
            fe.description AS Source,
            fl.description AS Reference
     FROM (
              SELECT f.*,
                     lic.name AS license
              FROM (SELECT license.*
                    FROM (SELECT l.range_id,
                                 l.domain_id,
                                 e.name
                          FROM model.link l
                                   JOIN model.entity e ON l.range_id = e.id
                          WHERE l.property_code = 'P2') AS license
                             LEFT JOIN jsonprepare.types_all t ON t.id = license.range_id
                    WHERE t.name_path LIKE 'License%') AS lic
                       RIGHT JOIN jsonprepare.files f ON f.id = lic.domain_id) as files
              LEFT JOIN model.link fl ON files.id = fl.range_id
              LEFT JOIN model.entity fe ON fl.domain_id = fe.id);


DROP TABLE jsonprepare.files;
CREATE TABLE jsonprepare.files AS
    (SELECT *
     FROM jsonprepare.filestmp);


--references
DROP TABLE IF EXISTS jsonprepare.reference;
CREATE TABLE jsonprepare.reference AS
SELECT entities.child_id  AS parent_id,
       entity.name        as abbreviation,
       entity.description AS title,
       link.description   AS reference,
       entity.id
FROM jsonprepare.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entity.system_type ~~ 'bibliography'::text
ORDER BY entities.child_id;


UPDATE jsonprepare.reference
SET abbreviation = NULL
WHERE abbreviation = '';
UPDATE jsonprepare.reference
SET title = NULL
WHERE title = '';
UPDATE jsonprepare.reference
SET reference = NULL
WHERE reference = '';

--external references/urls
DROP TABLE IF EXISTS jsonprepare.extrefs;
CREATE TABLE jsonprepare.extrefs AS
SELECT entities.child_id  AS parent_id,
       entity.name        as url,
       link.description   AS name,
       entity.description AS description,
       entity.id
FROM jsonprepare.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entity.system_type ~~ 'external reference'::text
ORDER BY entities.child_id;


UPDATE jsonprepare.extrefs
SET description = NULL
WHERE description = '';
UPDATE jsonprepare.extrefs
SET name = NULL
WHERE name = '';

-- create table with types and files of all entities
DROP TABLE IF EXISTS jsonprepare.types_and_files;
CREATE TABLE jsonprepare.types_and_files
(
    entity_id  integer,
    types      jsonb,
    files      jsonb,
    dimensions jsonb,
    material   jsonb,
    timespan   jsonb,
    reference  jsonb,
    extrefs    jsonb
);

-- insert type data
INSERT INTO jsonprepare.types_and_files (entity_id, types)
SELECT e.child_id, types
FROM jsonprepare.entities e
         INNER JOIN
     (SELECT t.entity_id,
             jsonb_agg(jsonb_build_object(
                     'id', t.id,
                     'name', t.name,
                     'description', t.description,
                     'value', t.value,
                     'path', t.path)) AS types
      FROM jsonprepare.types t
      GROUP BY entity_id) AS irgendwas
     ON e.child_id = irgendwas.entity_id;


-- insert file data
UPDATE jsonprepare.types_and_files
SET files = (SELECT files
             FROM (
                      SELECT e.child_id, files
                      FROM jsonprepare.entities e
                               INNER JOIN
                           (SELECT t.parent_id,
                                   jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                                           'id', t.id,
                                           'name', t.name,
                                           'license', t.license,
                                           'source', t.source,
                                           'reference', t.reference
                                       ))) AS files
                            FROM jsonprepare.files t
                            GROUP BY parent_id) AS irgendwas
                           ON e.child_id = irgendwas.parent_id) f
             WHERE entity_id = f.child_id);


-- insert bibliography data
UPDATE jsonprepare.types_and_files
SET reference = (SELECT reference
                 FROM (
                          SELECT e.child_id, reference
                          FROM jsonprepare.entities e
                                   INNER JOIN
                               (SELECT t.parent_id,
                                       jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                                               'id', t.id,
                                               'abbreviation', t.abbreviation,
                                               'title', t.title,
                                               'reference', t.reference
                                           ))) AS reference
                                FROM jsonprepare.reference t
                                GROUP BY parent_id) AS irgendwas
                               ON e.child_id = irgendwas.parent_id) f
                 WHERE entity_id = f.child_id);

--insert external refs data
UPDATE jsonprepare.types_and_files
SET extrefs = extref
FROM (
         SELECT e.child_id, extref
         FROM jsonprepare.entities e
                  INNER JOIN
              (SELECT t.parent_id,
                      jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                              'id', t.id,
                              'url', t.url,
                              'name', t.name,
                              'description', t.description
                          ))) AS extref
               FROM jsonprepare.extrefs t
               GROUP BY parent_id) AS irgendwas
              ON e.child_id = irgendwas.parent_id) f
WHERE entity_id = f.child_id;

-- insert dimension data
UPDATE jsonprepare.types_and_files
SET dimensions = dimtypes
FROM (
         SELECT e.child_id, dimtypes
         FROM jsonprepare.entities e
                  INNER JOIN
              (SELECT t.entity_id,
                      jsonb_agg(jsonb_build_object(
                              'id', t.id,
                              'name', t.name,
                              'value', t.value,
                              'path', t.path)) AS dimtypes
               FROM jsonprepare.dimensiontypes t
               GROUP BY entity_id) AS irgendwas
              ON e.child_id = irgendwas.entity_id) f
WHERE entity_id = f.child_id;

-- insert material data
UPDATE jsonprepare.types_and_files
SET material = mattypes
FROM (
         SELECT e.child_id, mattypes
         FROM jsonprepare.entities e
                  INNER JOIN
              (SELECT t.entity_id,
                      jsonb_agg(jsonb_build_object(
                              'id', t.id,
                              'name', t.name,
                              'value', t.value,
                              'path', t.path)) AS mattypes
               FROM jsonprepare.materialtypes t
               GROUP BY entity_id) AS irgendwas
              ON e.child_id = irgendwas.entity_id) f
WHERE entity_id = f.child_id;


-- insert timespan data
UPDATE jsonprepare.types_and_files
SET timespan = time
FROM (
         SELECT child_id,
                jsonb_strip_nulls(jsonb_build_object(
                        'begin_from', f.begin_from,
                        'begin_to', f.begin_to,
                        'begin_comment', f.begin_comment,
                        'end_from', f.end_from,
                        'end_to', f.end_to,
                        'end_comment', f.end_comment)) AS time
         FROM jsonprepare.entities f) AS irgendwas
WHERE entity_id = irgendwas.child_id;


--temp table with all info
DROP TABLE IF EXISTS jsonprepare.tmp;
CREATE TABLE jsonprepare.tmp AS
    (SELECT *
     FROM jsonprepare.entities e
              RIGHT OUTER JOIN jsonprepare.types_and_files t ON e.child_id = t.entity_id);

UPDATE jsonprepare.tmp
SET timespan = NULL
WHERE timespan = '{}';
UPDATE jsonprepare.tmp
SET description = NULL
WHERE description = '';
UPDATE jsonprepare.tmp
SET begin_comment = NULL
WHERE begin_comment = '';
UPDATE jsonprepare.tmp
SET end_comment = NULL
WHERE end_comment = '';


---finds json
DROP TABLE IF EXISTS jsonprepare.tbl_finds;
CREATE TABLE jsonprepare.tbl_finds
(
    id         integer,
    parent_id  integer,
    properties jsonb,
    files      jsonb
);

INSERT INTO jsonprepare.tbl_finds (id, parent_id, files, properties)
SELECT f.child_id,
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
           )) AS finds
FROM (SELECT * FROM jsonprepare.tmp WHERE system_type LIKE 'find') f
ORDER BY f.child_name;



DROP TABLE IF EXISTS jsonprepare.tbl_findscomplete;
CREATE TABLE jsonprepare.tbl_findscomplete
(
    id        integer,
    parent_id integer,
    find      jsonb
);

INSERT INTO jsonprepare.tbl_findscomplete (id, parent_id, find)
SELECT id,
       parent_id,
       jsonb_strip_nulls(jsonb_build_object(
               'id', f.id,
               'properties', f.properties,
               'files', f.files
           )) AS finds
FROM jsonprepare.tbl_finds f;
--ORDER BY f.properties -> 'name' asc;


--burial
DROP TABLE IF EXISTS jsonprepare.tbl_burials;
CREATE TABLE jsonprepare.tbl_burials
(
    id         integer,
    parent_id  integer,
    properties jsonb,
    finds      jsonb,
    files      jsonb
);

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
           ))     AS burials,
       jsonb_strip_nulls(jsonb_agg(fi.find))
FROM (SELECT * FROM jsonprepare.tmp WHERE system_type LIKE 'stratigraphic unit') f
         LEFT JOIN jsonprepare.tbl_findscomplete fi ON f.child_id = fi.parent_id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.typename, f.path,
         f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files, f.system_type, f.reference, f.extrefs
ORDER BY f.child_name;

UPDATE jsonprepare.tbl_burials f
SET finds = NULL
WHERE f.finds = '[
  null
]';

DROP TABLE IF EXISTS jsonprepare.tbl_burialscomplete;
CREATE TABLE jsonprepare.tbl_burialscomplete
(
    id        integer,
    parent_id integer,
    burial    jsonb
);

INSERT INTO jsonprepare.tbl_burialscomplete (id, parent_id, burial)
SELECT id,
       parent_id,
       jsonb_strip_nulls(jsonb_build_object(
               'id', f.id,
               'properties', f.properties,
               'files', f.files,
               'finds', f.finds
           )) AS burials
FROM jsonprepare.tbl_burials f;
--ORDER BY f.properties -> 'name' asc;

--graves
DROP TABLE IF EXISTS jsonprepare.tbl_graves;
CREATE TABLE jsonprepare.tbl_graves
(
    id         integer,
    parent_id  integer,
    geom       jsonb,
    properties jsonb,
    files      jsonb,
    burials    jsonb
);

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
FROM (SELECT * FROM jsonprepare.tmp WHERE system_type LIKE 'feature') f
         LEFT JOIN jsonprepare.tbl_burialscomplete fi ON f.child_id = fi.parent_id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
         f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files,
         f.system_type
ORDER BY f.child_name;

UPDATE jsonprepare.tbl_graves f
SET burials = NULL
WHERE f.burials = '[
  null
]';


DROP TABLE IF EXISTS jsonprepare.tbl_gravescomplete;
CREATE TABLE jsonprepare.tbl_gravescomplete
(
    id        integer,
    parent_id integer,
    grave     jsonb
);

INSERT INTO jsonprepare.tbl_gravescomplete (id, parent_id, grave)
SELECT id,
       parent_id,
       jsonb_strip_nulls(jsonb_build_object(
               'type', 'Feature',
               'geometry', f.geom,
               'id', f.id,
               'parent', f.parent_id,
               'properties', f.properties,
               'files', f.files,
               'burials', f.burials
           )) AS graves
FROM jsonprepare.tbl_graves f;
--ORDER BY f.properties -> 'name' asc;

-- get data for sites
DROP TABLE IF EXISTS jsonprepare.tbl_sites;
CREATE TABLE jsonprepare.tbl_sites
(
    id      integer,
    name    text,
    polygon text,
    point   text
);

INSERT INTO jsonprepare.tbl_sites (id, name)
SELECT child_id,
       child_name
FROM jsonprepare.sites;

UPDATE jsonprepare.tbl_sites
SET polygon = geom
FROM (SELECT ST_AsGeoJSON(geom) AS geom,
             domain_id
      FROM gis.polygon p
               JOIN model.link l ON p.entity_id = l.range_id) g
WHERE jsonprepare.tbl_sites.id = g.domain_id;

UPDATE jsonprepare.tbl_sites
SET point = geom
FROM (SELECT ST_AsGeoJSON(geom) AS geom,
             domain_id
      FROM gis.point p
               JOIN model.link l ON p.entity_id = l.range_id) g
WHERE jsonprepare.tbl_sites.id = g.domain_id;


DROP TABLE IF EXISTS jsonprepare.tbl_sitescomplete;
CREATE TABLE jsonprepare.tbl_sitescomplete
(
    id         integer,
    name       text,
    properties jsonb
);
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
FROM (SELECT * FROM jsonprepare.tmp WHERE system_type LIKE 'place') f
         LEFT JOIN jsonprepare.tbl_sites s ON f.child_id = s.id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
         f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files,
         f.system_type, s.id, s.name,
         s.point, s.polygon
ORDER BY f.child_name;


DROP TABLE IF EXISTS jsonprepare.tbl_medcem_data;
CREATE TABLE jsonprepare.tbl_medcem_data
(
    id   integer,
    name text,
    data jsonb
);

INSERT INTO jsonprepare.tbl_medcem_data (id, name, data)
SELECT s.id   AS id,
       s.name AS name,
       (jsonb_strip_nulls(jsonb_build_object(
               'type', 'FeatureCollection',
               'site_id', s.id,
               'name', s.name,
               'properties', s.properties,
               'features', jsonb_strip_nulls(jsonb_agg(f.grave))
           )))
FROM jsonprepare.tbl_sitescomplete s
         LEFT JOIN (SELECT * FROM jsonprepare.tbl_gravescomplete ORDER BY parent_id, grave -> 'properties' ->> 'name') f
                   ON s.id = f.parent_id
GROUP BY s.id, s.name, s.properties;


-- create table with all types for json
DROP TABLE IF EXISTS jsonprepare.typesforjson;
CREATE TABLE jsonprepare.typesforjson AS
SELECT DISTINCT 'type' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM jsonprepare.types_all
WHERE --set types to display in jstree
    name_path LIKE 'Anthropology%'
   OR name_path LIKE 'Grave Construction%'
   OR name_path LIKE 'Grave Shape%'
   OR name_path LIKE 'Position of Find in Grave%'
   OR name_path LIKE 'Sex%'
   OR name_path LIKE 'Stylistic Classification%'
UNION ALL
SELECT DISTINCT 'dimensions' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM jsonprepare.types_all
WHERE name_path LIKE 'Dimensions%'
UNION ALL
SELECT DISTINCT 'material' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM jsonprepare.types_all
WHERE name_path LIKE 'Material%'
UNION ALL
SELECT DISTINCT 'find' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM jsonprepare.types_all
WHERE name_path LIKE 'Find >%'
UNION ALL
SELECT DISTINCT 'strat' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM jsonprepare.types_all
WHERE name_path LIKE 'Stratigraphic Unit%'
UNION ALL
SELECT DISTINCT 'feature' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM jsonprepare.types_all
WHERE name_path LIKE 'Feature%'

ORDER BY level, name_path;

UPDATE jsonprepare.typesforjson
SET parent = '#'
WHERE parent ISNULL; --necessary for jstree
INSERT INTO jsonprepare.typesforjson (level, id, text, parent, path, name_path)
VALUES ('find', '13368', 'Find', '#', '13368', 'Find');
--hack because find has no parent

-- create table with all types as json
DROP TABLE IF EXISTS jsonprepare.typesjson;
CREATE TABLE jsonprepare.typesjson AS (
    SELECT jsonb_agg(jsonb_build_object('id', id,
                                        'text', text,
                                        'parent', parent,
                                        'namepath', name_path,
                                        'path', path,
                                        'level', level
        )) as types
    FROM (SELECT *
          FROM jsonprepare.typesforjson AS types
          GROUP BY types.level, types.id, types.text, types.parent, types.name_path, types.path
          ORDER BY name_path) as u);


-- prepare data for charts
DROP TABLE IF EXISTS jsonprepare.depth_labels;
CREATE TABLE jsonprepare.depth_labels AS (
-- get labels for depth of graves
    SELECT jsonb_agg(js.json_object_keys)
               AS labels
    FROM (SELECT json_object_keys(row_to_json)
          FROM (SELECT row_to_json(c.*)
                FROM (
                         SELECT count(*) FILTER (WHERE VALUE <= 20)                  AS "0-20",
                                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40)   AS "20-40",
                                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60)   AS "40-60",
                                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80)   AS "60-80",
                                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100)  AS "80-100",
                                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) AS "100-120",
                                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) AS "120-140",
                                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) AS "140-160",
                                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180) AS "160-180",
                                count(*) FILTER (WHERE VALUE > 180 AND VALUE <= 200) AS "180-200",
                                count(*) FILTER (WHERE VALUE > 200 AND VALUE <= 220) AS "200-220",
                                count(*) FILTER (WHERE VALUE > 220 AND VALUE <= 240) AS "220-240",
                                count(*) FILTER (WHERE VALUE > 240 AND VALUE <= 260) AS "240-260",
                                count(*) FILTER (WHERE VALUE > 260 AND VALUE <= 280) AS "260-280",
                                count(*) FILTER (WHERE VALUE > 280 AND VALUE <= 300) AS "280-300",
                                count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 320) AS "300-320",
                                count(*) FILTER (WHERE VALUE > 320 AND VALUE <= 340) AS "320-340",
                                count(*) FILTER (WHERE VALUE > 340 AND VALUE <= 360) AS "340-360",
                                count(*) FILTER (WHERE VALUE > 360 AND VALUE <= 380) AS "360-380",
                                count(*) FILTER (WHERE VALUE > 380 AND VALUE <= 400) AS "380-400",
                                count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 420) AS "400-420",
                                count(*) FILTER (WHERE VALUE > 420 AND VALUE <= 440) AS "420-440",
                                count(*) FILTER (WHERE VALUE > 440 AND VALUE <= 460) AS "440-460",
                                count(*) FILTER (WHERE VALUE > 460 AND VALUE <= 480) AS "460-480",
                                count(*) FILTER (WHERE VALUE > 480 AND VALUE <= 500) AS "480-500",
                                count(*) FILTER (WHERE VALUE > 500 AND VALUE <= 520) AS "500-520",
                                count(*) FILTER (WHERE VALUE > 520 AND VALUE <= 540) AS "520-540",
                                count(*) FILTER (WHERE VALUE > 540 AND VALUE <= 560) AS "540-560",
                                count(*) FILTER (WHERE VALUE > 560 AND VALUE <= 580) AS "560-580",
                                count(*) FILTER (WHERE VALUE > 580 AND VALUE <= 600) AS "580-600",
                                count(*) FILTER (WHERE VALUE > 600)                  AS "over 600"

                         FROM (
                                  SELECT g.parent_id,
                                         s.name AS site_name,
                                         d.value::double precision
                                  FROM jsonprepare.tbl_sites s
                                           JOIN jsonprepare.graves g ON g.parent_id = s.id
                                           JOIN jsonprepare.dimensiontypes d ON g.child_id = d.entity_id
                                  WHERE d.name = 'Height'
                              ) v

                         group BY parent_id, site_name
                     ) c
                LIMIT 1) AS ok) AS js);

--get values
DROP TABLE IF EXISTS jsonprepare.depth;
CREATE TABLE jsonprepare.depth AS (
    SELECT parent_id                                  AS "site_id",
           site_name                                  AS "label",
           '[' ||
           count(*) FILTER (WHERE VALUE <= 20) || ',' ||
           count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40) || ',' ||
           count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60) || ',' ||
           count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80) || ',' ||
           count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100) || ',' ||
           count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) || ',' ||
           count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) || ',' ||
           count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) || ',' ||
           count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180) || ',' ||
           count(*) FILTER (WHERE VALUE > 180 AND VALUE <= 200) || ',' ||
           count(*) FILTER (WHERE VALUE > 200 AND VALUE <= 220) || ',' ||
           count(*) FILTER (WHERE VALUE > 220 AND VALUE <= 240) || ',' ||
           count(*) FILTER (WHERE VALUE > 240 AND VALUE <= 260) || ',' ||
           count(*) FILTER (WHERE VALUE > 260 AND VALUE <= 280) || ',' ||
           count(*) FILTER (WHERE VALUE > 280 AND VALUE <= 300) || ',' ||
           count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 320) || ',' ||
           count(*) FILTER (WHERE VALUE > 320 AND VALUE <= 340) || ',' ||
           count(*) FILTER (WHERE VALUE > 340 AND VALUE <= 360) || ',' ||
           count(*) FILTER (WHERE VALUE > 360 AND VALUE <= 380) || ',' ||
           count(*) FILTER (WHERE VALUE > 380 AND VALUE <= 400) || ',' ||
           count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 420) || ',' ||
           count(*) FILTER (WHERE VALUE > 420 AND VALUE <= 440) || ',' ||
           count(*) FILTER (WHERE VALUE > 440 AND VALUE <= 460) || ',' ||
           count(*) FILTER (WHERE VALUE > 460 AND VALUE <= 480) || ',' ||
           count(*) FILTER (WHERE VALUE > 480 AND VALUE <= 500) || ',' ||
           count(*) FILTER (WHERE VALUE > 500 AND VALUE <= 520) || ',' ||
           count(*) FILTER (WHERE VALUE > 520 AND VALUE <= 540) || ',' ||
           count(*) FILTER (WHERE VALUE > 540 AND VALUE <= 560) || ',' ||
           count(*) FILTER (WHERE VALUE > 560 AND VALUE <= 580) || ',' ||
           count(*) FILTER (WHERE VALUE > 580 AND VALUE <= 600) || ',' ||
           count(*) FILTER (WHERE VALUE > 600) || ']' AS data

    FROM (
             SELECT g.parent_id,
                    s.name AS site_name,
                    d.value::double precision
             FROM jsonprepare.tbl_sites s
                      JOIN jsonprepare.graves g ON g.parent_id = s.id
                      JOIN jsonprepare.dimensiontypes d ON g.child_id = d.entity_id
             WHERE d.name = 'Height'
         ) v

    GROUP BY parent_id, site_name);


DROP TABLE IF EXISTS jsonprepare.chart_data;
CREATE TABLE jsonprepare.chart_data
(
    depth       JSONB,
    orientation JSONB,
    sex         JSONB
);


DROP TABLE IF EXISTS jsonprepare.chart_depth;
CREATE TABLE jsonprepare.chart_depth
(
    depth TEXT
);
INSERT INTO jsonprepare.chart_depth (depth)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM jsonprepare.depth_labels dl,
     jsonprepare.depth d
GROUP BY dl.labels;

UPDATE jsonprepare.chart_depth
SET depth = REPLACE(depth, '"[', '[');
UPDATE jsonprepare.chart_depth
SET depth = REPLACE(depth, ']"', ']');

INSERT INTO jsonprepare.chart_data (depth)
SELECT depth::JSONB
FROM jsonprepare.chart_depth;


DROP TABLE IF EXISTS jsonprepare.orientation_labels;
CREATE TABLE jsonprepare.orientation_labels AS (
-- get labels for orientation of graves
    SELECT jsonb_agg(js.json_object_keys)
               AS labels
    FROM (SELECT json_object_keys(row_to_json)
          FROM (SELECT row_to_json(c.*)
                FROM (
                         SELECT count(*) FILTER (WHERE VALUE <= 20)                  AS "0-20",
                                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40)   AS "20-40",
                                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60)   AS "40-60",
                                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80)   AS "60-80",
                                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100)  AS "80-100",
                                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) AS "100-120",
                                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) AS "120-140",
                                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) AS "140-160",
                                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180) AS "160-180",
                                count(*) FILTER (WHERE VALUE > 180 AND VALUE <= 200) AS "180-200",
                                count(*) FILTER (WHERE VALUE > 200 AND VALUE <= 220) AS "200-220",
                                count(*) FILTER (WHERE VALUE > 220 AND VALUE <= 240) AS "220-240",
                                count(*) FILTER (WHERE VALUE > 240 AND VALUE <= 260) AS "240-260",
                                count(*) FILTER (WHERE VALUE > 260 AND VALUE <= 280) AS "260-280",
                                count(*) FILTER (WHERE VALUE > 280 AND VALUE <= 300) AS "280-300",
                                count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 320) AS "300-320",
                                count(*) FILTER (WHERE VALUE > 320 AND VALUE <= 340) AS "320-340",
                                count(*) FILTER (WHERE VALUE > 340 AND VALUE <= 360) AS "340-360"
                         FROM (
                                  SELECT g.parent_id,
                                         s.name AS site_name,
                                         d.value::double precision
                                  FROM jsonprepare.tbl_sites s
                                           JOIN jsonprepare.graves g ON g.parent_id = s.id
                                           JOIN jsonprepare.dimensiontypes d ON g.child_id = d.entity_id
                                  WHERE d.name = 'Degrees'
                              ) v

                         group BY parent_id, site_name
                     ) c
                LIMIT 1) AS ok) AS js);

--get values
DROP TABLE IF EXISTS jsonprepare.orientation;
CREATE TABLE jsonprepare.orientation AS (
    SELECT parent_id                                                   AS "site_id",
           site_name                                                   AS "label",
           '[' ||
           count(*) FILTER (WHERE VALUE <= 20) || ',' ||
           count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40) || ',' ||
           count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60) || ',' ||
           count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80) || ',' ||
           count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100) || ',' ||
           count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) || ',' ||
           count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) || ',' ||
           count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) || ',' ||
           count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180) || ',' ||
           count(*) FILTER (WHERE VALUE > 180 AND VALUE <= 200) || ',' ||
           count(*) FILTER (WHERE VALUE > 200 AND VALUE <= 220) || ',' ||
           count(*) FILTER (WHERE VALUE > 220 AND VALUE <= 240) || ',' ||
           count(*) FILTER (WHERE VALUE > 240 AND VALUE <= 260) || ',' ||
           count(*) FILTER (WHERE VALUE > 260 AND VALUE <= 280) || ',' ||
           count(*) FILTER (WHERE VALUE > 280 AND VALUE <= 300) || ',' ||
           count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 320) || ',' ||
           count(*) FILTER (WHERE VALUE > 320 AND VALUE <= 340) || ',' ||
           count(*) FILTER (WHERE VALUE > 340 AND VALUE <= 360) || ']' AS data
    FROM (
             SELECT g.parent_id,
                    s.name AS site_name,
                    d.value::double precision
             FROM jsonprepare.tbl_sites s
                      JOIN jsonprepare.graves g ON g.parent_id = s.id
                      JOIN jsonprepare.dimensiontypes d ON g.child_id = d.entity_id
             WHERE d.name = 'Degrees'
         ) v

    GROUP BY parent_id, site_name);



DROP TABLE IF EXISTS jsonprepare.chart_orientation;
CREATE TABLE jsonprepare.chart_orientation
(
    orientation TEXT
);
INSERT INTO jsonprepare.chart_orientation (orientation)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM jsonprepare.orientation_labels dl,
     jsonprepare.orientation d
GROUP BY dl.labels;

UPDATE jsonprepare.chart_orientation
SET orientation = REPLACE(orientation, '"[', '[');
UPDATE jsonprepare.chart_orientation
SET orientation = REPLACE(orientation, ']"', ']');

UPDATE jsonprepare.chart_data
SET orientation = (SELECT orientation::JSONB FROM jsonprepare.chart_orientation);

DROP TABLE IF EXISTS jsonprepare.sex;
CREATE TABLE jsonprepare.sex AS (
    SELECT s.parent_id AS site_id,
           s.site_name AS "label",
           '[' ||
           count(s.*) FILTER (WHERE name LIKE 'Male%') || ',' ||
           count(s.*) FILTER (WHERE name LIKE 'Female%') || ',' ||
           (bc.burialcount - count(s.*) FILTER (WHERE name LIKE 'Male%') -
            count(s.*) FILTER (WHERE name LIKE 'Female%')) || ']'
                       AS data
    FROM (
             SELECT g.parent_id,
                    s.name AS site_name,
                    d.name
             FROM jsonprepare.tbl_sites s
                      JOIN jsonprepare.graves g ON g.parent_id = s.id
                      JOIN jsonprepare.burials b ON g.child_id = b.parent_id
                      JOIN jsonprepare.types d ON b.child_id = d.entity_id
             WHERE d.path LIKE 'Sex%') s
             JOIN (
        SELECT g.parent_id        AS site_id,
               count(g.parent_id) AS burialcount
        FROM jsonprepare.tbl_sites s
                 JOIN jsonprepare.graves g ON g.parent_id = s.id
                 JOIN jsonprepare.burials b ON g.child_id = b.parent_id
        GROUP by g.parent_id
    ) bc ON s.parent_id = bc.site_id
    GROUP BY site_name, parent_id, burialcount);

DROP TABLE IF EXISTS jsonprepare.chart_sex;
CREATE TABLE jsonprepare.chart_sex
(
    sex TEXT
);

INSERT INTO jsonprepare.chart_sex (sex)
    (SELECT jsonb_build_object(
                    'labels', array_to_json('{"male", "female", "unknown"}'::TEXT[]),
                    'datasets', jsonb_agg(d)
                )
     FROM jsonprepare.sex d);

UPDATE jsonprepare.chart_sex
SET sex = REPLACE(sex, '"[', '[');
UPDATE jsonprepare.chart_sex
SET sex = REPLACE(sex, ']"', ']');

UPDATE jsonprepare.chart_data
SET sex = (SELECT sex::JSONB FROM jsonprepare.chart_sex);

--age at death estimation for boxplot/violin plot
DROP TABLE IF EXISTS jsonprepare.ageatdeath;
CREATE TABLE jsonprepare.ageatdeath AS (
SELECT 	ar.sitename,
	jsonb_build_object(
		'name', ar.sitename,
		'min', ar.min,
		'max', ar.max,
		'avg', ar.avg) FROM

(SELECT
	sitename,
	array_agg(agemin) AS min,
	array_agg(agemax) AS max,
	array_agg(average) AS avg
	FROM

(SELECT
	a.sitename,
	(((a.age::jsonb)->0)::text)::double precision AS agemin,
	(((a.age::jsonb)->1)::text)::double precision AS agemax,
	(((((a.age::jsonb)->0)::text)::double precision) + ((((a.age::jsonb)->1)::text)::double precision))/2 AS average
FROM

(SELECT
	s.child_name AS sitename,
	t.description AS age
	FROM
	jsonprepare.sites s
	JOIN jsonprepare.graves g ON s.child_id = g.parent_id
	JOIN jsonprepare.burials b ON b.parent_id = g.child_id
	JOIN jsonprepare.types t ON t.entity_id = b.child_id
	WHERE t.path LIKE '%> Age%'
	ORDER BY sitename) AS a) age GROUP BY sitename) ar)




