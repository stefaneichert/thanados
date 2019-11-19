

--files
DROP TABLE IF EXISTS thanados.files;
CREATE TABLE thanados.files AS
SELECT entities.child_id AS parent_id,
       entity.name,
       entity.id
FROM thanados.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entities.child_id != 0
  AND entity.system_type ~~ 'file'::text
ORDER BY entities.child_id;

DROP TABLE IF EXISTS thanados.filestmp;
CREATE TABLE thanados.filestmp AS
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
                             LEFT JOIN thanados.types_all t ON t.id = license.range_id
                    WHERE t.name_path LIKE 'License%') AS lic
                       RIGHT JOIN thanados.files f ON f.id = lic.domain_id) as files
              LEFT JOIN model.link fl ON files.id = fl.range_id
              LEFT JOIN model.entity fe ON fl.domain_id = fe.id);


DROP TABLE thanados.files;
CREATE TABLE thanados.files AS
    (SELECT *
     FROM thanados.filestmp);


--references
DROP TABLE IF EXISTS thanados.reference;
CREATE TABLE thanados.reference AS
SELECT entities.child_id  AS parent_id,
       entity.name        as abbreviation,
       entity.description AS title,
       link.description   AS reference,
       entity.id
FROM thanados.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entities.child_id != 0
  AND entity.system_type ~~ 'bibliography'::text
ORDER BY entities.child_id;


UPDATE thanados.reference
SET abbreviation = NULL
WHERE abbreviation = '';
UPDATE thanados.reference
SET title = NULL
WHERE title = '';
UPDATE thanados.reference
SET reference = NULL
WHERE reference = '';

--external references/urls
DROP TABLE IF EXISTS thanados.extrefs;
CREATE TABLE thanados.extrefs AS
SELECT entities.child_id  AS parent_id,
       entity.name        as url,
       link.description   AS name,
       entity.description AS description,
       entity.id
FROM thanados.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entities.child_id != 0
  AND entity.system_type ~~ 'external reference'::text
ORDER BY entities.child_id;


UPDATE thanados.extrefs
SET description = NULL
WHERE description = '';
UPDATE thanados.extrefs
SET name = NULL
WHERE name = '';

-- create table with types and files of all entities
DROP TABLE IF EXISTS thanados.types_and_files;
CREATE TABLE thanados.types_and_files
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
INSERT INTO thanados.types_and_files (entity_id, types)
SELECT e.child_id, types
FROM thanados.entities e
         LEFT JOIN
     (SELECT t.entity_id,
             jsonb_agg(jsonb_build_object(
                     'id', t.id,
                     'name', t.name,
                     'description', t.description,
                     'value', t.value,
                     'path', t.path)) AS types
      FROM thanados.types t
      GROUP BY entity_id) AS irgendwas
     ON e.child_id = irgendwas.entity_id WHERE e.child_id != 0;


-- insert file data
UPDATE thanados.types_and_files
SET files = (SELECT files
             FROM (
                      SELECT e.child_id, files
                      FROM thanados.entities e
                               INNER JOIN
                           (SELECT t.parent_id,
                                   jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                                           'id', t.id,
                                           'name', t.name,
                                           'license', t.license,
                                           'source', t.source,
                                           'reference', t.reference
                                       ))) AS files
                            FROM thanados.files t
                            GROUP BY parent_id) AS irgendwas
                           ON e.child_id = irgendwas.parent_id) f
             WHERE entity_id = f.child_id);


-- insert bibliography data
UPDATE thanados.types_and_files
SET reference = (SELECT reference
                 FROM (
                          SELECT e.child_id, reference
                          FROM thanados.entities e
                                   INNER JOIN
                               (SELECT t.parent_id,
                                       jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                                               'id', t.id,
                                               'abbreviation', t.abbreviation,
                                               'title', t.title,
                                               'reference', t.reference
                                           ))) AS reference
                                FROM thanados.reference t
                                GROUP BY parent_id) AS irgendwas
                               ON e.child_id = irgendwas.parent_id) f
                 WHERE entity_id = f.child_id);

--insert external refs data
UPDATE thanados.types_and_files
SET extrefs = extref
FROM (
         SELECT e.child_id, extref
         FROM thanados.entities e
                  INNER JOIN
              (SELECT t.parent_id,
                      jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                              'id', t.id,
                              'url', t.url,
                              'name', t.name,
                              'description', t.description
                          ))) AS extref
               FROM thanados.extrefs t
               GROUP BY parent_id) AS irgendwas
              ON e.child_id = irgendwas.parent_id) f
WHERE entity_id = f.child_id;

-- insert dimension data
UPDATE thanados.types_and_files
SET dimensions = dimtypes
FROM (
         SELECT e.child_id, dimtypes
         FROM thanados.entities e
                  INNER JOIN
              (SELECT t.entity_id,
                      jsonb_agg(jsonb_build_object(
                              'id', t.id,
                              'name', t.name,
                              'value', t.value,
                              'path', t.path)) AS dimtypes
               FROM thanados.dimensiontypes t
               GROUP BY entity_id) AS irgendwas
              ON e.child_id = irgendwas.entity_id) f
WHERE entity_id = f.child_id;

-- insert material data
UPDATE thanados.types_and_files
SET material = mattypes
FROM (
         SELECT e.child_id, mattypes
         FROM thanados.entities e
                  INNER JOIN
              (SELECT t.entity_id,
                      jsonb_agg(jsonb_build_object(
                              'id', t.id,
                              'name', t.name,
                              'value', t.value,
                              'path', t.path)) AS mattypes
               FROM thanados.materialtypes t
               GROUP BY entity_id) AS irgendwas
              ON e.child_id = irgendwas.entity_id) f
WHERE entity_id = f.child_id;


-- insert timespan data
UPDATE thanados.types_and_files
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
         FROM thanados.entities f) AS irgendwas
WHERE entity_id = irgendwas.child_id;


--temp table with all info
DROP TABLE IF EXISTS thanados.tmp;
CREATE TABLE thanados.tmp AS
    (SELECT *
     FROM thanados.entities e
              LEFT JOIN thanados.types_and_files t ON e.child_id = t.entity_id ORDER BY parent_id, child_name);

UPDATE thanados.tmp
SET timespan = NULL
WHERE timespan = '{}';
UPDATE thanados.tmp
SET description = NULL
WHERE description = '';
UPDATE thanados.tmp
SET begin_comment = NULL
WHERE begin_comment = '';
UPDATE thanados.tmp
SET end_comment = NULL
WHERE end_comment = '';
UPDATE thanados.tmp SET description = (SELECT split_part(description, '##German', 1)); --hack to remove German descriptions
UPDATE thanados.tmp SET description = (SELECT split_part(description, '##Deutsch', 1)); --hack to remove German descriptions


---finds json
DROP TABLE IF EXISTS thanados.tbl_finds;
CREATE TABLE thanados.tbl_finds
(
    id         integer,
    parent_id  integer,
    properties jsonb,
    files      jsonb
);

INSERT INTO thanados.tbl_finds (id, parent_id, files, properties)
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
FROM (SELECT * FROM thanados.tmp WHERE system_type LIKE 'find') f
ORDER BY f.child_name;



DROP TABLE IF EXISTS thanados.tbl_findscomplete;
CREATE TABLE thanados.tbl_findscomplete
(
    id        integer,
    parent_id integer,
    find      jsonb
);

INSERT INTO thanados.tbl_findscomplete (id, parent_id, find)
SELECT id,
       parent_id,
       jsonb_strip_nulls(jsonb_build_object(
               'id', f.id,
               'properties', f.properties,
               'files', f.files
           )) AS finds
FROM thanados.tbl_finds f;
--ORDER BY f.properties -> 'name' asc;


--burial
DROP TABLE IF EXISTS thanados.tbl_burials;
CREATE TABLE thanados.tbl_burials
(
    id         integer,
    parent_id  integer,
    properties jsonb,
    finds      jsonb,
    files      jsonb
);

INSERT INTO thanados.tbl_burials (id, parent_id, files, properties, finds)
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
FROM (SELECT * FROM thanados.tmp WHERE system_type LIKE 'stratigraphic unit') f
         LEFT JOIN thanados.tbl_findscomplete fi ON f.child_id = fi.parent_id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.typename, f.path,
         f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files, f.system_type, f.reference, f.extrefs
ORDER BY f.child_name;

UPDATE thanados.tbl_burials f
SET finds = NULL
WHERE f.finds = '[null]';

DROP TABLE IF EXISTS thanados.tbl_burialscomplete;
CREATE TABLE thanados.tbl_burialscomplete
(
    id        integer,
    parent_id integer,
    burial    jsonb
);

INSERT INTO thanados.tbl_burialscomplete (id, parent_id, burial)
SELECT id,
       parent_id,
       jsonb_strip_nulls(jsonb_build_object(
               'id', f.id,
               'properties', f.properties,
               'files', f.files,
               'finds', f.finds
           )) AS burials
FROM thanados.tbl_burials f;
--ORDER BY f.properties -> 'name' asc;

--graves
DROP TABLE IF EXISTS thanados.tbl_graves;
CREATE TABLE thanados.tbl_graves
(
    id         integer,
    parent_id  integer,
    name       text,
    geom       jsonb,
    properties jsonb,
    files      jsonb,
    burials    jsonb
);

INSERT INTO thanados.tbl_graves (id, parent_id, name, files, geom, properties, burials)
SELECT f.child_id,
       f.parent_id,
       f.child_name,
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
FROM (SELECT * FROM thanados.tmp WHERE system_type LIKE 'feature') f
         LEFT JOIN thanados.tbl_burialscomplete fi ON f.child_id = fi.parent_id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
         f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files,
         f.system_type
ORDER BY f.child_name;

UPDATE thanados.tbl_graves f
SET burials = NULL
WHERE f.burials = '[
  null
]';

UPDATE thanados.tbl_graves f
SET burials = NULL
WHERE id = 0;


DROP TABLE IF EXISTS thanados.tbl_gravescomplete;
CREATE TABLE thanados.tbl_gravescomplete
(
    id        integer,
    parent_id integer,
    name      text,
    grave     jsonb
);

INSERT INTO thanados.tbl_gravescomplete (id, parent_id, name, grave)
SELECT id,
       parent_id,
       name,
       jsonb_strip_nulls(jsonb_build_object(
               'type', 'Feature',
               'geometry', f.geom,
               'id', f.id,
               'parent', f.parent_id,
               'properties', f.properties,
               'files', f.files,
               'burials', f.burials
           )) AS graves
FROM thanados.tbl_graves f
ORDER BY f.parent_id, f.name;

-- get data for sites
DROP TABLE IF EXISTS thanados.tbl_sites;
CREATE TABLE thanados.tbl_sites
(
    id      integer,
    name    text,
    polygon text,
    point   text
);

INSERT INTO thanados.tbl_sites (id, name)
SELECT child_id,
       child_name
FROM thanados.sites;

UPDATE thanados.tbl_sites
SET polygon = geom
FROM (SELECT ST_AsGeoJSON(geom) AS geom,
             domain_id
      FROM gis.polygon p
               JOIN model.link l ON p.entity_id = l.range_id) g
WHERE thanados.tbl_sites.id = g.domain_id;

UPDATE thanados.tbl_sites
SET point = geom
FROM (SELECT ST_AsGeoJSON(geom) AS geom,
             domain_id
      FROM gis.point p
               JOIN model.link l ON p.entity_id = l.range_id) g
WHERE thanados.tbl_sites.id = g.domain_id;


DROP TABLE IF EXISTS thanados.tbl_sitescomplete;
CREATE TABLE thanados.tbl_sitescomplete
(
    id         integer,
    name       text,
    properties jsonb
);
INSERT INTO thanados.tbl_sitescomplete (id, name, properties)
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
FROM (SELECT * FROM thanados.tmp WHERE system_type LIKE 'place') f
         LEFT JOIN thanados.tbl_sites s ON f.child_id = s.id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
         f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files,
         f.system_type, s.id, s.name,
         s.point, s.polygon
ORDER BY f.child_name;


DROP TABLE IF EXISTS thanados.tbl_thanados_data;
CREATE TABLE thanados.tbl_thanados_data
(
    id   integer,
    name text,
    data jsonb
);

INSERT INTO thanados.tbl_thanados_data (id, name, data)
SELECT s.id   AS id,
       s.name AS name,
       (jsonb_strip_nulls(jsonb_build_object(
               'type', 'FeatureCollection',
               'site_id', s.id,
               'name', s.name,
               'properties', s.properties,
               'features', jsonb_strip_nulls(jsonb_agg(f.grave ORDER BY f.name))
           )))
FROM thanados.tbl_sitescomplete s
         LEFT JOIN (SELECT * FROM thanados.tbl_gravescomplete ORDER BY parent_id, name) f
                   ON s.id = f.parent_id
GROUP BY s.id, s.name, s.properties;


-- create table with all types for json
DROP TABLE IF EXISTS thanados.typesforjson;
CREATE TABLE thanados.typesforjson AS
SELECT DISTINCT 'type' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE --set types to display in jstree
    name_path LIKE 'Anthropology%'
   OR name_path LIKE 'Grave Construction%'
   OR name_path LIKE 'Grave Shape%'
   OR name_path LIKE 'Position of Find in Grave%'
   OR name_path LIKE 'Sex%'
   OR name_path LIKE 'Stylistic Classification%'
UNION ALL
SELECT DISTINCT 'dimensions' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE 'Dimensions%'
UNION ALL
SELECT DISTINCT 'material' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE 'Material%'
UNION ALL
SELECT DISTINCT 'find' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE 'Find >%'
UNION ALL
SELECT DISTINCT 'strat' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE 'Stratigraphic Unit%'
UNION ALL
SELECT DISTINCT 'feature' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE 'Feature%'

ORDER BY level, name_path;

UPDATE thanados.typesforjson
SET parent = '#'
WHERE parent ISNULL; --necessary for jstree
INSERT INTO thanados.typesforjson (level, id, text, parent, path, name_path)
VALUES ('find', '13368', 'Find', '#', '13368', 'Find');
--hack because find has no parent

-- create table with all types as json
DROP TABLE IF EXISTS thanados.typesjson;
CREATE TABLE thanados.typesjson AS (
    SELECT jsonb_agg(jsonb_build_object('id', id,
                                        'text', text,
                                        'parent', parent,
                                        'namepath', name_path,
                                        'path', path,
                                        'level', level
        )) as types
    FROM (SELECT *
          FROM thanados.typesforjson AS types
          GROUP BY types.level, types.id, types.text, types.parent, types.name_path, types.path
          ORDER BY name_path) as u);


-- prepare data for charts
DROP TABLE IF EXISTS thanados.depth_labels;
CREATE TABLE thanados.depth_labels AS (
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
                                  FROM thanados.tbl_sites s
                                           JOIN thanados.graves g ON g.parent_id = s.id
                                           JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
                                  WHERE d.name = 'Height'
                              ) v

                         group BY parent_id, site_name
                     ) c
                LIMIT 1) AS ok) AS js);

--get values
DROP TABLE IF EXISTS thanados.depth;
CREATE TABLE thanados.depth AS (
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
             FROM thanados.tbl_sites s
                      JOIN thanados.graves g ON g.parent_id = s.id
                      JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
             WHERE d.name = 'Height'
         ) v

    GROUP BY parent_id, site_name);


DROP TABLE IF EXISTS thanados.chart_data;
CREATE TABLE thanados.chart_data
(
    depth       JSONB,
    orientation JSONB,
    sex         JSONB
);


DROP TABLE IF EXISTS thanados.chart_depth;
CREATE TABLE thanados.chart_depth
(
    depth TEXT
);
INSERT INTO thanados.chart_depth (depth)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM thanados.depth_labels dl,
     thanados.depth d
GROUP BY dl.labels;

UPDATE thanados.chart_depth
SET depth = REPLACE(depth, '"[', '[');
UPDATE thanados.chart_depth
SET depth = REPLACE(depth, ']"', ']');

INSERT INTO thanados.chart_data (depth)
SELECT depth::JSONB
FROM thanados.chart_depth;


DROP TABLE IF EXISTS thanados.orientation_labels;
CREATE TABLE thanados.orientation_labels AS (
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
                                  FROM thanados.tbl_sites s
                                           JOIN thanados.graves g ON g.parent_id = s.id
                                           JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
                                  WHERE d.name = 'Degrees'
                              ) v

                         group BY parent_id, site_name
                     ) c
                LIMIT 1) AS ok) AS js);

--get values
DROP TABLE IF EXISTS thanados.orientation;
CREATE TABLE thanados.orientation AS (
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
             FROM thanados.tbl_sites s
                      JOIN thanados.graves g ON g.parent_id = s.id
                      JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
             WHERE d.name = 'Degrees'
         ) v

    GROUP BY parent_id, site_name);



DROP TABLE IF EXISTS thanados.chart_orientation;
CREATE TABLE thanados.chart_orientation
(
    orientation TEXT
);
INSERT INTO thanados.chart_orientation (orientation)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM thanados.orientation_labels dl,
     thanados.orientation d
GROUP BY dl.labels;

UPDATE thanados.chart_orientation
SET orientation = REPLACE(orientation, '"[', '[');
UPDATE thanados.chart_orientation
SET orientation = REPLACE(orientation, ']"', ']');

UPDATE thanados.chart_data
SET orientation = (SELECT orientation::JSONB FROM thanados.chart_orientation);

DROP TABLE IF EXISTS thanados.sex;
CREATE TABLE thanados.sex AS (
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
             FROM thanados.tbl_sites s
                      JOIN thanados.graves g ON g.parent_id = s.id
                      JOIN thanados.burials b ON g.child_id = b.parent_id
                      JOIN thanados.types d ON b.child_id = d.entity_id
             WHERE d.path LIKE 'Sex%') s
             JOIN (
        SELECT g.parent_id        AS site_id,
               count(g.parent_id) AS burialcount
        FROM thanados.tbl_sites s
                 JOIN thanados.graves g ON g.parent_id = s.id
                 JOIN thanados.burials b ON g.child_id = b.parent_id
        GROUP by g.parent_id
    ) bc ON s.parent_id = bc.site_id
    GROUP BY site_name, parent_id, burialcount);

DROP TABLE IF EXISTS thanados.chart_sex;
CREATE TABLE thanados.chart_sex
(
    sex TEXT
);

INSERT INTO thanados.chart_sex (sex)
    (SELECT jsonb_build_object(
                    'labels', array_to_json('{"male", "female", "unknown"}'::TEXT[]),
                    'datasets', jsonb_agg(d)
                )
     FROM thanados.sex d);

UPDATE thanados.chart_sex
SET sex = REPLACE(sex, '"[', '[');
UPDATE thanados.chart_sex
SET sex = REPLACE(sex, ']"', ']');

UPDATE thanados.chart_data
SET sex = (SELECT sex::JSONB FROM thanados.chart_sex);

--age at death estimation for boxplot/violin plot
DROP TABLE IF EXISTS thanados.ageatdeath;
CREATE TABLE thanados.ageatdeath AS (
    SELECT ar.sitename,
           jsonb_build_object(
                   'name', ar.sitename,
                   'min', ar.min,
                   'max', ar.max,
                   'avg', ar.avg) AS age
    FROM (SELECT sitename,
                 array_agg(agemin)  AS min,
                 array_agg(agemax)  AS max,
                 array_agg(average) AS avg
          FROM (SELECT a.sitename,
                       (((a.age::jsonb) -> 0)::text)::double precision         AS agemin,
                       (((a.age::jsonb) -> 1)::text)::double precision         AS agemax,
                       (((((a.age::jsonb) -> 0)::text)::double precision) +
                        ((((a.age::jsonb) -> 1)::text)::double precision)) / 2 AS average
                FROM (SELECT s.child_name  AS sitename,
                             t.description AS age
                      FROM thanados.sites s
                               JOIN thanados.graves g ON s.child_id = g.parent_id
                               JOIN thanados.burials b ON b.parent_id = g.child_id
                               JOIN thanados.types t ON t.entity_id = b.child_id
                      WHERE t.path LIKE '%> Age%'
                      ORDER BY sitename) AS a) age
          GROUP BY sitename) ar);