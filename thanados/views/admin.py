import json
import sys
from datetime import datetime

from flask import abort, g, jsonify, render_template, request, url_for
from flask_login import current_user, login_required
from flask_wtf import FlaskForm
from werkzeug.utils import redirect
from wtforms import SubmitField, TextAreaField

from thanados import app
from thanados.models.entity import Data
from thanados.util.files import api_download


class SiteListForm(FlaskForm):  # type: ignore
    site_list = TextAreaField('Site list')
    save = SubmitField('Save site list')


@app.route('/admin/', methods=['POST', 'GET'])
@login_required
def admin():  # pragma: no cover
    form = SiteListForm()
    if current_user.group not in ['admin']:
        abort(403)

    try:
        with open(app.root_path + "/../instance/site_list.txt") as file:
            g.site_list = json.loads(file.read())
    except Exception as e:  # pragma: no cover
        pass
    if not g.site_list:
        g.cursor.execute('SELECT child_id FROM thanados.sites;')
        g.site_list = [row.child_id for row in g.cursor.fetchall()]

    if form.validate_on_submit():
        try:
            with open(app.root_path + "/../instance/site_list.txt", 'w') as file:
                file.write(form.site_list.data)
                return redirect(url_for('admin'))
        except Exception as e:  # pragma: no cover
            pass

    try:
        with open(app.root_path + "/../instance/site_list.txt") as file:
            form.site_list.data = file.read()
    except Exception as e:  # pragma: no cover
        pass

    sql = """
            SELECT jsonb_agg(jsonb_build_object(
                'id', child_id,
                'name', child_name,
                'type', type,
                'used', used)) as sites
                FROM (
                        SELECT child_id, child_name, type, 1 AS used FROM thanados.searchdata WHERE path LIKE 'Place >%%' AND child_id IN %(site_ids)s
                        UNION all
                        SELECT child_id, child_name, type, 0 AS used FROM thanados.searchdata WHERE path LIKE 'Place >%%' AND child_id NOT IN %(site_ids)s
                        ) AS allsites 
                    
    """

    try:
        g.cursor.execute(sql, {'site_ids': tuple(g.site_list)})
        currentsitelist = g.cursor.fetchone()
    except Exception:
        currentsitelist = []


    sql_missing_refs = """
        
SELECT jsonb_agg(jsonb_build_object('id', parent_id::TEXT, 'name', child_name)) AS nm FROM (SELECT DISTINCT r.parent_id, e.child_name
FROM thanados.reference r
         JOIN thanados.sites e ON e.child_id = r.parent_id
WHERE r.parent_id IN
      (SELECT parent_id
       FROM (SELECT parent_id
             FROM (SELECT parent_id, COUNT(parent_id) AS number from thanados.reference GROUP BY parent_id) n
             WHERE number > 1) d
       WHERE d.parent_id NOT IN
             (SELECT parent_id
              FROM thanados.reference
              WHERE parent_id IN
                    (SELECT parent_id
                     FROM (SELECT parent_id, COUNT(parent_id) AS number from thanados.reference GROUP BY parent_id) n
                     WHERE number > 1)
                AND reference LIKE '%%##main')
ORDER BY parent_id)) nma WHERE nma.parent_id IN %(site_ids)s"""

    try:
        g.cursor.execute(sql_missing_refs, {'site_ids': tuple(g.site_list)})
        missingrefs = g.cursor.fetchone()[0]
        if missingrefs == None:
            missingrefs = []
        print('Missing references:')
        print (missingrefs)
    except Exception:
        missingrefs = []

    sql_missing_geonames = """
    SELECT jsonb_agg(jsonb_build_object('id', child_id::TEXT, 'name', child_name, 'lat', lat, 'lon', lon)) AS ng FROM (SELECT lon::double precision, lat::double precision, child_name, child_id FROM thanados.sites WHERE child_id NOT IN (
SELECT parent_id FROM thanados.extrefs WHERE name = 'GeoNames')) ng1 WHERE ng1.child_id IN %(site_ids)s AND ng1.child_id NOT IN (SELECT range_id from model.link WHERE property_code = 'P67' AND domain_id = 155980) 
        """
    try:
        g.cursor.execute(sql_missing_geonames, {'site_ids': tuple(g.site_list)})
        missingeonames = g.cursor.fetchone()[0]
        if missingeonames == None:
            missingeonames = []
    except Exception:
        missingeonames = []

    sql_refs = """
    SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'citation', description)) AS refs FROM (SELECT id, name, description FROM model.entity WHERE cidoc_class_code = 'E31' AND openatlas_class_name = 'bibliography' ORDER BY name) a
        """
    try:
        g.cursor.execute(sql_refs)
        refs = g.cursor.fetchone()[0]
        if refs == None:
            refs = []
    except Exception:
        refs = []


    sql_missing_fileref = """
                SELECT jsonb_agg(jsonb_build_object('site', sitename, 'site_id', site_id, 'id', id::TEXT, 'name', name, 'file', filename)) AS ng FROM

   (SELECT * FROM (SELECT DISTINCT g.name, g.filename, g.id, g.site_id, g.sitename, l.domain_id
FROM (SELECT DISTINCT f.name,
                                    f.id,
                                    f.source,
                                    f.filename,
                                    s.site_id,
                                    e.name AS sitename
                    FROM thanados.files f

                             JOIN thanados.searchdata s ON f.parent_id = s.child_id
                             JOIN (SELECT name, id
                                   FROM model.entity
                                   WHERE id IN %(site_ids)s
                    ) e ON e.id = s.site_id) g
         LEFT OUTER JOIN (SELECT * FROM model.link WHERE property_code = 'P67') l ON g.id = l.range_id) xy WHERE domain_id IS NULL) yx
            """
    try:
        g.cursor.execute(sql_missing_fileref, {'site_ids': tuple(g.site_list)})
        missingfileref = g.cursor.fetchone()[0]
        if missingfileref == None:
            missingfileref = []
    except Exception:
        missingfileref = []

    sql_missing_geo = """
            SELECT jsonb_agg(jsonb_build_object('id', child_id::TEXT, 'name', child_name)) AS ng FROM (SELECT * FROM thanados.sites WHERE geom IS NULL) a
                """
    try:
        g.cursor.execute(sql_missing_geo)  # , {'site_ids': tuple(g.site_list)})
        missingeo = g.cursor.fetchone()[0]
        if missingeo == None:
            missingeo = []
    except Exception:
        missingeo = []

    return render_template('admin/index.html', form=form, refs=refs, sites=currentsitelist, openatlas_url = app.config["OPENATLAS_URL"].replace('update', 'entity'), missingrefs=missingrefs, missingeonames=missingeonames, missingfileref=missingfileref, missingeo=missingeo)


@app.route('/admin/execute/')
@login_required
def jsonprepare_execute():  # pragma: no cover
    if current_user.group not in ['admin']:
        abort(403)

    start = datetime.now()
    print("starting processing basic queries at: " + str(start.strftime("%H:%M:%S")))

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
                WHERE entity.cidoc_class_code = 'E55') x
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
                WHERE entity.cidoc_class_code ~~ 'E55'::text  AND link.property_code = 'P127') x
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
       path.name_path,
       NULL AS topparent,
       '[]'::JSONB AS forms
FROM path
ORDER BY path.path;
          
UPDATE thanados.types_all SET topparent = f.topparent, forms = f.forms
    FROM (SELECT tp.id, tp.name_path, tp.topparent, jsonb_agg(DISTINCT f.name) AS forms
        FROM (SELECT id::INTEGER, path, name_path, left(path, strpos(path, ' >') -1)::INTEGER AS
            topparent FROM thanados.types_all WHERE path LIKE '%>%'
                    UNION ALL
            SELECT id::INTEGER, path, name_path, PATH::INTEGER AS topparent FROM
                thanados.types_all WHERE path NOT LIKE '%>%' ORDER BY name_path) tp JOIN (select openatlas_class_name as name, hierarchy_id FROM
	                web.hierarchy_openatlas_class) f
	                ON  f.hierarchy_id = tp.topparent
	                GROUP BY tp.id, tp.name_path, tp.topparent ORDER BY name_path) f
	WHERE thanados.types_all.id = f.id;


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
           s.openatlas_class_name,
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
                 e.openatlas_class_name,
                 l.range_id
          FROM model.entity e
                   JOIN model.link l ON e.id = l.domain_id
          WHERE l.property_code = 'P2'
            AND e.openatlas_class_name = 'place'
            )
             AS s
             JOIN thanados.types_all t ON t.id = s.range_id
    WHERE t.name_path LIKE 'Place > Burial Site%' -- replace with the top parent of the place category of which you want to show
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
       child.openatlas_class_name,
       NULL::TEXT                                   as geom,
       NULL::TEXT as lon,
       NULL::TEXT as lat
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM thanados.sites)
  AND l_p_c.property_code = 'P46'
ORDER BY child.openatlas_class_name, parent.id, child.name;

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
    'feature' AS openatlas_class_name,
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
       child.openatlas_class_name,
       NULL::TEXT                                   as geom,
       NULL::TEXT as lon,
       NULL::TEXT as lat
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM thanados.graves)
  AND l_p_c.property_code = 'P46'
ORDER BY child.openatlas_class_name, parent.id, child.name;


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
       child.openatlas_class_name,
       NULL::TEXT                                   as geom,
       NULL::TEXT as lon,
       NULL::TEXT as lat
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM thanados.burials)
  AND l_p_c.property_code = 'P46' AND child.openatlas_class_name = 'artifact'
ORDER BY child.openatlas_class_name, parent.id, child.name;


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
  
--humanremains
DROP TABLE IF EXISTS thanados.humanremains;
CREATE TABLE thanados.humanremains AS
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
       child.openatlas_class_name,
       NULL::TEXT                                   as geom,
       NULL::TEXT as lon,
       NULL::TEXT as lat
FROM model.entity parent
         JOIN model.link l_p_c ON parent.id = l_p_c.domain_id
         JOIN model.entity child ON l_p_c.range_id = child.id
WHERE parent.id in (SELECT child_id FROM thanados.burials)
  AND l_p_c.property_code = 'P46' AND child.openatlas_class_name = 'human_remains'
ORDER BY child.openatlas_class_name, parent.id, child.name;


UPDATE thanados.humanremains
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.polygon pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53') AS poly
WHERE child_id = poly.id;

UPDATE thanados.humanremains
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN gis.point pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53') AS point
WHERE child_id = point.id
  AND thanados.humanremains.geom ISNULL;

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
UNION ALL
SELECT *
FROM thanados.humanremains
ORDER BY parent_id, child_name;

UPDATE thanados.entitiestmp
SET begin_comment = NULL
WHERE begin_comment = '';
UPDATE thanados.entitiestmp
SET end_comment = NULL
WHERE end_comment = '';
UPDATE thanados.entitiestmp
SET begin_comment = NULL
WHERE begin_comment = 'None';
UPDATE thanados.entitiestmp
SET end_comment = NULL
WHERE end_comment = 'None';
UPDATE thanados.entitiestmp
SET description = NULL
WHERE description = '';


-- fill timespan dates if NULL with from_values
UPDATE thanados.entitiestmp SET begin_to = begin_from WHERE begin_from IS NOT NULL and begin_to IS NULL;
UPDATE thanados.entitiestmp SET begin_from = begin_to WHERE begin_to IS NOT NULL and begin_from IS NULL;
UPDATE thanados.entitiestmp SET end_to = end_from WHERE end_from IS NOT NULL and end_to IS NULL;
UPDATE thanados.entitiestmp SET end_from = end_to WHERE end_to IS NOT NULL and end_from IS NULL;
"""
    g.cursor.execute(sql_1)

    endfirst = datetime.now()
    print("time elapsed:" + str((endfirst - start)))

    print("processing nearest neighbour:")
    nntime = datetime.now()

    sql = """
                    DROP TABLE IF EXISTS thanados.knn;
                    CREATE TABLE thanados.knn AS

                    SELECT DISTINCT
                           g.parent_id,
                           e.name,
                           e.id,
                           (st_pointonsurface(pl.geom)) AS centerpoint,
                           NULL::INTEGER AS nid,
                           NULL::TEXT AS nname,
                           NULL::DOUBLE PRECISION AS distance,
                           NULL::geometry AS npoint

                          FROM model.entity e
                                   JOIN model.link l ON e.id = l.domain_id
                                    JOIN thanados.graves g ON e.id = g.child_id
                                   JOIN gis.polygon pl ON l.range_id = pl.entity_id
                          WHERE l.property_code = 'P53';

                          --delete sites with  only one grave
                          DELETE FROM thanados.knn WHERE parent_id IN (
                          SELECT parent_id FROM (SELECT parent_id, COUNT(parent_id) FROM (SELECT DISTINCT
                           g.parent_id,
                           e.name,
                           e.id,
                           (st_pointonsurface(pl.geom)) AS centerpoint,
                           NULL::INTEGER AS nid,
                           NULL::TEXT AS nname,
                           NULL::DOUBLE PRECISION AS distance,
                           NULL::geometry AS npoint

                          FROM model.entity e
                                   JOIN model.link l ON e.id = l.domain_id
                                    JOIN thanados.graves g ON e.id = g.child_id
                                   JOIN gis.polygon pl ON l.range_id = pl.entity_id
                          WHERE l.property_code = 'P53') a GROUP BY parent_id) b WHERE b.count <= 1 ORDER BY b.count ASC);

                    SELECT * FROM thanados.knn;
                    """
    g.cursor.execute(sql)
    result = g.cursor.fetchall()

    sql2 = """
                    UPDATE thanados.knn ok SET nid=n.id, nname=n.name, npoint=n.npoint FROM 
                    (SELECT 
                        id,
                        name,
                        parent_id,
                        centerpoint AS npoint
                    FROM
                      thanados.knn WHERE id != %(polyId)s 
                    ORDER BY
                      knn.centerpoint <->
                      (SELECT DISTINCT centerpoint FROM thanados.knn WHERE id = %(polyId)s AND parent_id = %(parentId)s AND id NOT IN (SELECT id FROM (SELECT id, count(centerpoint) FROM thanados.knn GROUP BY id ORDER BY count DESC) a WHERE count > 1))
                    LIMIT 1) n WHERE ok.id = %(polyId)s AND n.parent_id = %(parentId)s;
            """
    nearestneighbour = 0
    for row in result:
        sys.stdout.write("\rneighbours found: " + str(nearestneighbour))
        sys.stdout.flush()
        g.cursor.execute(sql2, {'polyId': row.id, 'parentId': row.parent_id})
        nearestneighbour = nearestneighbour + 1

    g.cursor.execute("DELETE FROM thanados.knn WHERE nid ISNULL")
    g.cursor.execute(
        "UPDATE thanados.knn SET distance = ROUND(st_distancesphere(st_astext(centerpoint), st_astext(npoint))::numeric, 2)")

    print("")
    nntimeend = datetime.now()
    print('time elapsed: ' + str((nntimeend - nntime)))

    sqlTypes = """
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
   OR path LIKE 'Stratigraphic unit >%'
   OR path LIKE 'Artifact >%'
   OR path LIKE 'Human remains >%'
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
	e.openatlas_class_name,
	b.child_id AS burial_id
	FROM thanados.dimensiontypes d JOIN model.entity e ON d.entity_id = e.id JOIN thanados.burials b ON e.id = b.parent_id WHERE d.id = 26192 AND b.child_id NOT IN 
		(SELECT 
			d.entity_id
			FROM thanados.dimensiontypes d JOIN model.entity e ON d.entity_id = e.id JOIN thanados.burials b ON e.id = b.child_id WHERE d.id = 26192);

INSERT INTO thanados.dimensiontypes SELECT id, parent_id, burial_id, name, description, value, path FROM thanados.graveDeg;

DROP TABLE IF EXISTS thanados.giscleanup2;
CREATE TABLE thanados.giscleanup2 AS
 (
SELECT 	e.openatlas_class_name,
	e.child_name,
	e.parent_id,
	e.child_id,
	l.property_code,
	l.range_id,
	g.id,
	g.geom
	FROM thanados.graves e JOIN model.link l ON e.child_id = l.domain_id JOIN gis.polygon g ON l.range_id = g.entity_id WHERE l.property_code = 'P53');

DROP TABLE IF EXISTS thanados.derivedDegtmp;
CREATE TABLE thanados.derivedDegtmp AS
(SELECT 
	ST_StartPoint(ST_LineMerge(ST_ApproximateMedialAxis(ST_OrientedEnvelope(g.geom)))) AS startP,
	ST_EndPoint(ST_LineMerge(ST_ApproximateMedialAxis(ST_OrientedEnvelope(g.geom)))) AS endP,
	child_id FROM thanados.giscleanup2 g WHERE openatlas_class_name = 'feature');


-- Get azimuth of grave if a polygon is known
DROP TABLE IF EXISTS thanados.derivedDeg;
CREATE TABLE thanados.derivedDeg AS
(SELECT 
    ST_X(startP) AS onePoint,
    ST_X(endP) AS otherPoint,
	degrees(ST_Azimuth(startP, endP)) AS degA_B,
	degrees(ST_Azimuth(endP, startP)) AS degB_A,
	child_id FROM thanados.derivedDegtmp);
	--41sec before, 14sec after... 

DROP TABLE IF EXISTS thanados.giscleanup2;
DROP TABLE IF EXISTS thanados.derivedDegtmp;

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
	
DROP TABLE IF EXISTS thanados.derivedDeg;
	
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
         
DROP TABLE IF EXISTS thanados.azimuth;

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

--insert nearest neighbour distance 
INSERT INTO thanados.dimensiontypes 
    SELECT
        148713,
        15678,
        id,
        'Nearest Neighbour',
        'm',
        distance,
        'Dimensions > Distance > Nearest Neighbour'
        FROM thanados.knn;
         
--DROP TABLE IF EXISTS thanados.azimuth;


--types material
DROP TABLE IF EXISTS thanados.materialtypes;
CREATE TABLE thanados.materialtypes AS
SELECT *
FROM thanados.types_main
WHERE path LIKE 'Material >%'
ORDER BY entity_id, path;

DROP TABLE IF EXISTS thanados.radiocarbon;
CREATE TABLE thanados.radiocarbon AS
SELECT *, 'unique' AS rc_type
FROM thanados.types_main
WHERE path LIKE 'Radiocarbon Dating >%'
ORDER BY entity_id, path;


--other types
DROP TABLE IF EXISTS thanados.types;
CREATE TABLE thanados.types AS
SELECT *
FROM thanados.types_main
WHERE path NOT LIKE 'Dimensions >%'
  AND path NOT LIKE 'Place >%'
  AND path NOT LIKE 'Feature >%'
  AND path NOT LIKE 'Stratigraphic unit >%'
  AND path NOT LIKE 'Human remains >%'
  AND path NOT LIKE 'Artifact >%'
  AND path NOT LIKE 'Material >%'
  AND path NOT LIKE 'Radiocarbon Dating >%'
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

DROP TABLE IF EXISTS thanados.entitiestmp
            """
    startnext = datetime.now()
    print("Adding types and values")
    g.cursor.execute(sqlTypes)
    endnext = datetime.now()
    print("time elapsed:" + str((endnext - startnext)))

    print("processing files")
    sql_2 = """
    DROP TABLE IF EXISTS thanados.files;
CREATE TABLE thanados.files AS
SELECT entities.child_id AS parent_id,
       entity.name,
       entity.id, 
       entity.description
FROM thanados.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entities.child_id != 0
  AND entity.openatlas_class_name ~~ 'file'::text
ORDER BY entities.child_id;

UPDATE thanados.files SET description = NULL WHERE description = '';

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
    filesfound = 0
    filesmissing = 0

    sql_3 = 'SELECT id FROM thanados.files'
    g.cursor.execute(sql_3)
    result = g.cursor.fetchall()
    missingids = []
    for row in result:
        file_name = (Data.get_file_path(row.id))
        row_id = (row.id)
        if file_name:
            filesfound = filesfound + 1
        else:
            filesmissing = filesmissing + 1
            missingids.append(row_id)
        g.cursor.execute("UPDATE thanados.files SET filename = %(file_name)s WHERE id = %(row_id)s",
                         {'file_name': file_name, 'row_id': row_id})
        sys.stdout.write("\rfiles found: " + str(filesfound) + " files missing: " + str(filesmissing))
        sys.stdout.flush()

    print(missingids)
    g.cursor.execute('DELETE FROM thanados.files WHERE filename = NULL')

    print("")
    filesdone = datetime.now()
    print("time elapsed:" + str((filesdone - endnext)))
    print("processing types and files")


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
  AND entity.openatlas_class_name ~~ 'bibliography'::text
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
  AND entity.openatlas_class_name ~~ 'external_reference'::text
ORDER BY entities.child_id;

INSERT INTO thanados.extrefs 
SELECT entities.child_id  AS parent_id,
       reference_system.resolver_url || link.description   AS url,
       entity.name  AS name,
       entity.description AS description,
       entity.id
FROM thanados.entities,
     model.link,
     model.entity,
     web.reference_system
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND model.entity.id = web.reference_system.entity_id
  AND entities.child_id != 0
  AND entity.id IN (SELECT entity_id from web.reference_system)
ORDER BY entities.child_id;
       

UPDATE thanados.extrefs
SET description = NULL
WHERE description = '';
UPDATE thanados.extrefs
SET name = NULL
WHERE name = '';

DROP TABLE IF EXISTS thanados.refsys;
    CREATE TABLE thanados.refsys AS
    SELECT entity_id, name, website_url, '' AS icon_url FROM web.reference_system;
    """

    g.cursor.execute(sql_4)



    from thanados.models.entity import RCData

    sql_rc = """
            SELECT 
                    r.entity_id::TEXT,
                    split_part(r.value::numeric(10,2)::TEXT,'.',1) AS "date",
                    split_part(r.value::numeric(10,2)::TEXT,'.',2) AS "range",
                    split_part(e.description,'##RCD ',2) AS "sample"
            FROM thanados.radiocarbon r JOIN thanados.entities e ON e.child_id = r.entity_id 
        """
    try:
        g.cursor.execute(sql_rc)
        result_rc = g.cursor.fetchall()
        if result_rc:
            print('calibrating radiocarbon data:')

        else:
            print('no radiocarbon data detected in database')
    except Exception:
        result_rc = None

    if result_rc:
        for row in result_rc:
            if row.sample == '':
                sample = 'Unknown Sample Id'
            else:
                sample = row.sample
            print(row.entity_id + ': Sample: ' + sample + ', ' + row.date + ' +- ' + row.range)
            RCData_ = json.dumps(RCData.radiocarbon(row.entity_id, int(row.date), int(row.range), 'ad', sample, 'intcal20.14c', False))
            g.cursor.execute('UPDATE thanados.radiocarbon SET description = %(RCdata)s WHERE entity_id = %(entid)s',
                             {'RCdata': RCData_, 'entid': row.entity_id})

        sql_stacked = """
                        DROP TABLE IF EXISTS thanados.rc_parents;
                        CREATE TABLE thanados.rc_parents AS
                        SELECT r.entity_id, e.parent_id, 'rc' AS rc
                        FROM thanados.radiocarbon r
                                 JOIN thanados.entities e ON r.entity_id = e.child_id
                        ORDER BY e.parent_id;

                        DROP TABLE IF EXISTS thanados.rc_tree;
                        CREATE TABLE thanados.rc_tree AS
                        WITH RECURSIVE superents AS (
                            SELECT entity_id,
                                   parent_id,
                                   0  AS count,
                                   '' AS sample
                            FROM thanados.rc_parents
                            UNION
                            SELECT l.child_id,
                                   l.parent_id,
                                   0  as count,
                                   '' AS sample
                            FROM thanados.entities l
                                     JOIN superents s ON s.parent_id = l.child_id
                        )
                        SELECT *
                        FROM superents;

                        UPDATE thanados.rc_tree t
                        SET sample = (SELECT description::JSONB -> 'sample' FROM thanados.radiocarbon r WHERE r.entity_id = t.entity_id);

                        DROP TABLE IF EXISTS thanados.RC_stacked;
                        CREATE TABLE thanados.RC_stacked AS
                        SELECT entity_id, jsonb_agg(sample::JSONB) AS sample FROM
                        (WITH RECURSIVE superents AS (
                        SELECT entity_id,
                            parent_id,
                            sample AS sample
                        FROM thanados.rc_tree WHERE sample IS NOT NULL
                        UNION
                        SELECT t.entity_id,
                            t.parent_id, s.sample AS sample
                        FROM thanados.rc_tree t JOIN superents s ON s.parent_id = t.entity_id
                        )
                        SELECT *
                        FROM superents) se GROUP BY entity_id;
                        
                        DROP TABLE IF EXISTS thanados.rc_stacked_final;
                        CREATE TABLE thanados.rc_stacked_final AS
                        SELECT 
                            entity_id, sample, 
                            jsonb_array_length(sample) 
                            FROM thanados.RC_stacked 
                            WHERE entity_id NOT IN (SELECT entity_id from thanados.radiocarbon)
                        UNION ALL
                        
                        SELECT 
                            entity_id, 
                            sample, jsonb_array_length(sample) 
                            FROM thanados.RC_stacked WHERE entity_id IN (SELECT entity_id from thanados.radiocarbon) 
                                AND jsonb_array_length(sample) > 1;
                    
                    
                    DROP TABLE IF EXISTS thanados.radiocarbon_tmp;

CREATE TABLE thanados.radiocarbon_tmp AS
    SELECT
           entity_id,
           jsonb_build_object('child_sample', sample) AS sample
FROM thanados.rc_stacked_final WHERE entity_id NOT IN (SELECT entity_id FROM thanados.radiocarbon) AND jsonb_array_length(sample) = 1
UNION ALL
    SELECT
           entity_id,
           jsonb_build_object('combined_children_samples', sample) AS sample
FROM thanados.rc_stacked_final WHERE entity_id NOT IN (SELECT entity_id FROM thanados.radiocarbon) AND jsonb_array_length(sample) > 1
UNION ALL
    SELECT
           f.entity_id,
           jsonb_build_object('combined_samples', f.sample,
                                'sample', s.description::JSONB -> 'sample') AS sample
FROM thanados.rc_stacked_final f JOIN thanados.radiocarbon s ON s.entity_id = f.entity_id WHERE f.entity_id IN (SELECT entity_id FROM thanados.radiocarbon) AND jsonb_array_length(sample) > 1;

INSERT INTO thanados.radiocarbon_tmp SELECT r.entity_id, r.description::JSONB FROM thanados.radiocarbon r WHERE r.entity_id NOT IN (SELECT entity_id FROM thanados.radiocarbon_tmp);
                    """
        g.cursor.execute(sql_stacked)

        from thanados.models.entity import RCData

        RCData.radiocarbonmulti()





    sql_5 = """
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
    extrefs    jsonb,
    radiocarbon jsonb
);

--external gazetteers for types
DROP TABLE IF EXISTS thanados.ext_types;
CREATE TABLE thanados.ext_types AS
SELECT types_all.id                                      AS type_id,
       reference_system.resolver_url || link.description AS url,
       reference_system.website_url                      AS website,
       entity.name                                       AS name,
       entity.description                                AS description,
       entity.id,
       link.description                                  AS identifier,
       entitysk.name                                     AS SKOS
FROM thanados.types_all,
     model.link,
     model.entity,
     web.reference_system,
     model.entity AS entitysk
WHERE types_all.id = link.range_id
  AND link.domain_id = entity.id
  AND model.entity.id = web.reference_system.entity_id
  AND types_all.id != 0
  AND link.type_id = entitysk.id
  AND entity.id IN (SELECT entity_id from web.reference_system)
ORDER BY types_all.id;

UPDATE thanados.ext_types
SET description = NULL
WHERE description = '';

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


-- insert radiocarbon
UPDATE thanados.types_and_files t SET radiocarbon = r.sample::JSONB
FROM thanados.radiocarbon_tmp r WHERE t.entity_id = r.entity_id;
         
-- insert file data
DROP TABLE IF EXISTS thanados.testins;
CREATE TABLE thanados.testins AS
SELECT t.entity_id, f.files
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
                                           'reference', t.reference,
                                           'description', t.description
                                       ))) AS files
                            FROM thanados.files t
                            GROUP BY parent_id) AS irgendwas
                           ON e.child_id = irgendwas.parent_id) f JOIN thanados.types_and_files t ON f.child_id = t.entity_id;

UPDATE thanados.types_and_files f SET files = t.files FROM thanados.testins t WHERE f.entity_id = t.entity_id;
             --1:45min before after: 4,3s


-- insert bibliography data
DROP TABLE IF EXISTS thanados.testins;
CREATE TABLE thanados.testins AS
(SELECT child_id, reference
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
                 );

UPDATE thanados.types_and_files
SET reference = (SELECT reference from thanados.testins f
                 WHERE entity_id = f.child_id);
                 --1:35 min before, 5sec after

--insert external refs data
DROP TABLE IF EXISTS thanados.testins;
CREATE TABLE thanados.testins AS
(SELECT e.child_id, extref
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
              ON e.child_id = irgendwas.parent_id);

UPDATE thanados.types_and_files
SET extrefs = (SELECT extref from thanados.testins f
                 WHERE entity_id = f.child_id);
                 --DROP TABLE IF EXISTS thanados.extrefs;
                 
DROP TABLE IF EXISTS thanados.testins;                 
--31ms

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
--354ms

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

DROP TABLE IF EXISTS thanados.materialtypes;
--172 ms

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
--344ms


--temp table with all info
DROP TABLE IF EXISTS thanados.tmp;
CREATE TABLE thanados.tmp AS
    (SELECT *
     FROM thanados.entities e
              LEFT JOIN thanados.types_and_files t ON e.child_id = t.entity_id ORDER BY parent_id, child_name);

--DROP TABLE IF EXISTS thanados.types_and_files;

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
UPDATE thanados.tmp SET description = (SELECT split_part(description, '##german', 1)); --hack to remove German descriptions
UPDATE thanados.tmp SET description = (SELECT split_part(description, '##Deutsch', 1)); --hack to remove German descriptions
UPDATE thanados.tmp SET description = (SELECT split_part(description, '##deutsch', 1)); --hack to remove German descriptions
UPDATE thanados.tmp SET description = (SELECT split_part(description, '##RCD', 1)); --hack to remove Radiocarbon string
--1,4s
"""

    g.cursor.execute(sql_5)
    filetypesdone = datetime.now()
    print("time elapsed: " + str((filetypesdone - filesdone)))
    print("processing GeoJSONs")

    sql_6 = """
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
                       'systemtype', f.openatlas_class_name
                   ),
               'types', f.types,
               'description', f.description,
               'timespan', f.timespan,
               'dimensions', f.dimensions,
               'material', f.material,
               'references', f.reference,
               'externalreference', f.extrefs,
               'radiocarbon', f.radiocarbon
           )) AS finds
FROM (SELECT * FROM thanados.tmp WHERE openatlas_class_name LIKE 'artifact') f
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

DROP TABLE IF EXISTS thanados.tbl_finds;

---humanremains json
DROP TABLE IF EXISTS thanados.tbl_humanremains;
CREATE TABLE thanados.tbl_humanremains
(
    id         integer,
    parent_id  integer,
    properties jsonb,
    files      jsonb
);

INSERT INTO thanados.tbl_humanremains (id, parent_id, files, properties)
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
                       'systemtype', f.openatlas_class_name
                   ),
               'types', f.types,
               'description', f.description,
               'timespan', f.timespan,
               'dimensions', f.dimensions,
               'material', f.material,
               'references', f.reference,
               'externalreference', f.extrefs,
               'radiocarbon', f.radiocarbon
           )) AS humanremains
FROM (SELECT * FROM thanados.tmp WHERE openatlas_class_name LIKE 'human_remains') f
ORDER BY f.child_name;



DROP TABLE IF EXISTS thanados.tbl_humanremainscomplete;
CREATE TABLE thanados.tbl_humanremainscomplete
(
    id        integer,
    parent_id integer,
    humanremains      jsonb
);

INSERT INTO thanados.tbl_humanremainscomplete (id, parent_id, humanremains)
SELECT id,
       parent_id,
       jsonb_strip_nulls(jsonb_build_object(
               'id', f.id,
               'properties', f.properties,
               'files', f.files
           )) AS humanremains
FROM thanados.tbl_humanremains f;
--ORDER BY f.properties -> 'name' asc;

DROP TABLE IF EXISTS thanados.tbl_humanremains;

--burial
DROP TABLE IF EXISTS thanados.tbl_burials;
CREATE TABLE thanados.tbl_burials
(
    id                integer,
    parent_id         integer,
    properties        jsonb,
    finds             jsonb,
    humanremains      jsonb,
    files             jsonb
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
                       'systemtype', f.openatlas_class_name
                   ),
               'types', f.types,
               'description', f.description,
               'timespan', f.timespan,
               'dimensions', f.dimensions,
               'material', f.material,
               'references', f.reference,
               'externalreference', f.extrefs,
               'radiocarbon', f.radiocarbon

           ))     AS burials,
       jsonb_strip_nulls(jsonb_agg(fi.find))--,
FROM (SELECT * FROM thanados.tmp WHERE openatlas_class_name LIKE 'stratigraphic_unit') f
         LEFT JOIN thanados.tbl_findscomplete fi ON f.child_id = fi.parent_id         
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.typename, f.path,
         f.radiocarbon, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files, f.openatlas_class_name, f.reference, f.extrefs
ORDER BY f.child_name;

DROP TABLE IF EXISTS thanados.tbl_findscomplete;

UPDATE thanados.tbl_burials f
SET finds = NULL
WHERE f.finds = '[null]';

UPDATE thanados.tbl_burials f
SET humanremains = hr.humanremains FROM (SELECT parent_id,
                                                jsonb_strip_nulls(jsonb_agg(humanremains)) AS humanremains
                                                    FROM thanados.tbl_humanremainscomplete GROUP BY parent_id) hr WHERE f.id = hr.parent_id;

DROP TABLE IF EXISTS thanados.tbl_humanremainscomplete;

UPDATE thanados.tbl_burials f
SET humanremains = NULL
WHERE f.humanremains = '[null]';

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
               'finds', f.finds,
               'humanremains', f.humanremains
           )) AS burials
FROM thanados.tbl_burials f;
--ORDER BY f.properties -> 'name' asc;

DROP TABLE IF EXISTS thanados.tbl_burials;

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
                       'systemtype', f.openatlas_class_name
                   ),
               'types', f.types,
               'description', f.description,
               'timespan', f.timespan,
               'dimensions', f.dimensions,
               'material', f.material,
               'references', f.reference,
               'externalreference', f.extrefs,
               'radiocarbon', f.radiocarbon
           )) AS graves,
       jsonb_strip_nulls(jsonb_agg(fi.burial))
FROM (SELECT * FROM thanados.tmp WHERE openatlas_class_name LIKE 'feature') f
         LEFT JOIN thanados.tbl_burialscomplete fi ON f.child_id = fi.parent_id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
         f.radiocarbon, f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files,
         f.openatlas_class_name
ORDER BY f.child_name;

DROP TABLE IF EXISTS thanados.tbl_burialscomplete;

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

DROP TABLE IF EXISTS thanados.tbl_graves;

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
                       'systemtype', f.openatlas_class_name
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
               'shape', s.polygon::jsonb,
               'radiocarbon', f.radiocarbon
           )) AS sites
FROM (SELECT * FROM thanados.tmp WHERE openatlas_class_name LIKE 'place') f
         LEFT JOIN thanados.tbl_sites s ON f.child_id = s.id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
         f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files,
         f.radiocarbon, f.openatlas_class_name, s.id, s.name,
         s.point, s.polygon
ORDER BY f.child_name;

DROP TABLE IF EXISTS thanados.tmp;


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

DROP TABLE IF EXISTS thanados.tbl_sitescomplete;
"""
    g.cursor.execute(sql_6)
    jsonsdone = datetime.now()
    print("time elapsed: " + str((jsonsdone - filetypesdone)))

    print("processing other tables")

    sql7 = """
-- create table with all types for json
DROP TABLE IF EXISTS thanados.typesforjson;
CREATE TABLE thanados.typesforjson AS
SELECT DISTINCT 'type' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM thanados.types_all
WHERE --set types to display in jstree
    name_path LIKE 'Anthropology%'
   OR name_path LIKE 'Grave Construction%'
   OR name_path LIKE 'Gender%'
   OR name_path LIKE 'Pathologies and Non-metric traits%'
   OR name_path LIKE 'Bone measurements%'
   OR name_path LIKE 'Siding%'
   OR name_path LIKE 'Animals%'
   OR name_path LIKE 'Body posture%'
   OR name_path LIKE 'Case Study%'
   OR name_path LIKE 'Grave Shape%'
   OR name_path LIKE 'Position of Find in Grave%'
   OR name_path LIKE 'Sex%'
   OR name_path LIKE 'Stylistic Classification%'
   OR name_path LIKE 'Color%'
   OR name_path LIKE 'Condition of Burial%'
   OR name_path LIKE 'Discoloration Staining Adhesion%'
   OR name_path LIKE 'Stylistic Classification%'
   OR name_path LIKE 'Count%'
UNION ALL
SELECT DISTINCT 'dimensions' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM thanados.types_all
WHERE name_path LIKE 'Dimensions%'
UNION ALL
SELECT DISTINCT 'material' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM thanados.types_all
WHERE name_path LIKE 'Material%'
UNION ALL
SELECT DISTINCT 'value' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM thanados.types_all
WHERE name_path LIKE 'Body Height%' OR
name_path LIKE 'Isotopic Analyses%' OR
name_path LIKE 'Count%' OR
name_path LIKE 'Bone measurements%' OR
name_path LIKE 'Absolute Age%'
UNION ALL
SELECT DISTINCT 'find' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM thanados.types_all
WHERE name_path LIKE 'Artifact%'
UNION ALL
SELECT DISTINCT 'osteology' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM thanados.types_all
WHERE name_path LIKE 'Human remains%'
UNION ALL
SELECT DISTINCT 'strat' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM thanados.types_all
WHERE name_path LIKE 'Stratigraphic unit%'
UNION ALL
SELECT DISTINCT 'burial_site' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM thanados.types_all
WHERE name_path LIKE '%Burial Site%'
UNION ALL
SELECT DISTINCT 'feature' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM thanados.types_all
WHERE name_path LIKE 'Feature%'

ORDER BY level, name_path;

UPDATE thanados.typesforjson
SET parent = '#'
WHERE parent ISNULL; --necessary for jstree
UPDATE thanados.typesforjson
SET parent = '#'
WHERE parent = '73'; --necessary for jstree (removes parent from burial site type)
--INSERT INTO thanados.typesforjson (level, id, text, parent, path, name_path, forms, topparent)
--VALUES ('find', '157754', 'Artifact', '#', '157754', 'Artifact', '["artifact", "find"]', 157754);
--hack because find has no parent

-- create table with all types as json
DROP TABLE IF EXISTS thanados.typesjson;
CREATE TABLE thanados.typesjson AS (
    SELECT jsonb_agg(jsonb_build_object('id', id,
                                        'text', text,
                                        'parent', parent,
                                        'namepath', name_path,
                                        'path', path,
                                        'level', level,
                                        'forms', forms
        )) as types
    FROM (SELECT *
          FROM thanados.typesforjson AS types
          GROUP BY types.level, types.id, types.text, types.parent, types.name_path, types.path, types.forms, types.topparent
          ORDER BY name_path) as u);
          
-- prepare data for charts

DROP TABLE IF EXISTS thanados.chart_data;
CREATE TABLE thanados.chart_data
(
    depth       JSONB,
    bodyheight  JSONB,
    orientation JSONB,
    azimuth     JSONB,
    sex         JSONB,
    gender      JSONB
);


DROP TABLE IF EXISTS thanados.depth_labels;
CREATE TABLE thanados.depth_labels AS (
-- get labels for depth of graves
    SELECT jsonb_agg(js.json_object_keys)
               AS labels
    FROM (SELECT json_object_keys(row_to_json)
          FROM (SELECT row_to_json(c.*)
                FROM (
                         SELECT count(*) FILTER (WHERE VALUE <= 20)                  AS "0-20",
                                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40)   AS "21-40",
                                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60)   AS "41-60",
                                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80)   AS "61-80",
                                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100)  AS "81-100",
                                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) AS "101-120",
                                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) AS "121-140",
                                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) AS "141-160",
                                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180) AS "161-180",
                                count(*) FILTER (WHERE VALUE > 180 AND VALUE <= 200) AS "181-200",
                                count(*) FILTER (WHERE VALUE > 200 AND VALUE <= 220) AS "201-220",
                                count(*) FILTER (WHERE VALUE > 220 AND VALUE <= 240) AS "221-240",
                                count(*) FILTER (WHERE VALUE > 240 AND VALUE <= 260) AS "241-260",
                                count(*) FILTER (WHERE VALUE > 260 AND VALUE <= 280) AS "261-280",
                                count(*) FILTER (WHERE VALUE > 280 AND VALUE <= 300) AS "281-300",
                                count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 320) AS "301-320",
                                count(*) FILTER (WHERE VALUE > 320 AND VALUE <= 340) AS "321-340",
                                count(*) FILTER (WHERE VALUE > 340 AND VALUE <= 360) AS "341-360",
                                count(*) FILTER (WHERE VALUE > 360 AND VALUE <= 380) AS "361-380",
                                count(*) FILTER (WHERE VALUE > 380 AND VALUE <= 400) AS "381-400",
                                count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 420) AS "401-420",
                                count(*) FILTER (WHERE VALUE > 420 AND VALUE <= 440) AS "421-440",
                                count(*) FILTER (WHERE VALUE > 440 AND VALUE <= 460) AS "441-460",
                                count(*) FILTER (WHERE VALUE > 460 AND VALUE <= 480) AS "461-480",
                                count(*) FILTER (WHERE VALUE > 480 AND VALUE <= 500) AS "481-500",
                                count(*) FILTER (WHERE VALUE > 500 AND VALUE <= 520) AS "501-520",
                                count(*) FILTER (WHERE VALUE > 520 AND VALUE <= 540) AS "521-540",
                                count(*) FILTER (WHERE VALUE > 540 AND VALUE <= 560) AS "541-560",
                                count(*) FILTER (WHERE VALUE > 560 AND VALUE <= 580) AS "561-580",
                                count(*) FILTER (WHERE VALUE > 580 AND VALUE <= 600) AS "581-600",
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

DROP TABLE IF EXISTS thanados.depth;
DROP TABLE IF EXISTS thanados.depth_labels;

UPDATE thanados.chart_depth
SET depth = REPLACE(depth, '"[', '[');
UPDATE thanados.chart_depth
SET depth = REPLACE(depth, ']"', ']');

INSERT INTO thanados.chart_data (depth)
SELECT depth::JSONB
FROM thanados.chart_depth;

DROP TABLE IF EXISTS thanados.chart_depth;


DROP TABLE IF EXISTS thanados.orientation_labels;
CREATE TABLE thanados.orientation_labels AS (
-- get labels for orientation of graves
    SELECT jsonb_agg(js.json_object_keys)
               AS labels
    FROM (SELECT json_object_keys(row_to_json)
          FROM (SELECT row_to_json(c.*)
                FROM (
                         SELECT count(*) FILTER (WHERE VALUE <= 20)                  AS "0-20",
                                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40)   AS "21-40",
                                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60)   AS "41-60",
                                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80)   AS "61-80",
                                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100)  AS "81-100",
                                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) AS "101-120",
                                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) AS "121-140",
                                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) AS "141-160",
                                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180) AS "161-180",
                                count(*) FILTER (WHERE VALUE > 180 AND VALUE <= 200) AS "181-200",
                                count(*) FILTER (WHERE VALUE > 200 AND VALUE <= 220) AS "201-220",
                                count(*) FILTER (WHERE VALUE > 220 AND VALUE <= 240) AS "221-240",
                                count(*) FILTER (WHERE VALUE > 240 AND VALUE <= 260) AS "241-260",
                                count(*) FILTER (WHERE VALUE > 260 AND VALUE <= 280) AS "261-280",
                                count(*) FILTER (WHERE VALUE > 280 AND VALUE <= 300) AS "281-300",
                                count(*) FILTER (WHERE VALUE > 300 AND VALUE <= 320) AS "301-320",
                                count(*) FILTER (WHERE VALUE > 320 AND VALUE <= 340) AS "321-340",
                                count(*) FILTER (WHERE VALUE > 340 AND VALUE <= 360) AS "341-360"
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

DROP TABLE IF EXISTS thanados.orientation_labels;
DROP TABLE IF EXISTS thanados.orientation;

UPDATE thanados.chart_orientation
SET orientation = REPLACE(orientation, '"[', '[');
UPDATE thanados.chart_orientation
SET orientation = REPLACE(orientation, ']"', ']');

UPDATE thanados.chart_data
SET orientation = (SELECT orientation::JSONB FROM thanados.chart_orientation);

DROP TABLE IF EXISTS thanados.chart_orientation;

DROP TABLE IF EXISTS thanados.azimuth_labels;
CREATE TABLE thanados.azimuth_labels AS (
-- get labels for azimuth of graves
    SELECT jsonb_agg(js.json_object_keys)
               AS labels
    FROM (SELECT json_object_keys(row_to_json)
          FROM (SELECT row_to_json(c.*)
                FROM (
                         SELECT count(*) FILTER (WHERE VALUE <= 10)                  AS "0-10",
                                count(*) FILTER (WHERE VALUE > 10 AND VALUE <= 20)   AS "11-20",
                                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 30)   AS "21-30",
                                count(*) FILTER (WHERE VALUE > 30 AND VALUE <= 40)   AS "31-40",
                                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 50)   AS "41-50",
                                count(*) FILTER (WHERE VALUE > 50 AND VALUE <= 60)   AS "51-60",
                                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 70)   AS "61-70",
                                count(*) FILTER (WHERE VALUE > 70 AND VALUE <= 80)   AS "71-80",
                                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 90)   AS "81-90",
                                count(*) FILTER (WHERE VALUE > 90 AND VALUE <= 100)  AS "91-100",
                                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 110) AS "101-110",
                                count(*) FILTER (WHERE VALUE > 110 AND VALUE <= 120) AS "111-120",
                                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 130) AS "121-130",
                                count(*) FILTER (WHERE VALUE > 130 AND VALUE <= 140) AS "131-140",
                                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 150) AS "141-150",
                                count(*) FILTER (WHERE VALUE > 150 AND VALUE <= 160) AS "151-160",
                                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 170) AS "161-170",                                
                                count(*) FILTER (WHERE VALUE > 170 AND VALUE <= 180) AS "171-180"                                
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

DROP TABLE IF EXISTS thanados.azimuth_labels;
DROP TABLE IF EXISTS thanados.azimuth;

UPDATE thanados.chart_azimuth
SET azimuth = REPLACE(azimuth, '"[', '[');
UPDATE thanados.chart_azimuth
SET azimuth = REPLACE(azimuth, ']"', ']');

UPDATE thanados.chart_data
SET azimuth = (SELECT azimuth::JSONB FROM thanados.chart_azimuth);

DROP TABLE IF EXISTS thanados.chart_azimuth;

-- gender start

DROP TABLE IF EXISTS thanados.gender;
CREATE TABLE thanados.gender AS (
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
             WHERE d.path LIKE 'Gender >%') s
             JOIN (
        SELECT g.parent_id        AS site_id,
               count(g.parent_id) AS burialcount
        FROM thanados.tbl_sites s
                 JOIN thanados.graves g ON g.parent_id = s.id
                 JOIN thanados.burials b ON g.child_id = b.parent_id
        GROUP by g.parent_id
    ) bc ON s.parent_id = bc.site_id
    GROUP BY site_name, parent_id, burialcount);

DROP TABLE IF EXISTS thanados.chart_gender;
CREATE TABLE thanados.chart_gender
(
    gender TEXT
);

INSERT INTO thanados.chart_gender (gender)
    (SELECT jsonb_build_object(
                    'labels', array_to_json('{"male", "female", "unknown"}'::TEXT[]),
                    'datasets', jsonb_agg(d)
                )
     FROM thanados.gender d);
     
DROP TABLE IF EXISTS thanados.gender;     

UPDATE thanados.chart_gender
SET gender = REPLACE(gender, '"[', '[');
UPDATE thanados.chart_gender
SET gender = REPLACE(gender, ']"', ']');

UPDATE thanados.chart_data
SET gender = (SELECT gender::JSONB FROM thanados.chart_gender);
DROP TABLE IF EXISTS thanados.chart_gender;

-- gender end

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
             WHERE d.path LIKE 'Sex >%') s
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
     
DROP TABLE IF EXISTS thanados.sex;     

UPDATE thanados.chart_sex
SET sex = REPLACE(sex, '"[', '[');
UPDATE thanados.chart_sex
SET sex = REPLACE(sex, ']"', ']');

UPDATE thanados.chart_data
SET sex = (SELECT sex::JSONB FROM thanados.chart_sex);
DROP TABLE IF EXISTS thanados.chart_sex;

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
    SELECT e.child_id, e.child_name, 'timespan' AS type, NULL AS path, 0 AS type_id, e.begin_from AS min, e.end_to AS max, e.openatlas_class_name FROM thanados.entities e WHERE e.child_id != 0
    UNION ALL
    SELECT e.child_id, e.child_name, t.name AS type, t.path AS path, t.id AS type_id, t.value::double precision AS min, t.value::double precision AS max, e.openatlas_class_name FROM thanados.entities e LEFT JOIN thanados.types_main t ON e.child_id = t.entity_id WHERE e.child_id != 0 ORDER BY child_id;


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
		WHERE se.openatlas_class_name = 'artifact' AND s.lon != ''

UNION ALL

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
		JOIN thanados.humanremains f ON se.child_id = f.child_id
		JOIN thanados.burials b ON f.parent_id = b.child_id
		JOIN thanados.graves g ON b.parent_id = g.child_id
		JOIN thanados.sites s ON g.parent_id = s.child_id
		WHERE se.openatlas_class_name = 'human_remains' AND s.lon != ''

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
		WHERE se.openatlas_class_name = 'stratigraphic_unit' AND s.lon != ''

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
		WHERE se.openatlas_class_name = 'feature' AND s.lon != ''

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
		WHERE se.openatlas_class_name = 'place' AND s.lon != ''); 

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


DROP TABLE IF EXISTS thanados.valueageatdeath;
CREATE TABLE thanados.valueageatdeath AS (
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
          FROM (
                    SELECT a.site_id, c.name AS sitename, a.avg AS agemin, b.avg AS agemax, (a.avg + b.avg)/2 AS average FROM

(SELECT site_id, child_id, child_name, avg(min) AS avg FROM thanados.searchdata
WHERE type_id IN (117199)
GROUP BY site_id, child_id, child_name ORDER BY avg desc) a JOIN

(SELECT site_id, child_id, child_name, avg(min) AS avg FROM thanados.searchdata
WHERE type_id IN (117200)
GROUP BY site_id, child_id, child_name ORDER BY avg desc) b ON a.child_id = b.child_id
                        JOIN model.entity c ON a.site_id = c.id
                    ) age
          GROUP BY sitename, site_id) ar ORDER BY site_id);


DROP TABLE IF EXISTS thanados.bodyheight_labels;
CREATE TABLE thanados.bodyheight_labels AS (
    SELECT '["0-10", "11-20", "21-30", "31-40", "41-50", "51-60", "61-70", "71-80", "81-90", "91-100", "101-110", "111-120", "121-130", "131-140", "141-150", "151-160", "161-170", "171-180", "181-190", "191-200", "over 200"]'::JSONB AS labels
);

DROP TABLE IF EXISTS thanados.bodyheight;
CREATE TABLE thanados.bodyheight AS (

SELECT b.name                                       AS "label",
       b.id                                         AS "site_id",
       '[' ||
       count(*) FILTER (WHERE a.VALUE <= 10) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 20 AND a.VALUE <= 30) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 30 AND a.VALUE <= 40) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 40 AND a.VALUE <= 50) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 50 AND a.VALUE <= 60) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 60 AND a.VALUE <= 70) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 70 AND a.VALUE <= 80) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 80 AND a.VALUE <= 90) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 90 AND a.VALUE <= 100) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 100 AND a.VALUE <= 110) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 110 AND a.VALUE <= 120) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 120 AND a.VALUE <= 130) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 130 AND a.VALUE <= 140) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 140 AND a.VALUE <= 150) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 150 AND a.VALUE <= 160) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 160 AND a.VALUE <= 170) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 170 AND a.VALUE <= 180) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 180 AND a.VALUE <= 190) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 190 AND a.VALUE <= 200) || ',' ||
       count(*) FILTER (WHERE a.VALUE > 200) || ']' AS data
FROM (
         SELECT site_id, child_id, (avg(min)::int) AS VALUE
         FROM thanados.searchdata
         WHERE type_id IN (SELECT id FROM thanados.types_all WHERE path LIKE '118155%')
         GROUP BY site_id, child_id) a
         JOIN model.entity b on a.site_id = b.id
GROUP BY b.name, b.id);

DROP TABLE IF EXISTS thanados.chart_bodyheight;
CREATE TABLE thanados.chart_bodyheight(bodyheight TEXT);
INSERT INTO thanados.chart_bodyheight (bodyheight)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM thanados.bodyheight_labels dl,
     thanados.bodyheight d
GROUP BY dl.labels;

DROP TABLE IF EXISTS thanados.bodyheight_labels;
DROP TABLE IF EXISTS thanados.bodyheight;

UPDATE thanados.chart_bodyheight
SET bodyheight = REPLACE(bodyheight, '"[', '[');
UPDATE thanados.chart_bodyheight
SET bodyheight = REPLACE(bodyheight, ']"', ']');

UPDATE thanados.chart_data
SET bodyheight = (SELECT bodyheight::JSONB FROM thanados.chart_bodyheight);

DROP TABLE IF EXISTS thanados.EntCount;
CREATE TABLE thanados.EntCount AS
    SELECT * FROM thanados.searchdata WHERE site_id IN (SELECT child_id from thanados.sites);
    """

    g.cursor.execute(sql7)
    restdone = datetime.now()
    print("time elapsed: " + str((restdone - jsonsdone)))

    endtime = datetime.now()
    print("finished")
    print("totaltime: " + str((endtime - start)))
    return redirect(url_for('admin'))


@app.route('/admin/filerefs', methods=['POST'])
@login_required
def admin_filerefs() -> str:
    sql_refs = """
    INSERT INTO model.link (range_id, domain_id, property_code, description) VALUES (%(range_id)s, %(domain_id)s, 'P67', %(page)s)
    """

    refs = json.loads(request.form['refs'])
    for row in refs:
        g.cursor.execute(sql_refs, {'domain_id': row['refId'], 'range_id': row['file_id'], 'page': row['page']})
    return jsonify(refs)

@app.route('/admin/geonames', methods=['POST'])
@login_required
def admin_geonames() -> str:
    id = (request.form['id'])
    GeoId = (request.form['GeoId'])
    sql_geonames = """
        INSERT INTO model.link (domain_id, range_id, property_code, description, type_id) 
            VALUES (155980, %(range_id)s::INT, 'P67', %(geoId)s::TEXT, 117126)
    """
    g.cursor.execute(sql_geonames,
                     {'range_id': id,
                      'geoId': GeoId})

    return id



@app.route('/admin/geoclean/')
@login_required
def geoclean_execute():  # pragma: no cover
    if current_user.group not in ['admin']:
        abort(403)

    g.cursor.execute("SELECT * FROM thanados.refsys")
    resultRefs = g.cursor.fetchall()

    # -*- coding: utf-8 -*-
    """favicon
    :copyright: (c) 2019 by Scott Werner.
    :license: MIT, see LICENSE for more details.
    """
    import os
    import re
    import warnings

    from collections import namedtuple

    from urllib.parse import urljoin, urlparse, urlunparse

    import requests

    from bs4 import BeautifulSoup

    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) '
                      'AppleWebKit/537.36 (KHTML, like Gecko) '
                      'Chrome/33.0.1750.152 Safari/537.36'
    }

    LINK_RELS = [
        'icon',
        'shortcut icon',
        'apple-touch-icon',
        'apple-touch-icon-precomposed',
    ]

    META_NAMES = ['msapplication-TileImage', 'og:image']

    SIZE_RE = re.compile(r'(?P<width>\d{2,4})x(?P<height>\d{2,4})', flags=re.IGNORECASE)

    Icon = namedtuple('Icon', ['url', 'width', 'height', 'format'])

    def get(url, *args, **request_kwargs):
        """Get all fav icons for a url.
        :param url: Homepage.
        :type url: str
        :param request_kwargs: Request headers argument.
        :type request_kwargs: Dict
        :return: List of fav icons found sorted by icon dimension.
        :rtype: list[:class:`Icon`]
        """
        if args:  # backwards compatible with <= v0.6.0
            warnings.warn(
                "headers arg is deprecated. Use headers key in request_kwargs dict.",
                DeprecationWarning
            )
            request_kwargs.setdefault('headers', args[0])

        request_kwargs.setdefault('headers', HEADERS)
        request_kwargs.setdefault('allow_redirects', True)

        response = requests.get(url, **request_kwargs)
        response.raise_for_status()

        icons = set()

        default_icon = default(response.url, **request_kwargs)
        if default_icon:
            icons.add(default_icon)

        link_icons = tags(response.url, response.text)
        if link_icons:
            icons.update(link_icons)

        return sorted(icons, key=lambda i: i.width + i.height, reverse=True)

    def default(url, **request_kwargs):
        """Get icon using default filename favicon.ico.
        :param url: Url for site.
        :type url: str
        :param request_kwargs: Request headers argument.
        :type request_kwargs: Dict
        :return: Icon or None.
        :rtype: :class:`Icon` or None
        """
        parsed = urlparse(url)
        favicon_url = urlunparse((parsed.scheme, parsed.netloc, 'favicon.ico', '', '', ''))
        response = requests.head(favicon_url, **request_kwargs)
        if response.status_code == 200:
            return Icon(response.url, 0, 0, 'ico')

    def tags(url, html):
        """Get icons from link and meta tags.
        .. code-block:: html
           <link rel="apple-touch-icon" sizes="144x144" href="apple-touch-icon.png">
           <meta name="msapplication-TileImage" content="favicon.png">
        :param url: Url for site.
        :type url: str
        :param html: Body of homepage.
        :type html: str
        :return: Icons found.
        :rtype: set
        """
        soup = BeautifulSoup(html, features='html.parser')

        link_tags = set()
        for rel in LINK_RELS:
            for link_tag in soup.find_all(
                    'link', attrs={'rel': lambda r: r and r.lower() == rel, 'href': True}
            ):
                link_tags.add(link_tag)

        meta_tags = set()
        for meta_tag in soup.find_all('meta', attrs={'content': True}):
            meta_type = meta_tag.get('name') or meta_tag.get('property') or ''
            meta_type = meta_type.lower()
            for name in META_NAMES:
                if meta_type == name.lower():
                    meta_tags.add(meta_tag)

        icons = set()
        for tag in link_tags | meta_tags:
            href = tag.get('href', '') or tag.get('content', '')
            href = href.strip()

            if not href or href.startswith('data:image/'):
                continue

            if is_absolute(href):
                url_parsed = href
            else:
                url_parsed = urljoin(url, href)

            # repair '//cdn.network.com/favicon.png' or `icon.png?v2`
            scheme = urlparse(url).scheme
            url_parsed = urlparse(url_parsed, scheme=scheme)

            width, height = dimensions(tag)
            _, ext = os.path.splitext(url_parsed.path)

            icon = Icon(url_parsed.geturl(), width, height, ext[1:].lower())
            icons.add(icon)

        return icons

    def is_absolute(url):
        """Check if url is absolute.
        :param url: Url for site.
        :type url: str
        :return: True if homepage and false if it has a path.
        :rtype: bool
        """
        return bool(urlparse(url).netloc)

    def dimensions(tag):
        """Get icon dimensions from size attribute or icon filename.
        :param tag: Link or meta tag.
        :type tag: :class:`bs4.element.Tag`
        :return: If found, width and height, else (0,0).
        :rtype: tuple(int, int)
        """
        sizes = tag.get('sizes', '')
        if sizes and sizes != 'any':
            size = sizes.split(' ')  # '16x16 32x32 64x64'
            size.sort(reverse=True)
            width, height = re.split(r'[x\xd7]', size[0])
        else:
            filename = tag.get('href') or tag.get('content')
            size = SIZE_RE.search(filename)
            if size:
                width, height = size.group('width'), size.group('height')
            else:
                width, height = '0', '0'

        # repair bad html attribute values: sizes='192x192+'
        width = ''.join(c for c in width if c.isdigit())
        height = ''.join(c for c in height if c.isdigit())
        return int(width), int(height)

    user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.47 Safari/537.36'
    headers = {'User-Agent': user_agent}
    for row in resultRefs:
        try:
            icons = get(row.website_url, headers=headers, timeout=2)
            ref_id = row.entity_id
            print(row.website_url)
            if icons:
                print(icons[0].url)
                print(icons[0].format)

                try:
                    response = requests.get(icons[0].url, stream=True)
                    with open(app.root_path + '/static/images/favicons/' + str(ref_id) + '.{}'.format(icons[0].format), 'wb') as image:
                        for chunk in response.iter_content(1024):
                            image.write(chunk)
                        fav_filename = '/static/images/favicons/' + str(ref_id) + '.' + icons[0].format

                    g.cursor.execute("UPDATE thanados.refsys SET icon_url = %(favicon_)s WHERE entity_id = %(ref_id)s",
                                  {'favicon_': fav_filename, 'ref_id': ref_id})
                except Exception:
                    print('Error downloading ' + row.website_url)
        except Exception:
            print('Error with ' + row.website_url)
    return redirect(url_for('admin'))


@app.route('/admin/imageprocessing/')
@login_required
def image_processing_execute():  # pragma: no cover
    if current_user.group not in ['admin']:
        abort(403)

    import os
    from PIL import Image, ImageChops
    from shutil import copy

    def remove_transparency(im, bg_colour=(255, 255, 255)):

        if im.mode in ('RGBA', 'LA') or (
                im.mode == 'P' and 'transparency' in im.info):
            alpha = im.convert('RGBA').split()[-1]
            bg = Image.new("RGBA", im.size, bg_colour + (255,))
            bg.paste(im, mask=alpha)
            return bg

        else:
            return im

    filesthere = 0
    print('Cropping files')
    sql = """
                SELECT id AS file, 0 AS ovl FROM model.entity WHERE openatlas_class_name = 'file' 
                                AND id IN (SELECT id FROM thanados.files)
                                """
    g.cursor.execute(sql)
    result = g.cursor.fetchall()
    filestotal = len(result)
    filesfailed = 0
    filesnotfound = 0
    filessizezero = 0
    filesdone = 0
    filesonlyconverted = 0

    failedlist = []
    for row in result:
        found = False
        imagetypes = ['.png', '.bmp', '.jpg', '.jpeg', '.glb']
        for extension in imagetypes:
            current_image = app.config[
                "UPLOAD_FOLDER_PATH"] + '/' + str(row.file) + extension

            newimage = (app.config["UPLOAD_JPG_FOLDER_PATH"] + '/' + str(row.file)
                + '.jpg')
            #os.makedirs(os.path.dirname(newimage), exist_ok=True)
            if os.path.isfile(current_image):
                found = True
                break

        if found and not os.path.isfile(newimage) and row.ovl == 0:
            try:
                im = Image.open(current_image)
                imageBox = im.getbbox()
                im = im.crop(imageBox)
                im.load()

                bg = Image.new(im.mode, im.size, im.getpixel((0, 0)))
                width, height = im.size
                diff = ImageChops.difference(im, bg)
                diff = ImageChops.add(diff, diff, 2.0, -100)
                bbox = diff.getbbox()
                newbbox = list(bbox)
                if newbbox[0]  >= 25:
                    newbbox[0] -= 25
                else:
                    newbbox[0] = 0

                if newbbox[1] >= 25:
                    newbbox[1] -= 25
                else:
                    newbbox[1] = 0

                if width - newbbox[2] >= 25:
                    newbbox[2] += 25
                else:
                    newbbox[2] = width

                if height - newbbox[3] >= 25:
                    newbbox[3] += 25
                else:
                    newbbox[3] = height

                bbox = tuple(newbbox)
                if bbox:
                    if not im.crop(bbox).size == (0,0):
                        try:
                            im.crop(bbox)
                            im = remove_transparency(im)
                            im.convert('RGB').save(newimage)
                            message_ = 'cropped and converted ' + newimage
                            filesdone += 1
                        except Exception:
                            im = Image.open(current_image)
                            im.load()
                            im.convert('RGB').save(newimage)
                            message_ = 'old image kept ' + newimage
                            filesonlyconverted +=1
                    else:
                        message_ = 'size 0? at ' + str(row.file)
                        filessizezero +=1
                        failedlist.append(str(filesthere) + ':' + str(row.file) + ' + size 0')


            except Exception:
                    message_ = ('Cropping error with file ' + current_image + '.')
                    try:
                        copy(
                        current_image,
                        app.config["UPLOAD_JPG_FOLDER_PATH"] + '/')
                        message_ = ('kept original file, check:' + current_image)
                        failedlist.append(str(filesthere) + ':' + str(row.file) + ' kept the original. Check the file')
                    except Exception:
                        filesfailed += 1
                        failedlist.append(str(filesthere) + ':' + str(row.file) +  ' general error')



        elif found and os.path.isfile(newimage):
            message_ = (current_image + ' already done ')
            found = True
        elif row.ovl == 1:
            try:
                copy(
                    current_image,
                    app.config["UPLOAD_JPG_FOLDER_PATH"] + '/')
                message_ = ('kept original file, Map Overlay:' + current_image)
            except Exception:
                message_ = ('Error, Map Overlay:' + current_image)
                filesfailed += 1
                failedlist.append(
                    str(filesthere) + ':' + str(row.file) + ' map overlay')

        if not found:
            filesnotfound += 1
            print(current_image)
            message_ = str(row.file) + ': file missing'

        filesthere += 1
        print(str(int(
            filesthere / filestotal * 100)) + "% - File: " + str(row.file) + " - " + str(
            filesthere) + " of " + str(filestotal) + ": " + message_)


    print(str(filestotal - (filesfailed + filesnotfound)) + ' of ' + str(filestotal) + ' successully done. ' + str(filesnotfound) + ' not found')
    print( str(len(failedlist)) + ' failed files:')
    print(failedlist)
    return redirect(url_for('admin'))


@app.route('/admin/download_files/')
@login_required
def download_files():
    if current_user.group != 'admin':
        abort(403)
    api_download()
    return redirect(url_for('admin'))
