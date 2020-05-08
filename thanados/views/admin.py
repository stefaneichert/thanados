from flask import render_template, g, url_for, abort
from flask_login import login_required, current_user
from werkzeug.utils import redirect

from thanados import app
from thanados.models.entity import Data


@app.route('/admin/')
@login_required
def admin():  # pragma: no cover
    if current_user.group not in ['admin']:
        abort(403)
    return render_template('admin/index.html')


@app.route('/admin/execute/')
@login_required
def jsonprepare_execute():  # pragma: no cover
    if current_user.group not in ['admin']:
        abort(403)

    sql_1 = """ 
DROP SCHEMA IF EXISTS thanados CASCADE;

CREATE SCHEMA thanados;
-- create temp tables

-- all types tree
DROP TABLE IF EXISTS thanados.types_all;
CREATE TABLE thanados.types_all AS
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
DROP TABLE IF EXISTS thanados.sites;
CREATE TABLE thanados.sites AS (
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
           NULL::TEXT    as geom,
           NULL::TEXT as lon,
           NULL::TEXT as lat
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
            )
             AS s
             JOIN thanados.types_all t ON t.id = s.range_id
    WHERE t.name_path LIKE 'Place > Burial Site%' -- replace Burial Site with the top parent of the place category of which you want to show
);

-- set polygons as main geometry where available
UPDATE thanados.sites
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;

-- get centerpoint data if a point geometry is available
UPDATE thanados.sites
SET (lat, lon) = (ST_X(point.geom), ST_Y(point.geom))
FROM (SELECT geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id;

-- set point as main geometry if no polygon is available
UPDATE thanados.sites
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id
  AND thanados.sites.geom ISNULL;

-- get centerpoint data of polygons
UPDATE thanados.sites
SET (lat, lon) = (ST_X(center), ST_Y(center))
FROM (SELECT ST_PointOnSurface(geom) AS center,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;


-- graves table with all data on grave level
DROP TABLE IF EXISTS thanados.graves;
CREATE TABLE thanados.graves AS
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
       NULL::TEXT                                   as geom,
       NULL::TEXT as lon,
       NULL::TEXT as lat
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM thanados.sites)
  AND l_p_c.property_code = 'P46'
ORDER BY child.system_type, parent.id, child.name;

-- if no graves are available create an intermediate feature to be displayed on the map
INSERT INTO thanados.graves (
SELECT
    child_id AS parent_id,
    child_name,
    '0' AS child_id,
    description,
    begin_from,
    begin_to,
    begin_comment,
    end_from,
    end_to,
    end_comment,
    'feature' AS system_type,
    geom,
    NULL as lon,
    NULL as lat
     FROM thanados.sites WHERE child_id NOT IN (SELECT DISTINCT parent_id FROM thanados.graves));

UPDATE thanados.graves
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;

UPDATE thanados.graves
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id
  AND thanados.graves.geom ISNULL;

--UPDATE thanados.graves g
--SET geom = a.geom
--FROM (SELECT s.child_id, s.geom FROM thanados.sites s JOIN thanados.graves g ON g.parent_id = s.child_id WHERE g.geom IS NULL) a WHERE a.child_id = g.parent_id AND g.geom IS NULL;

--burials
DROP TABLE IF EXISTS thanados.burials;
CREATE TABLE thanados.burials AS
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
       NULL::TEXT                                   as geom,
       NULL::TEXT as lon,
       NULL::TEXT as lat
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM thanados.graves)
  AND l_p_c.property_code = 'P46'
ORDER BY child.system_type, parent.id, child.name;


UPDATE thanados.burials
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;

UPDATE thanados.burials
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id
  AND thanados.burials.geom ISNULL;

--finds
DROP TABLE IF EXISTS thanados.finds;
CREATE TABLE thanados.finds AS
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
       NULL::TEXT                                   as geom,
       NULL::TEXT as lon,
       NULL::TEXT as lat
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM thanados.burials)
  AND l_p_c.property_code = 'P46'
ORDER BY child.system_type, parent.id, child.name;


UPDATE thanados.finds
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;

UPDATE thanados.finds
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id
  AND thanados.finds.geom ISNULL;

-- all entities union
CREATE TABLE thanados.entitiestmp AS
SELECT *
FROM thanados.sites
UNION ALL
SELECT *
FROM thanados.graves
UNION ALL
SELECT *
FROM thanados.burials
UNION ALL
SELECT *
FROM thanados.finds
ORDER BY parent_id, child_name;

UPDATE thanados.entitiestmp
SET begin_comment = NULL
WHERE begin_comment = '';
UPDATE thanados.entitiestmp
SET end_comment = NULL
WHERE end_comment = '';
UPDATE thanados.entitiestmp
SET description = NULL
WHERE description = '';
UPDATE thanados.entitiestmp
SET description = (SELECT split_part(description, '##German', 1)); --remove German descriptions. Replace ##German with characters of string. This string and the following characters will be removed in the description
UPDATE thanados.entitiestmp
SET description = (SELECT split_part(description, '##Deutsch', 1)); --remove German descriptions. See above
-- fill timespan dates if NULL with from_values
UPDATE thanados.entitiestmp SET begin_to = begin_from WHERE begin_from IS NOT NULL and begin_to IS NULL;
UPDATE thanados.entitiestmp SET begin_from = begin_to WHERE begin_to IS NOT NULL and begin_from IS NULL;
UPDATE thanados.entitiestmp SET end_to = end_from WHERE end_from IS NOT NULL and end_to IS NULL;
UPDATE thanados.entitiestmp SET end_from = end_to WHERE end_to IS NOT NULL and end_from IS NULL;


--types
DROP TABLE IF EXISTS thanados.types_main;
CREATE TABLE thanados.types_main AS
SELECT DISTINCT types_all.id,
                types_all.parent_id,
                entitiestmp.child_id AS entity_id,
                types_all.name,
                types_all.description,
                link.description     AS value,
                types_all.name_path  AS path
FROM thanados.types_all,
     thanados.entitiestmp,
     model.link
WHERE entitiestmp.child_id = link.domain_id
  AND link.range_id = types_all.id
  AND thanados.entitiestmp.child_id != 0
ORDER BY entity_id, types_all.name_path;

UPDATE thanados.types_main
SET description = NULL
WHERE description = '';

--types main
DROP TABLE IF EXISTS thanados.maintype;
CREATE TABLE thanados.maintype AS
SELECT *
FROM thanados.types_main
WHERE path LIKE 'Place >%'
   OR path LIKE 'Feature >%'
   OR path LIKE 'Stratigraphic Unit >%'
   OR path LIKE 'Find >%'
ORDER BY entity_id, path;

--types dimensions
DROP TABLE IF EXISTS thanados.dimensiontypes;
CREATE TABLE thanados.dimensiontypes AS
SELECT *
FROM thanados.types_main
WHERE path LIKE 'Dimensions >%'
ORDER BY entity_id, path;

-- HACK: set orientation of grave to burial because some did enter the orientation on the grave level and not at the burial level
DROP TABLE IF EXISTS thanados.graveDeg;
CREATE TABLE thanados.graveDeg AS
SELECT 
	d.*,
	e.system_type,
	b.child_id AS burial_id
	FROM thanados.dimensiontypes d JOIN model.entity e ON d.entity_id = e.id JOIN thanados.burials b ON e.id = b.parent_id WHERE d.id = 26192 AND b.child_id NOT IN 
		(SELECT 
			d.entity_id
			FROM thanados.dimensiontypes d JOIN model.entity e ON d.entity_id = e.id JOIN thanados.burials b ON e.id = b.child_id WHERE d.id = 26192);

INSERT INTO thanados.dimensiontypes SELECT id, parent_id, burial_id, name, description, value, path FROM thanados.graveDeg;

DROP EXTENSION IF EXISTS postgis_sfcgal;
CREATE EXTENSION postgis_sfcgal;
DROP TABLE IF EXISTS thanados.giscleanup2;
CREATE TABLE thanados.giscleanup2 AS
 (
SELECT 	e.system_type,
	e.child_name,
	e.parent_id,
	e.child_id,
	l.property_code,
	l.range_id,
	g.id,
	g.geom
	FROM thanados.graves e JOIN model.link l ON e.child_id = l.domain_id JOIN gis.polygon g ON l.range_id = g.entity_id WHERE l.property_code = 'P53');



-- Get azimuth of grave if a polygon is known and  
DROP TABLE IF EXISTS thanados.derivedDeg;
CREATE TABLE thanados.derivedDeg AS
(SELECT 
    ST_X(startP) AS onePoint,
    ST_X(endP) AS otherPoint,
	degrees(ST_Azimuth(startP, endP)) AS degA_B,
	degrees(ST_Azimuth(endP, startP)) AS degB_A,
	child_id FROM
(SELECT 
	ST_StartPoint(ST_LineMerge(ST_ApproximateMedialAxis(ST_OrientedEnvelope(g.geom)))) AS startP,
	ST_EndPoint(ST_LineMerge(ST_ApproximateMedialAxis(ST_OrientedEnvelope(g.geom)))) AS endP,
	ST_AsText(ST_ApproximateMedialAxis(ST_OrientedEnvelope(g.geom))), child_id FROM thanados.giscleanup2 g WHERE system_type = 'feature') p);

-- get lower value of azimuth
DROP TABLE IF EXISTS thanados.azimuth;
CREATE TABLE thanados.azimuth AS (
SELECT 
	g.*,
	g.degA_B::integer AS Azimuth
	FROM thanados.derivedDeg g WHERE degA_B <= degB_A
UNION ALL
	SELECT 
	g.*,
	g.degB_A::integer AS Azimuth
	FROM thanados.derivedDeg g WHERE degB_A <= degA_B);
	
--insert azimuth into dimensiontypes
INSERT INTO thanados.dimensiontypes 
    SELECT
        118730,
        15678,
        child_id,
        'Azimuth',
        '°',
        Azimuth::integer,
        'Dimensions > Azimuth'
        FROM thanados.azimuth;
         

--hack for setting burial orientation to grave orientation if grave does not have any. Comment/Uncomment depending on your preferences
/*INSERT INTO thanados.dimensiontypes (id, parent_id, entity_id, name, description, value, path)
SELECT id, 15678, domain, name, description, orientation::Text, path FROM
(SELECT
26192 AS id,
    l.domain,
             l.range,
             l.name,
             '°' as description,
             'Dimensions > Degrees' as path,
             l.orientation:: double precision
      FROM (SELECT g.child_id AS DOMAIN,
                   d.value    AS orientation,
                   d.name,
                   d.id       AS range
            FROM thanados.graves g
                     JOIN thanados.burials b ON g.child_id = b.parent_id
                     JOIN thanados.dimensiontypes d ON b.child_id = d.entity_id
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
             FROM thanados.burials
             GROUP BY parent_id) c
       WHERE c.count > 1);*/
       
       
--hack for getting graves azimuth from polygon orientation. Comment/Uncomment depending on your preferences
/*INSERT INTO thanados.dimensiontypes (id, parent_id, entity_id, name, description, value, path)
SELECT id, 15678, domain, name, description, orientation::Text, path FROM
(SELECT
26192 AS id,
    l.domain,
             l.range,
             l.name,
             '°' as description,
             'Dimensions > Degrees' as path,
             l.orientation:: double precision
      FROM (SELECT g.child_id AS DOMAIN,
                   d.value    AS orientation,
                   d.name,
                   d.id       AS range
            FROM thanados.graves g
                     JOIN thanados.burials b ON g.child_id = b.parent_id
                     JOIN thanados.dimensiontypes d ON b.child_id = d.entity_id
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
             FROM thanados.burials
             GROUP BY parent_id) c
       WHERE c.count > 1);*/


--types material
DROP TABLE IF EXISTS thanados.materialtypes;
CREATE TABLE thanados.materialtypes AS
SELECT *
FROM thanados.types_main
WHERE path LIKE 'Material >%'
ORDER BY entity_id, path;


--other types
DROP TABLE IF EXISTS thanados.types;
CREATE TABLE thanados.types AS
SELECT *
FROM thanados.types_main
WHERE path NOT LIKE 'Dimensions >%'
  AND path NOT LIKE 'Place >%'
  AND path NOT LIKE 'Feature >%'
  AND path NOT LIKE 'Stratigraphic Unit >%'
  AND path NOT LIKE 'Find >%'
  AND path NOT LIKE 'Material >%'
ORDER BY entity_id, path;

--entities with maintypes
CREATE TABLE thanados.entities AS
SELECT e.*,
       t.id        AS type_id,
       t.parent_id AS parenttype_id,
       t.name      AS typename,
       t.path
FROM thanados.entitiestmp e
         LEFT JOIN thanados.maintype t ON e.child_id = t.entity_id;

--update timespan where values are missing
UPDATE thanados.entities
SET begin_to = begin_from
WHERE begin_to IS NULL;
UPDATE thanados.entities
SET end_to = end_from
WHERE end_to IS NULL;
            """
    g.cursor.execute(sql_1)

    sql_2 = """
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
        NULL::TEXT AS filename,
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
    """
    g.cursor.execute(sql_2)

    sql_3 = 'SELECT id FROM thanados.files'
    g.cursor.execute(sql_3)
    result = g.cursor.fetchall()
    for row in result:
        file_name = (Data.get_file_path(row.id))
        row_id = (row.id)
        g.cursor.execute("UPDATE thanados.files SET filename = %(file_name)s WHERE id = %(row_id)s",
                         {'file_name': file_name, 'row_id': row_id})

    g.cursor.execute('DELETE FROM thanados.files WHERE filename = NULL')

    sql_4 = """
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

INSERT INTO thanados.extrefs 
SELECT entities.child_id  AS parent_id,
       'https://www.geonames.org/' || entity.name  as url,
       link.description   AS name,
       entity.description AS description,
       entity.id
FROM thanados.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entities.child_id != 0
  AND entity.system_type ~~ 'external reference geonames'::text
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
                                           'file_name', t.filename,
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
                              'unit', t.description,
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

UPDATE thanados.tbl_sites
SET point = geom
FROM (SELECT ST_AsGeoJSON(ST_PointOnSurface(geom)) AS geom,
             domain_id
      FROM gis.polygon p
               JOIN model.link l ON p.entity_id = l.range_id) g
WHERE thanados.tbl_sites.id = g.domain_id AND tbl_sites.point ISNULL;

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
SELECT DISTINCT 'value' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE 'Body Height%' OR
name_path LIKE 'Isotopic Analyses%' OR
name_path LIKE 'Absolute Age%'
UNION ALL
SELECT DISTINCT 'find' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE 'Find >%'
UNION ALL
SELECT DISTINCT 'strat' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE 'Stratigraphic Unit%'
UNION ALL
SELECT DISTINCT 'burial_site' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE '%Burial Site%'
UNION ALL
SELECT DISTINCT 'feature' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path
FROM thanados.types_all
WHERE name_path LIKE 'Feature%'

ORDER BY level, name_path;

UPDATE thanados.typesforjson
SET parent = '#'
WHERE parent ISNULL; --necessary for jstree
UPDATE thanados.typesforjson
SET parent = '#'
WHERE parent = '73'; --necessary for jstree
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
    azimuth     JSONB,
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
CREATE TABLE thanados.chart_orientation(orientation TEXT);
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

DROP TABLE IF EXISTS thanados.azimuth_labels;
CREATE TABLE thanados.azimuth_labels AS (
-- get labels for azimuth of graves
    SELECT jsonb_agg(js.json_object_keys)
               AS labels
    FROM (SELECT json_object_keys(row_to_json)
          FROM (SELECT row_to_json(c.*)
                FROM (
                         SELECT count(*) FILTER (WHERE VALUE <= 10)                  AS "0-10",
                                count(*) FILTER (WHERE VALUE > 10 AND VALUE <= 20)   AS "10-20",
                                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 30)   AS "20-30",
                                count(*) FILTER (WHERE VALUE > 30 AND VALUE <= 40)   AS "30-40",
                                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 50)   AS "40-50",
                                count(*) FILTER (WHERE VALUE > 50 AND VALUE <= 60)   AS "50-60",
                                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 70)   AS "60-70",
                                count(*) FILTER (WHERE VALUE > 70 AND VALUE <= 80)   AS "70-80",
                                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 90)   AS "80-90",
                                count(*) FILTER (WHERE VALUE > 90 AND VALUE <= 100)  AS "90-100",
                                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 110) AS "100-110",
                                count(*) FILTER (WHERE VALUE > 110 AND VALUE <= 120) AS "110-120",
                                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 130) AS "120-130",
                                count(*) FILTER (WHERE VALUE > 130 AND VALUE <= 140) AS "130-140",
                                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 150) AS "140-150",
                                count(*) FILTER (WHERE VALUE > 150 AND VALUE <= 160) AS "150-160",
                                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 170) AS "160-170",                                
                                count(*) FILTER (WHERE VALUE > 170 AND VALUE <= 180) AS "170-180"                                
                         FROM (
                                  SELECT g.parent_id,
                                         s.name AS site_name,
                                         d.value::double precision
                                  FROM thanados.tbl_sites s
                                           JOIN thanados.graves g ON g.parent_id = s.id
                                           JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
                                  WHERE d.name = 'Azimuth'
                              ) v

                         group BY parent_id, site_name
                     ) c
                LIMIT 1) AS ok) AS js);

--get values
DROP TABLE IF EXISTS thanados.azimuth;
CREATE TABLE thanados.azimuth AS (
    SELECT parent_id                                                   AS "site_id",
           site_name                                                   AS "label",
           '[' ||
           count(*) FILTER (WHERE VALUE <= 10) || ',' ||
           count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 30) || ',' ||
           count(*) FILTER (WHERE VALUE > 30 AND VALUE <= 40) || ',' ||
           count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 50) || ',' ||
           count(*) FILTER (WHERE VALUE > 50 AND VALUE <= 60) || ',' ||
           count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 70) || ',' ||
           count(*) FILTER (WHERE VALUE > 70 AND VALUE <= 80) || ',' ||
           count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 90) || ',' ||
           count(*) FILTER (WHERE VALUE > 90 AND VALUE <= 100) || ',' ||
           count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 110) || ',' ||
           count(*) FILTER (WHERE VALUE > 110 AND VALUE <= 120) || ',' ||
           count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 130) || ',' ||
           count(*) FILTER (WHERE VALUE > 130 AND VALUE <= 140) || ',' ||
           count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 150) || ',' ||
           count(*) FILTER (WHERE VALUE > 150 AND VALUE <= 160) || ',' ||
           count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 170) || ',' ||
           count(*) FILTER (WHERE VALUE > 170 AND VALUE <= 180) || ']' AS data
    FROM (
             SELECT g.parent_id,
                    s.name AS site_name,
                    d.value::double precision
             FROM thanados.tbl_sites s
                      JOIN thanados.graves g ON g.parent_id = s.id
                      JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
             WHERE d.name = 'Azimuth'
         ) v
    GROUP BY parent_id, site_name);

DROP TABLE IF EXISTS thanados.chart_azimuth;
CREATE TABLE thanados.chart_azimuth(azimuth TEXT);
INSERT INTO thanados.chart_azimuth (azimuth)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM thanados.azimuth_labels dl,
     thanados.azimuth d
GROUP BY dl.labels;

UPDATE thanados.chart_azimuth
SET azimuth = REPLACE(azimuth, '"[', '[');
UPDATE thanados.chart_azimuth
SET azimuth = REPLACE(azimuth, ']"', ']');

UPDATE thanados.chart_data
SET azimuth = (SELECT azimuth::JSONB FROM thanados.chart_azimuth);

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
           ar.site_id,
           jsonb_build_object(
                   'name', ar.sitename,
                   'site_id', ar.site_id,
                   'min', ar.min,
                   'max', ar.max,
                   'avg', ar.avg) AS age
    FROM (SELECT sitename,
         site_id,
                 array_agg(agemin)  AS min,
                 array_agg(agemax)  AS max,
                 array_agg(average) AS avg
          FROM (SELECT a.sitename,
          a.site_id,
                       (((a.age::jsonb) -> 0)::text)::double precision         AS agemin,
                       (((a.age::jsonb) -> 1)::text)::double precision         AS agemax,
                       (((((a.age::jsonb) -> 0)::text)::double precision) +
                        ((((a.age::jsonb) -> 1)::text)::double precision)) / 2 AS average
                FROM (SELECT s.child_name  AS sitename,
                             s.child_id AS site_id,
                             t.description AS age
                      FROM thanados.sites s
                               JOIN thanados.graves g ON s.child_id = g.parent_id
                               JOIN thanados.burials b ON b.parent_id = g.child_id
                               JOIN thanados.types t ON t.entity_id = b.child_id
                      WHERE t.path LIKE '%> Age >%'
                      ORDER BY sitename) AS a) age
          GROUP BY sitename, site_id) ar ORDER BY site_id);
          
    DROP TABLE IF EXISTS thanados.searchData;
    CREATE TABLE thanados.searchData AS
    SELECT e.child_id, e.child_name, 'timespan' AS type, NULL AS path, 0 AS type_id, e.begin_from AS min, e.end_to AS max, e.system_type FROM thanados.entities e WHERE e.child_id != 0
    UNION ALL
    SELECT e.child_id, e.child_name, t.name AS type, t.path AS path, t.id AS type_id, t.value::double precision AS min, t.value::double precision AS max, e.system_type FROM thanados.entities e LEFT JOIN thanados.types_main t ON e.child_id = t.entity_id WHERE e.child_id != 0 ORDER BY child_id;


DROP TABLE IF EXISTS thanados.searchData_tmp;
    CREATE TABLE thanados.searchData_tmp AS (

SELECT 
	se.*,
	mt.path AS maintype,
	f.parent_id AS burial_id,
	b.parent_id AS grave_id,
	g.parent_id AS site_id,
	s.lon,
	s.lat,
	s.child_name || ' > ' || g.child_name || ' > ' || b.child_name || ' > ' || se.child_name AS context

	FROM thanados.searchData se
		JOIN thanados.maintype mt ON se.child_id = mt.entity_id
		JOIN thanados.finds f ON se.child_id = f.child_id 
		JOIN thanados.burials b ON f.parent_id = b.child_id 
		JOIN thanados.graves g ON b.parent_id = g.child_id 
		JOIN thanados.sites s ON g.parent_id = s.child_id 
		WHERE se.system_type = 'find' AND s.lon != ''

UNION ALL		

SELECT 
	se.*,
	mt.path AS maintype,
	se.child_id AS burial_id,
	b.parent_id AS grave_id,
	g.parent_id AS site_id,
	s.lon,
	s.lat,
	s.child_name || ' > ' || g.child_name || ' > ' || b.child_name AS context
	
	FROM thanados.searchData se
		JOIN thanados.maintype mt ON se.child_id = mt.entity_id
		JOIN thanados.burials b ON se.child_id = b.child_id 
		JOIN thanados.graves g ON b.parent_id = g.child_id 
		JOIN thanados.sites s ON g.parent_id = s.child_id 
		WHERE se.system_type = 'stratigraphic unit' AND s.lon != ''

UNION ALL		

SELECT 
	se.*,
	mt.path AS maintype,
	NULL AS burial_id,
	se.child_id AS grave_id,
	g.parent_id AS site_id,
	s.lon,
	s.lat,
	s.child_name || ' > ' || g.child_name AS context

	FROM thanados.searchData se
		JOIN thanados.maintype mt ON se.child_id = mt.entity_id
		JOIN thanados.graves g ON se.child_id = g.child_id 
		JOIN thanados.sites s ON g.parent_id = s.child_id 
		WHERE se.system_type = 'feature' AND s.lon != ''

UNION ALL		

SELECT 
	se.*,
	mt.path AS maintype,
	NULL AS burial_id,
	NULL AS grave_id,
	se.child_id site_id,
	s.lon,
	s.lat,
	s.child_name AS context

	FROM thanados.searchData se
		JOIN thanados.maintype mt ON se.child_id = mt.entity_id
		JOIN thanados.sites s ON se.child_id = s.child_id 
		WHERE se.system_type = 'place' AND s.lon != ''); 

DROP TABLE IF EXISTS thanados.searchData;
    CREATE TABLE thanados.searchData AS SELECT * FROM thanados.searchData_tmp;
DROP TABLE IF EXISTS thanados.searchData_tmp;

DELETE FROM thanados.searchData WHERE type_id = 0 AND min ISNULL AND max ISNULL;

DROP TABLE IF EXISTS thanados.searchData_tmp;
CREATE TABLE thanados.searchData_tmp AS (

SELECT
d.*,
fi.filename
	FROM

(select distinct on (f.parent_id)
    f.parent_id, f.filename
from thanados.files f WHERE filename != ''   
order by f.parent_id) fi RIGHT JOIN thanados.searchData d ON d.child_id = fi.parent_id ORDER BY child_id, type);

DROP TABLE thanados.searchData;
CREATE TABLE thanados.searchData AS (
SELECT * FROM thanados.searchData_tmp);
DROP TABLE thanados.searchData_tmp;
    """
    g.cursor.execute(sql_4)
    return redirect(url_for('admin'))


@app.route('/admin/geoclean/')
@login_required
def geoclean_execute():  # pragma: no cover
    if current_user.group not in ['admin']:
        abort(403)

    sql_5 = """
    -- cleanup for geometries
-- remove point geom if it is the same as parent entity
DROP TABLE IF EXISTS thanados.giscleanup;
CREATE TABLE thanados.giscleanup AS
 (
SELECT 	e.system_type,
	e.child_name,
	e.parent_id,
	e.child_id,
	e.geom AS jsongeom,
	l.property_code,
	l.range_id,
	g.id,
	g.geom
	FROM thanados.entities e JOIN model.link l ON e.child_id = l.domain_id JOIN gis.point g ON l.range_id = g.entity_id WHERE l.property_code = 'P53');

DELETE FROM gis.point g WHERE g.id in (
SELECT g2.id FROM thanados.giscleanup g1 JOIN thanados.giscleanup g2 ON g1.child_id = g2.parent_id WHERE g1.jsongeom = g2.jsongeom  AND g1.system_type = 'stratigraphic unit' ORDER BY g1.system_type, g1.child_id, g2.child_name);

DELETE FROM gis.point g WHERE g.id in (
SELECT g2.id FROM thanados.giscleanup g1 JOIN thanados.giscleanup g2 ON g1.child_id = g2.parent_id WHERE g1.jsongeom = g2.jsongeom  AND g1.system_type = 'feature' ORDER BY g1.system_type, g1.child_id, g2.child_name);

DELETE FROM gis.point g WHERE g.id in (
SELECT g2.id FROM thanados.giscleanup g1 JOIN thanados.giscleanup g2 ON g1.child_id = g2.parent_id WHERE g1.jsongeom = g2.jsongeom  AND g1.system_type = 'place' ORDER BY g1.system_type, g1.child_id, g2.child_name);

--Remove point geometries from stratigraphic units and finds
DELETE FROM gis.point WHERE id IN (SELECT id FROM thanados.giscleanup WHERE system_type NOT IN ('feature', 'place'));

-- remove point coordinates from graves for selected sites
DELETE FROM gis.point WHERE id IN (SELECT id FROM thanados.giscleanup where parent_id IN (
    45625, 45179, 46747, 46267, 45143, 50577, 46313, 
    50571, 46243, 46397, 49255, 46249, 46403, 47571, 
    45631, 46427
    ));  

--remove point geom if polygon geom exists
DROP TABLE IF EXISTS thanados.giscleanup;
CREATE TABLE thanados.giscleanup AS
 (
SELECT 	e.system_type,
	e.child_name,
	e.parent_id,
	e.child_id,
	l.property_code,
	l.range_id,
	g.id,
	g.geom AS poly_id,
	g2.id AS point_id,
	g2.geom
	FROM thanados.entities e JOIN model.link l ON e.child_id = l.domain_id JOIN gis.polygon g ON l.range_id = g.entity_id JOIN gis.point g2 ON g.entity_id = g2.entity_id WHERE l.property_code = 'P53');

DELETE FROM gis.point WHERE id IN (SELECT point_id FROM thanados.giscleanup);
    """

    g.cursor.execute(sql_5)
    return redirect(url_for('jsonprepare_execute'))


@app.route('/admin/timeclean/')
@login_required
def timeclean_execute():  # pragma: no cover
    if current_user.group not in ['admin']:
        abort(403)

    sql_6 = """
    --cleanup for timespans
UPDATE model.entity SET begin_to = begin_from WHERE begin_to IS NULL AND begin_from IS NOT NULL;
UPDATE model.entity SET end_to = end_from WHERE end_to IS NULL AND end_from IS NOT NULL;

DROP TABLE IF EXISTS thanados.idpath;
CREATE TABLE thanados.idpath AS
(SELECT
	s.child_id AS site_id,
	m1.begin_from AS site_begin_from,
	m1.begin_to AS site_begin_to,
	m1.end_from AS site_end_from,
	m1.end_to AS site_end_to,
	g.child_id AS grave_id,
	m2.begin_from AS grave_begin_from,
	m2.begin_to AS grave_begin_to,
	m2.end_from AS grave_end_from,
	m2.end_to AS grave_end_to,
	b.child_id AS burial_id,
	m3.begin_from AS burial_begin_from,
	m3.begin_to AS burial_begin_to,
	m3.end_from AS burial_end_from,
	m3.end_to AS burial_end_to,
	f.child_id AS find_id,
	m4.begin_from AS find_begin_from,
	m4.begin_to AS find_begin_to,
	m4.end_from AS find_end_from,
	m4.end_to AS find_end_to

FROM thanados.sites s LEFT JOIN model.entity m1 on s.child_id = m1.id
	LEFT JOIN thanados.graves g ON s.child_id = g.parent_id LEFT JOIN model.entity m2 on g.child_id = m2.id
	LEFT JOIN thanados.burials b ON g.child_id = b.parent_id LEFT JOIN model.entity m3 on b.child_id = m3.id
	LEFT JOIN thanados.finds f ON b.child_id = f.parent_id LEFT JOIN model.entity m4 on f.child_id = m4.id );


UPDATE thanados.idpath SET grave_begin_from = site_begin_from WHERE grave_begin_from < site_begin_from;
UPDATE thanados.idpath SET grave_begin_to = grave_begin_from WHERE grave_begin_to < grave_begin_from;
UPDATE thanados.idpath SET grave_end_to = site_end_to WHERE grave_end_to > site_end_to;
UPDATE thanados.idpath SET grave_end_from = grave_end_to WHERE grave_end_from > grave_end_to;
UPDATE thanados.idpath SET burial_begin_from = grave_begin_from WHERE burial_begin_from < grave_begin_from;
UPDATE thanados.idpath SET burial_begin_to = burial_begin_from WHERE burial_begin_to < burial_begin_from;
UPDATE thanados.idpath SET burial_end_to = grave_end_to WHERE burial_end_to > grave_end_to;
UPDATE thanados.idpath SET burial_end_from = burial_end_to WHERE burial_end_from > burial_end_to;

UPDATE model.entity SET begin_from = grave_begin_from FROM (SELECT id, grave_begin_from FROM model.entity e JOIN thanados.idpath i ON id = grave_id WHERE begin_from != grave_begin_from) a WHERE a.id = model.entity.id;
UPDATE model.entity SET begin_to = grave_begin_to FROM (SELECT id, grave_begin_to FROM model.entity e JOIN thanados.idpath i ON id = grave_id WHERE begin_to != grave_begin_to) a WHERE a.id = model.entity.id;

UPDATE model.entity SET end_from = grave_end_from FROM (SELECT id, grave_end_from FROM model.entity e JOIN thanados.idpath i ON id = grave_id WHERE end_from != grave_end_from) a WHERE a.id = model.entity.id;
UPDATE model.entity SET end_to = grave_end_to FROM (SELECT id, grave_end_to FROM model.entity e JOIN thanados.idpath i ON id = grave_id WHERE end_to != grave_end_to) a WHERE a.id = model.entity.id;

UPDATE model.entity SET begin_from = burial_begin_from FROM (SELECT id, burial_begin_from FROM model.entity e JOIN thanados.idpath i ON id = burial_id WHERE begin_from != burial_begin_from) a WHERE a.id = model.entity.id;
UPDATE model.entity SET begin_to = burial_begin_to FROM (SELECT id, burial_begin_to FROM model.entity e JOIN thanados.idpath i ON id = burial_id WHERE begin_to != burial_begin_to) a WHERE a.id = model.entity.id;

UPDATE model.entity SET end_from = burial_end_from FROM (SELECT id, burial_end_from FROM model.entity e JOIN thanados.idpath i ON id = burial_id WHERE end_from != burial_end_from) a WHERE a.id = model.entity.id;
UPDATE model.entity SET end_to = burial_end_to FROM (SELECT id, burial_end_to FROM model.entity e JOIN thanados.idpath i ON id = burial_id WHERE end_to != burial_end_to) a WHERE a.id = model.entity.id;
    """

    g.cursor.execute(sql_6)
    return redirect(url_for('jsonprepare_execute'))


@app.route('/admin/fileref/')
@login_required
def fileref_execute():  # pragma: no cover
    if current_user.group not in ['admin']:
        abort(403)

    sql_7 = """
    --cleanup for missing file references
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

DROP TABLE IF EXISTS thanados.refFilesTmp;
    """

    g.cursor.execute(sql_7)
    return redirect(url_for('jsonprepare_execute'))
