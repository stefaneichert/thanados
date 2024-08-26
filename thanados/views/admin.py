import json
import sys
from datetime import datetime
from fileinput import filename

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
        g.cursor.execute('SELECT child_id FROM devill.sites;')
        g.site_list = [row.child_id for row in g.cursor.fetchall()]

    if form.validate_on_submit():
        try:
            with open(app.root_path + "/../instance/site_list.txt",
                      'w') as file:
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
                        SELECT child_id, child_name, type, 1 AS used FROM devill.searchdata WHERE path LIKE 'Place >%%' AND child_id IN %(site_ids)s
                        UNION all
                        SELECT child_id, child_name, type, 0 AS used FROM devill.searchdata WHERE path LIKE 'Place >%%' AND child_id NOT IN %(site_ids)s
                        ) AS allsites 
                    
    """

    try:
        g.cursor.execute(sql, {'site_ids': tuple(g.site_list)})
        currentsitelist = g.cursor.fetchone()
    except Exception:
        currentsitelist = []

    sql_missing_refs = """
        
SELECT jsonb_agg(jsonb_build_object('id', parent_id::TEXT, 'name', child_name)) AS nm FROM (SELECT DISTINCT r.parent_id, e.child_name
FROM devill.reference r
         JOIN devill.sites e ON e.child_id = r.parent_id
WHERE r.parent_id IN
      (SELECT parent_id
       FROM (SELECT parent_id
             FROM (SELECT parent_id, COUNT(parent_id) AS number from devill.reference GROUP BY parent_id) n
             WHERE number > 1) d
       WHERE d.parent_id NOT IN
             (SELECT parent_id
              FROM devill.reference
              WHERE parent_id IN
                    (SELECT parent_id
                     FROM (SELECT parent_id, COUNT(parent_id) AS number from devill.reference GROUP BY parent_id) n
                     WHERE number > 1)
                AND reference LIKE '%%##main')
ORDER BY parent_id)) nma WHERE nma.parent_id IN %(site_ids)s"""

    try:
        g.cursor.execute(sql_missing_refs, {'site_ids': tuple(g.site_list)})
        missingrefs = g.cursor.fetchone()[0]
        if missingrefs == None:
            missingrefs = []
        print('Missing references:')
        print(missingrefs)
    except Exception:
        missingrefs = []

    sql_missing_geonames = """
    SELECT jsonb_agg(jsonb_build_object('id', child_id::TEXT, 'name', child_name, 'lat', lat, 'lon', lon)) AS ng FROM (SELECT lon::double precision, lat::double precision, child_name, child_id FROM devill.sites WHERE child_id NOT IN (
SELECT parent_id FROM devill.extrefs WHERE name = 'GeoNames')) ng1 WHERE ng1.child_id IN %(site_ids)s AND ng1.child_id NOT IN (SELECT range_id from model.link WHERE property_code = 'P67' AND domain_id = 155980) 
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
                    FROM devill.files f

                             JOIN devill.searchdata s ON f.parent_id = s.child_id
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
            SELECT jsonb_agg(jsonb_build_object('id', child_id::TEXT, 'name', child_name)) AS ng FROM (SELECT * FROM devill.sites WHERE geom IS NULL) a
                """
    try:
        g.cursor.execute(sql_missing_geo)  # , {'site_ids': tuple(g.site_list)})
        missingeo = g.cursor.fetchone()[0]
        if missingeo == None:
            missingeo = []
    except Exception:
        missingeo = []

    return render_template('admin/index.html', form=form, refs=refs,
                           sites=currentsitelist,
                           openatlas_url=app.config["OPENATLAS_URL"].replace(
                               'update', 'entity'), missingrefs=missingrefs,
                           missingeonames=missingeonames,
                           missingfileref=missingfileref, missingeo=missingeo)


@app.route('/admin/execute/')
@login_required
def jsonprepare_execute():  # pragma: no cover
    if current_user.group not in ['admin']:
        abort(403)

    start = datetime.now()
    print("starting processing basic queries at: " + str(
        start.strftime("%H:%M:%S")))

    sql_1 = """ 
DROP SCHEMA IF EXISTS devill CASCADE;

CREATE SCHEMA devill;
-- create temp tables

DROP TABLE IF EXISTS devill.entity;
CREATE TABLE devill.entity AS SELECT * FROM model.entity;


DROP TABLE IF EXISTS devill.link;
CREATE TABLE devill.link AS SELECT * FROM model.link;

-- all types tree
DROP TABLE IF EXISTS devill.types_all;
CREATE TABLE devill.types_all AS
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
                WHERE openatlas_class_name = 'type' OR openatlas_class_name = 'administrative_unit') x
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
                WHERE openatlas_class_name LIKE 'type'::text  AND link.property_code = 'P127' OR openatlas_class_name LIKE 'administrative_unit'::text  AND link.property_code = 'P89') x
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
          
UPDATE devill.types_all SET topparent = f.topparent, forms = f.forms
    FROM (SELECT tp.id, tp.name_path, tp.topparent, jsonb_agg(DISTINCT f.name) AS forms
        FROM (SELECT id::INTEGER, path, name_path, left(path, strpos(path, ' >') -1)::INTEGER AS
            topparent FROM devill.types_all WHERE path LIKE '%>%'
                    UNION ALL
            SELECT id::INTEGER, path, name_path, PATH::INTEGER AS topparent FROM
                devill.types_all WHERE path NOT LIKE '%>%' ORDER BY name_path) tp JOIN (select openatlas_class_name as name, hierarchy_id FROM
	                web.hierarchy_openatlas_class) f
	                ON  f.hierarchy_id = tp.topparent
	                GROUP BY tp.id, tp.name_path, tp.topparent ORDER BY name_path) f
	WHERE devill.types_all.id = f.id;


-- create table with sites to be used
DROP TABLE IF EXISTS devill.sites;
CREATE TABLE devill.sites AS (
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
             JOIN devill.types_all t ON t.id = s.range_id
    WHERE t.name_path LIKE 'Place > %' AND s.id IN (SELECT domain_id FROM model.link WHERE range_id = 198159 AND property_code = 'P2') -- replace with the top parent of the place category of which you want to show
);

-- set polygons as main geometry where available
UPDATE devill.sites
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom_polygon) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53' AND pl.geom_polygon IS NOT NULL) AS poly       
WHERE child_id = poly.id;

-- get centerpoint data if a point geometry is available
UPDATE devill.sites
SET (lat, lon) = (ST_X(point.geom_point), ST_Y(point.geom_point))
FROM (SELECT geom_point,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53' AND pl.geom_point IS NOT NULL) AS point
WHERE child_id = point.id;

-- set point as main geometry if no polygon is available
UPDATE devill.sites
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom_point) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53' AND pnt.geom_point IS NOT NULL) AS point
WHERE child_id = point.id
  AND devill.sites.geom ISNULL;

-- get centerpoint data of polygons
UPDATE devill.sites
SET (lat, lon) = (ST_X(center), ST_Y(center))
FROM (SELECT ST_PointOnSurface(geom_polygon) AS center,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53' AND pl.geom_polygon IS NOT NULL) AS poly
WHERE child_id = poly.id;


-- graves table with all data on grave level
DROP TABLE IF EXISTS devill.graves;
CREATE TABLE devill.graves AS
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
WHERE parent.id in (SELECT child_id FROM devill.sites)
  AND l_p_c.property_code = 'P46' AND child.openatlas_class_name = 'feature'
ORDER BY child.openatlas_class_name, parent.id, child.name;

-- if no graves are available create an intermediate feature to be displayed on the map
INSERT INTO devill.graves (
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
     FROM devill.sites WHERE child_id NOT IN (SELECT DISTINCT parent_id FROM devill.graves));

UPDATE devill.graves
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom_polygon) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53' AND pl.geom_polygon IS NOT NULL) AS poly
WHERE child_id = poly.id;

UPDATE devill.graves
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom_point) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53' AND pnt.geom_point IS NOT NULL) AS point
WHERE child_id = point.id
  AND devill.graves.geom ISNULL;

--UPDATE devill.graves g
--SET geom = a.geom
--FROM (SELECT s.child_id, s.geom FROM devill.sites s JOIN devill.graves g ON g.parent_id = s.child_id WHERE g.geom IS NULL) a WHERE a.child_id = g.parent_id AND g.geom IS NULL;

--burials
DROP TABLE IF EXISTS devill.burials;
CREATE TABLE devill.burials AS
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
WHERE parent.id in (SELECT child_id FROM devill.graves)
  AND l_p_c.property_code = 'P46'
ORDER BY child.openatlas_class_name, parent.id, child.name;


UPDATE devill.burials
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom_polygon) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53' AND pl.geom_polygon IS NOT NULL) AS poly
WHERE child_id = poly.id;

UPDATE devill.burials
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom_point) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53' AND pnt.geom_point IS NOT NULL) AS point
WHERE child_id = point.id
  AND devill.burials.geom ISNULL;

--finds
DROP TABLE IF EXISTS devill.finds;
CREATE TABLE devill.finds AS
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
WHERE parent.id in (SELECT child_id FROM devill.burials)
  AND l_p_c.property_code = 'P46' AND child.openatlas_class_name = 'artifact'
ORDER BY child.openatlas_class_name, parent.id, child.name;


UPDATE devill.finds
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom_polygon) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53' AND pl.geom_polygon IS NOT NULL) AS poly
WHERE child_id = poly.id;

UPDATE devill.finds
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom_point) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53' AND pnt.geom_point IS NOT NULL) AS point
WHERE child_id = point.id
  AND devill.finds.geom ISNULL;
  
--humanremains
DROP TABLE IF EXISTS devill.humanremains;
CREATE TABLE devill.humanremains AS
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
WHERE parent.id in (SELECT child_id FROM devill.burials)
  AND l_p_c.property_code = 'P46' AND child.openatlas_class_name = 'human_remains'
ORDER BY child.openatlas_class_name, parent.id, child.name;


UPDATE devill.humanremains
SET geom = poly.geom
FROM (SELECT ST_AsGeoJSON(pl.geom_polygon) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pl ON l.range_id = pl.entity_id
      WHERE l.property_code = 'P53' AND pl.geom_polygon IS NOT NULL) AS poly
WHERE child_id = poly.id;

UPDATE devill.humanremains
SET geom = point.geom
FROM (SELECT ST_AsGeoJSON(pnt.geom_point) AS geom,
             e.id
      FROM model.entity e
               JOIN model.link l ON e.id = l.domain_id
               JOIN model.gis pnt ON l.range_id = pnt.entity_id
      WHERE l.property_code = 'P53' AND pnt.geom_point IS NOT NULL) AS point
WHERE child_id = point.id
  AND devill.humanremains.geom ISNULL;

-- all entities union
CREATE TABLE devill.entitiestmp AS
SELECT *
FROM devill.sites
UNION ALL
SELECT *
FROM devill.graves
UNION ALL
SELECT *
FROM devill.burials
UNION ALL
SELECT *
FROM devill.finds
UNION ALL
SELECT *
FROM devill.humanremains
ORDER BY parent_id, child_name;

UPDATE devill.entitiestmp
SET begin_comment = NULL
WHERE begin_comment = '';
UPDATE devill.entitiestmp
SET end_comment = NULL
WHERE end_comment = '';
UPDATE devill.entitiestmp
SET begin_comment = NULL
WHERE begin_comment = 'None';
UPDATE devill.entitiestmp
SET end_comment = NULL
WHERE end_comment = 'None';
UPDATE devill.entitiestmp
SET description = NULL
WHERE description = '';


-- fill timespan dates if NULL with from_values
UPDATE devill.entitiestmp SET begin_to = begin_from WHERE begin_from IS NOT NULL and begin_to IS NULL;
UPDATE devill.entitiestmp SET begin_from = begin_to WHERE begin_to IS NOT NULL and begin_from IS NULL;
UPDATE devill.entitiestmp SET end_to = end_from WHERE end_from IS NOT NULL and end_to IS NULL;
UPDATE devill.entitiestmp SET end_from = end_to WHERE end_to IS NOT NULL and end_from IS NULL;


CREATE TABLE devill.entitiestmp2 AS 
SELECT
e.*, l.range_id AS place_id FROM devill.entitiestmp e LEFT JOIN model.link l ON e.child_id = l.domain_id WHERE l.property_code = 'P53'
UNION ALL
SELECT e.*, NULL AS place_id FROM devill.entitiestmp e WHERE e.child_id = 0;

DROP TABLE devill.entitiestmp;
CREATE TABLE devill.entitiestmp AS SELECT * FROM devill.entitiestmp2;
DROP TABLE devill.entitiestmp2;



"""
    g.cursor.execute(sql_1)

    endfirst = datetime.now()
    print("time elapsed:" + str((endfirst - start)))

    print("processing nearest neighbour:")
    nntime = datetime.now()

    sql = """
                    DROP TABLE IF EXISTS devill.knn;
                    CREATE TABLE devill.knn AS

                    SELECT DISTINCT
                           g.parent_id,
                           e.name,
                           e.id,
                           (st_pointonsurface(pl.geom_polygon)) AS centerpoint,
                           NULL::INTEGER AS nid,
                           NULL::TEXT AS nname,
                           NULL::DOUBLE PRECISION AS distance,
                           NULL::geometry AS npoint

                          FROM model.entity e
                                   JOIN model.link l ON e.id = l.domain_id
                                    JOIN devill.graves g ON e.id = g.child_id
                                   JOIN model.gis pl ON l.range_id = pl.entity_id
                          WHERE l.property_code = 'P53' AND pl.geom_polygon IS NOT NULL
                          AND g.child_id != 0;

                          --delete sites with  only one grave
                          DELETE FROM devill.knn WHERE parent_id IN (
                          SELECT parent_id FROM (SELECT parent_id, COUNT(parent_id) FROM (SELECT DISTINCT
                           g.parent_id,
                           e.name,
                           e.id,
                           (st_pointonsurface(pl.geom_polygon)) AS centerpoint,
                           NULL::INTEGER AS nid,
                           NULL::TEXT AS nname,
                           NULL::DOUBLE PRECISION AS distance,
                           NULL::geometry AS npoint

                          FROM model.entity e
                                   JOIN model.link l ON e.id = l.domain_id
                                    JOIN devill.graves g ON e.id = g.child_id
                                   JOIN model.gis pl ON l.range_id = pl.entity_id
                          WHERE l.property_code = 'P53' AND pl.geom_polygon IS NOT NULL) a GROUP BY parent_id) b WHERE b.count <= 1 ORDER BY b.count ASC);

                    SELECT * FROM devill.knn;
                    """
    g.cursor.execute(sql)
    result = g.cursor.fetchall()

    sql2 = """
                    UPDATE devill.knn ok SET nid=n.id, nname=n.name, npoint=n.npoint FROM 
                    (SELECT 
                        id,
                        name,
                        parent_id,
                        centerpoint AS npoint
                    FROM
                      devill.knn WHERE id != %(polyId)s 
                    ORDER BY
                      knn.centerpoint <->
                      (SELECT DISTINCT centerpoint FROM devill.knn WHERE id = %(polyId)s AND parent_id = %(parentId)s AND id NOT IN (SELECT id FROM (SELECT id, count(centerpoint) FROM devill.knn GROUP BY id ORDER BY count DESC) a WHERE count > 1))
                    LIMIT 1) n WHERE ok.id = %(polyId)s AND n.parent_id = %(parentId)s;
            """
    nearestneighbour = 0
    for row in result:
        sys.stdout.write("\rneighbours found: " + str(nearestneighbour))
        sys.stdout.flush()
        g.cursor.execute(sql2, {'polyId': row.id, 'parentId': row.parent_id})
        nearestneighbour = nearestneighbour + 1

    g.cursor.execute("DELETE FROM devill.knn WHERE nid ISNULL")
    g.cursor.execute(
        "UPDATE devill.knn SET distance = ROUND(st_distancesphere(st_astext(centerpoint), st_astext(npoint))::numeric, 2)")

    print("")
    nntimeend = datetime.now()
    print('time elapsed: ' + str((nntimeend - nntime)))

    sqlTypes = """
            --types
DROP TABLE IF EXISTS devill.types_main;
CREATE TABLE devill.types_main AS
SELECT DISTINCT types_all.id,
                types_all.parent_id,
                entitiestmp.child_id AS entity_id,
                types_all.name,
                types_all.description,
                link.description     AS value,
                types_all.name_path  AS path
FROM devill.types_all,
     devill.entitiestmp,
     model.link
WHERE (entitiestmp.child_id = link.domain_id OR entitiestmp.place_id = link.domain_id)
  AND link.range_id = types_all.id
  AND devill.entitiestmp.child_id != 0
ORDER BY entity_id, types_all.name_path;

UPDATE devill.types_main
SET description = NULL
WHERE description = '';

--types main
DROP TABLE IF EXISTS devill.maintype;
CREATE TABLE devill.maintype AS
SELECT *
FROM devill.types_main
WHERE path LIKE 'Place >%'
   OR path LIKE 'Feature >%'
   OR path LIKE 'Stratigraphic unit >%'
   OR path LIKE 'Artifact >%'
   OR path LIKE 'Human remains >%'
ORDER BY entity_id, path;

--types dimensions
DROP TABLE IF EXISTS devill.dimensiontypes;
CREATE TABLE devill.dimensiontypes AS
SELECT *
FROM devill.types_main
WHERE path LIKE 'Dimensions >%'
ORDER BY entity_id, path;

-- HACK: set orientation of grave to burial because some did enter the orientation on the grave level and not at the burial level
DROP TABLE IF EXISTS devill.graveDeg;
CREATE TABLE devill.graveDeg AS
SELECT 
	d.*,
	e.openatlas_class_name,
	b.child_id AS burial_id
	FROM devill.dimensiontypes d JOIN model.entity e ON d.entity_id = e.id JOIN devill.burials b ON e.id = b.parent_id WHERE d.id = 26192 AND b.child_id NOT IN 
		(SELECT 
			d.entity_id
			FROM devill.dimensiontypes d JOIN model.entity e ON d.entity_id = e.id JOIN devill.burials b ON e.id = b.child_id WHERE d.id = 26192);

INSERT INTO devill.dimensiontypes SELECT id, parent_id, burial_id, name, description, value, path FROM devill.graveDeg;

DROP TABLE IF EXISTS devill.giscleanup2;
CREATE TABLE devill.giscleanup2 AS
 (
SELECT 	e.openatlas_class_name,
	e.child_name,
	e.parent_id,
	e.child_id,
	l.property_code,
	l.range_id,
	g.id,
	g.geom_polygon AS geom
	FROM devill.graves e JOIN model.link l ON e.child_id = l.domain_id JOIN model.gis g ON l.range_id = g.entity_id WHERE l.property_code = 'P53' AND g.geom_polygon IS NOT NULL);

DROP TABLE IF EXISTS devill.derivedDegtmp;
CREATE TABLE devill.derivedDegtmp AS
(SELECT 
	ST_StartPoint(ST_LineMerge(ST_ApproximateMedialAxis(ST_OrientedEnvelope(g.geom)))) AS startP,
	ST_EndPoint(ST_LineMerge(ST_ApproximateMedialAxis(ST_OrientedEnvelope(g.geom)))) AS endP,
	child_id FROM devill.giscleanup2 g WHERE openatlas_class_name = 'feature');


-- Get azimuth of grave if a polygon is known
DROP TABLE IF EXISTS devill.derivedDeg;
CREATE TABLE devill.derivedDeg AS
(SELECT 
    ST_X(startP) AS onePoint,
    ST_X(endP) AS otherPoint,
	degrees(ST_Azimuth(startP, endP)) AS degA_B,
	degrees(ST_Azimuth(endP, startP)) AS degB_A,
	child_id FROM devill.derivedDegtmp);
	--41sec before, 14sec after... 

DROP TABLE IF EXISTS devill.giscleanup2;
DROP TABLE IF EXISTS devill.derivedDegtmp;

-- get lower value of azimuth
DROP TABLE IF EXISTS devill.azimuth;
CREATE TABLE devill.azimuth AS (
SELECT 
	g.*,
	g.degA_B::integer AS Azimuth
	FROM devill.derivedDeg g WHERE degA_B <= degB_A
UNION ALL
	SELECT 
	g.*,
	g.degB_A::integer AS Azimuth
	FROM devill.derivedDeg g WHERE degB_A <= degA_B);
	
DROP TABLE IF EXISTS devill.derivedDeg;
	
--insert azimuth into dimensiontypes
INSERT INTO devill.dimensiontypes 
    SELECT
        118730,
        15678,
        child_id,
        'Azimuth',
        '°',
        Azimuth::integer,
        'Dimensions > Azimuth'
        FROM devill.azimuth;
         
DROP TABLE IF EXISTS devill.azimuth;

--hack for setting burial orientation to grave orientation if grave does not have any. Comment/Uncomment depending on your preferences
INSERT INTO devill.dimensiontypes (id, parent_id, entity_id, name, description, value, path)
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
            FROM devill.graves g
                     JOIN devill.burials b ON g.child_id = b.parent_id
                     JOIN devill.dimensiontypes d ON b.child_id = d.entity_id
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
             FROM devill.burials
             GROUP BY parent_id) c
       WHERE c.count > 1);
       
       
--hack for getting graves azimuth from polygon orientation. Comment/Uncomment depending on your preferences
/*INSERT INTO devill.dimensiontypes (id, parent_id, entity_id, name, description, value, path)
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
            FROM devill.graves g
                     JOIN devill.burials b ON g.child_id = b.parent_id
                     JOIN devill.dimensiontypes d ON b.child_id = d.entity_id
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
             FROM devill.burials
             GROUP BY parent_id) c
       WHERE c.count > 1);*/

--insert nearest neighbour distance 
INSERT INTO devill.dimensiontypes 
    SELECT
        148713,
        15678,
        id,
        'Nearest Neighbour',
        'm',
        distance,
        'Dimensions > Distance > Nearest Neighbour'
        FROM devill.knn;
         
--DROP TABLE IF EXISTS devill.azimuth;


--types material
DROP TABLE IF EXISTS devill.materialtypes;
CREATE TABLE devill.materialtypes AS
SELECT *
FROM devill.types_main
WHERE path LIKE 'Material >%'
ORDER BY entity_id, path;

DROP TABLE IF EXISTS devill.radiocarbon;
CREATE TABLE devill.radiocarbon AS
SELECT *, 'unique' AS rc_type
FROM devill.types_main
WHERE path LIKE 'Radiocarbon Dating >%'
ORDER BY entity_id, path;


--other types
DROP TABLE IF EXISTS devill.types;
CREATE TABLE devill.types AS
SELECT *
FROM devill.types_main
WHERE path NOT LIKE 'Dimensions >%'
  AND path NOT LIKE 'Place >%'
  AND path NOT LIKE 'Feature >%'
  AND path NOT LIKE 'Stratigraphic unit >%'
  AND path NOT LIKE 'Human remains >%'
  AND path NOT LIKE 'Artifact >%'
  AND path NOT LIKE 'Material >%'
  AND path NOT LIKE 'Radiocarbon Dating >%'
  --AND path NOT LIKE 'Administrative unit >%'
ORDER BY entity_id, path;

--entities with maintypes



CREATE TABLE devill.entities AS
SELECT e.*,
       t.id        AS type_id,
       t.parent_id AS parenttype_id,
       t.name      AS typename,
       t.path
FROM devill.entitiestmp e
         LEFT JOIN devill.maintype t ON e.child_id = t.entity_id;

--update timespan where values are missing
UPDATE devill.entities
SET begin_to = begin_from
WHERE begin_to IS NULL;
UPDATE devill.entities
SET end_to = end_from
WHERE end_to IS NULL;

--DROP TABLE IF EXISTS devill.entitiestmp
            """
    startnext = datetime.now()
    print("Adding types and values")
    g.cursor.execute(sqlTypes)
    endnext = datetime.now()
    print("time elapsed:" + str((endnext - startnext)))

    print("processing files")
    sql_2 = """
    DROP TABLE IF EXISTS devill.files;
CREATE TABLE devill.files AS
SELECT entities.child_id AS parent_id,
       entity.name,
       entity.id, 
       entity.description
FROM devill.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entities.child_id != 0
  AND entity.openatlas_class_name ~~ 'file'::text
ORDER BY entities.child_id;

UPDATE devill.files SET description = NULL WHERE description = '';

DROP TABLE IF EXISTS devill.filestmp;
CREATE TABLE devill.filestmp AS
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
                             LEFT JOIN devill.types_all t ON t.id = license.range_id
                    WHERE t.name_path LIKE 'License%') AS lic
                       RIGHT JOIN devill.files f ON f.id = lic.domain_id) as files
              LEFT JOIN model.link fl ON files.id = fl.range_id
              LEFT JOIN model.entity fe ON fl.domain_id = fe.id);


DROP TABLE devill.files;
CREATE TABLE devill.files AS
    (SELECT *
     FROM devill.filestmp);
    """
    g.cursor.execute(sql_2)
    filesfound = 0
    filesmissing = 0

    if app.config['USE_IIIF']:

        filetypeJson = app.config['API_URL'] + app.config['FILETYPE_API']
        import urllib, json
        print("creating filelist via API")
        sql1 = """
                DROP TABLE IF EXISTS devill.filelist;
                CREATE TABLE devill.filelist (id INT, extension TEXT, filename TEXT, mimetype TEXT);
        """
        g.cursor.execute(sql1)

        with urllib.request.urlopen(
                filetypeJson) as url:
            filedata = json.loads(url.read().decode())
            for file_id, data in filedata.items():
                extension = data['extension']

                if extension and data['publicShareable']:
                    license = data['license']
                    print("ID:", file_id)
                    print("Extension:", extension)
                    print("License:", license)
                    if extension in ('.png', '.bmp', '.jpg', '.jpeg'):
                        mimetype = 'img'
                    if extension == '.glb':
                        mimetype = '3d'
                    if extension == '.webp':
                        mimetype = 'poster'
                    if extension == '.pdf':
                        mimetype = 'pdf'
                    if extension == '.svg':
                        mimetype = 'vector'
                    sql = """
                            INSERT INTO devill.filelist (id, extension, filename, mimetype) VALUES (%(file_id)s, %(extension)s, %(filename)s, %(mimetype)s)
                    """
                    g.cursor.execute(sql, {'file_id': file_id, 'extension': extension,
                                           'filename': str(file_id) + extension, 'mimetype': mimetype})

    sql_3 = 'SELECT id FROM devill.files'
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
        g.cursor.execute(
            "UPDATE devill.files SET filename = %(file_name)s WHERE id = %(row_id)s",
            {'file_name': file_name, 'row_id': row_id})
        sys.stdout.write(
            "\rfiles found: " + str(filesfound) + " files missing: " + str(
                filesmissing))
        sys.stdout.flush()

    print(missingids)
    g.cursor.execute('DELETE FROM devill.files WHERE filename = NULL')
    g.cursor.execute("DELETE FROM devill.files WHERE filename = ''")

    print("")
    filesdone = datetime.now()
    print("time elapsed:" + str((filesdone - endnext)))
    print("processing types and files")

    sql_4 = """
    --references
DROP TABLE IF EXISTS devill.reference;
CREATE TABLE devill.reference AS
SELECT entities.child_id  AS parent_id,
       entity.name        as abbreviation,
       entity.description AS title,
       link.description   AS reference,
       entity.id
FROM devill.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entities.child_id != 0
  AND entity.openatlas_class_name ~~ 'bibliography'::text
ORDER BY entities.child_id;


UPDATE devill.reference
SET abbreviation = NULL
WHERE abbreviation = '';
UPDATE devill.reference
SET title = NULL
WHERE title = '';
UPDATE devill.reference
SET reference = NULL
WHERE reference = '';

--external references/urls
DROP TABLE IF EXISTS devill.extrefs;
CREATE TABLE devill.extrefs AS
SELECT entities.child_id  AS parent_id,
       entity.name        as url,
       link.description   AS name,
       entity.description AS description,
       entity.id
FROM devill.entities,
     model.link,
     model.entity
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND entities.child_id != 0
  AND entity.openatlas_class_name ~~ 'external_reference'::text
ORDER BY entities.child_id;

INSERT INTO devill.extrefs 
SELECT entities.child_id  AS parent_id,
       reference_system.resolver_url || link.description   AS url,
       entity.name  AS name,
       entity.description AS description,
       entity.id
FROM devill.entities,
     model.link,
     model.entity,
     web.reference_system
WHERE entities.child_id = link.range_id
  AND link.domain_id = entity.id
  AND model.entity.id = web.reference_system.entity_id
  AND entities.child_id != 0
  AND entity.id IN (SELECT entity_id from web.reference_system)
ORDER BY entities.child_id;
       

UPDATE devill.extrefs
SET description = NULL
WHERE description = '';
UPDATE devill.extrefs
SET name = NULL
WHERE name = '';

DROP TABLE IF EXISTS devill.refsys;
    CREATE TABLE devill.refsys AS
    SELECT entity_id, name, website_url, '' AS icon_url FROM web.reference_system;
    """

    g.cursor.execute(sql_4)

    from thanados.models.entity import RCData

    sql_rc = """
            CREATE TABLE devill.radiocarbon_tmp AS (SELECT NULL::INTEGER AS entity_id, NULL AS sample);
            
            SELECT 
                    r.entity_id::TEXT,
                    split_part(r.value::numeric(10,2)::TEXT,'.',1) AS "date",
                    split_part(r.value::numeric(10,2)::TEXT,'.',2) AS "range",
                    split_part(e.description,'##RCD ',2) AS "sample"
            FROM devill.radiocarbon r JOIN devill.entities e ON e.child_id = r.entity_id; 
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
            print(
                row.entity_id + ': Sample: ' + sample + ', ' + row.date + ' +- ' + row.range)
            RCData_ = json.dumps(
                RCData.radiocarbon(row.entity_id, int(row.date), int(row.range),
                                   'ad', sample, 'intcal20.14c', False))
            g.cursor.execute(
                'UPDATE devill.radiocarbon SET description = %(RCdata)s WHERE entity_id = %(entid)s',
                {'RCdata': RCData_, 'entid': row.entity_id})

        sql_stacked = """
                        DROP TABLE IF EXISTS devill.rc_parents;
                        CREATE TABLE devill.rc_parents AS
                        SELECT r.entity_id, e.parent_id, 'rc' AS rc
                        FROM devill.radiocarbon r
                                 JOIN devill.entities e ON r.entity_id = e.child_id
                        ORDER BY e.parent_id;

                        DROP TABLE IF EXISTS devill.rc_tree;
                        CREATE TABLE devill.rc_tree AS
                        WITH RECURSIVE superents AS (
                            SELECT entity_id,
                                   parent_id,
                                   0  AS count,
                                   '' AS sample
                            FROM devill.rc_parents
                            UNION
                            SELECT l.child_id,
                                   l.parent_id,
                                   0  as count,
                                   '' AS sample
                            FROM devill.entities l
                                     JOIN superents s ON s.parent_id = l.child_id
                        )
                        SELECT *
                        FROM superents;

                        UPDATE devill.rc_tree t
                        SET sample = (SELECT description::JSONB -> 'sample' FROM devill.radiocarbon r WHERE r.entity_id = t.entity_id);

                        DROP TABLE IF EXISTS devill.RC_stacked;
                        CREATE TABLE devill.RC_stacked AS
                        SELECT entity_id, jsonb_agg(sample::JSONB) AS sample FROM
                        (WITH RECURSIVE superents AS (
                        SELECT entity_id,
                            parent_id,
                            sample AS sample
                        FROM devill.rc_tree WHERE sample IS NOT NULL
                        UNION
                        SELECT t.entity_id,
                            t.parent_id, s.sample AS sample
                        FROM devill.rc_tree t JOIN superents s ON s.parent_id = t.entity_id
                        )
                        SELECT *
                        FROM superents) se GROUP BY entity_id;
                        
                        DROP TABLE IF EXISTS devill.rc_stacked_final;
                        CREATE TABLE devill.rc_stacked_final AS
                        SELECT 
                            entity_id, sample, 
                            jsonb_array_length(sample) 
                            FROM devill.RC_stacked 
                            WHERE entity_id NOT IN (SELECT entity_id from devill.radiocarbon)
                        UNION ALL
                        
                        SELECT 
                            entity_id, 
                            sample, jsonb_array_length(sample) 
                            FROM devill.RC_stacked WHERE entity_id IN (SELECT entity_id from devill.radiocarbon) 
                                AND jsonb_array_length(sample) > 1;
                    
                    
                    DROP TABLE IF EXISTS devill.radiocarbon_tmp;

CREATE TABLE devill.radiocarbon_tmp AS
    SELECT
           entity_id,
           jsonb_build_object('child_sample', sample) AS sample
FROM devill.rc_stacked_final WHERE entity_id NOT IN (SELECT entity_id FROM devill.radiocarbon) AND jsonb_array_length(sample) = 1
UNION ALL
    SELECT
           entity_id,
           jsonb_build_object('combined_children_samples', sample) AS sample
FROM devill.rc_stacked_final WHERE entity_id NOT IN (SELECT entity_id FROM devill.radiocarbon) AND jsonb_array_length(sample) > 1
UNION ALL
    SELECT
           f.entity_id,
           jsonb_build_object('combined_samples', f.sample,
                                'sample', s.description::JSONB -> 'sample') AS sample
FROM devill.rc_stacked_final f JOIN devill.radiocarbon s ON s.entity_id = f.entity_id WHERE f.entity_id IN (SELECT entity_id FROM devill.radiocarbon) AND jsonb_array_length(sample) > 1;

INSERT INTO devill.radiocarbon_tmp SELECT r.entity_id, r.description::JSONB FROM devill.radiocarbon r WHERE r.entity_id NOT IN (SELECT entity_id FROM devill.radiocarbon_tmp);
                    """
        g.cursor.execute(sql_stacked)

        from thanados.models.entity import RCData

        RCData.radiocarbonmulti()

    sql_5 = """
-- create table with types and files of all entities
DROP TABLE IF EXISTS devill.types_and_files;
CREATE TABLE devill.types_and_files
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
DROP TABLE IF EXISTS devill.ext_types;
CREATE TABLE devill.ext_types AS
SELECT types_all.id                                      AS type_id,
       reference_system.resolver_url || link.description AS url,
       reference_system.website_url                      AS website,
       entity.name                                       AS name,
       entity.description                                AS description,
       entity.id,
       link.description                                  AS identifier,
       entitysk.name                                     AS SKOS,
       NULL                                              AS prefTerm
FROM devill.types_all,
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

UPDATE devill.ext_types
SET description = NULL
WHERE description = '';

-- insert type data
INSERT INTO devill.types_and_files (entity_id, types)
SELECT e.child_id, types
FROM devill.entities e
         LEFT JOIN
     (SELECT t.entity_id,
             jsonb_agg(jsonb_build_object(
                     'id', t.id,
                     'name', t.name,
                     'description', t.description,
                     'value', t.value,
                     'path', t.path)) AS types
      FROM devill.types t
      GROUP BY entity_id) AS irgendwas
     ON e.child_id = irgendwas.entity_id WHERE e.child_id != 0;


-- insert radiocarbon
UPDATE devill.types_and_files t SET radiocarbon = r.sample::JSONB
FROM devill.radiocarbon_tmp r WHERE t.entity_id = r.entity_id;
         
-- insert file data
DROP TABLE IF EXISTS devill.testins;
CREATE TABLE devill.testins AS
SELECT t.entity_id, f.files
             FROM (
                      SELECT e.child_id, files
                      FROM devill.entities e
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
                            FROM devill.files t
                            GROUP BY parent_id) AS irgendwas
                           ON e.child_id = irgendwas.parent_id) f JOIN devill.types_and_files t ON f.child_id = t.entity_id;

UPDATE devill.types_and_files f SET files = t.files FROM devill.testins t WHERE f.entity_id = t.entity_id;
             --1:45min before after: 4,3s


-- insert bibliography data
DROP TABLE IF EXISTS devill.testins;
CREATE TABLE devill.testins AS
(SELECT child_id, reference
                 FROM (
                          SELECT e.child_id, reference
                          FROM devill.entities e
                                   INNER JOIN
                               (SELECT t.parent_id,
                                       jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                                               'id', t.id,
                                               'abbreviation', t.abbreviation,
                                               'title', t.title,
                                               'reference', t.reference
                                           ))) AS reference
                                FROM devill.reference t
                                GROUP BY parent_id) AS irgendwas
                               ON e.child_id = irgendwas.parent_id) f
                 );

UPDATE devill.types_and_files
SET reference = (SELECT reference from devill.testins f
                 WHERE entity_id = f.child_id);
                 --1:35 min before, 5sec after

--insert external refs data
DROP TABLE IF EXISTS devill.testins;
CREATE TABLE devill.testins AS
(SELECT e.child_id, extref
         FROM devill.entities e
                  INNER JOIN
              (SELECT t.parent_id,
                      jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                              'id', t.id,
                              'url', t.url,
                              'name', t.name,
                              'description', t.description
                          ))) AS extref
               FROM devill.extrefs t
               GROUP BY parent_id) AS irgendwas
              ON e.child_id = irgendwas.parent_id);

UPDATE devill.types_and_files
SET extrefs = (SELECT extref from devill.testins f
                 WHERE entity_id = f.child_id);
                 --DROP TABLE IF EXISTS devill.extrefs;
                 
DROP TABLE IF EXISTS devill.testins;                 
--31ms

-- insert dimension data
UPDATE devill.types_and_files
SET dimensions = dimtypes
FROM (
         SELECT e.child_id, dimtypes
         FROM devill.entities e
                  INNER JOIN
              (SELECT t.entity_id,
                      jsonb_agg(jsonb_build_object(
                              'id', t.id,
                              'name', t.name,
                              'value', t.value,
                              'unit', t.description,
                              'path', t.path)) AS dimtypes
               FROM devill.dimensiontypes t
               GROUP BY entity_id) AS irgendwas
              ON e.child_id = irgendwas.entity_id) f
WHERE entity_id = f.child_id;
--354ms

-- insert material data
UPDATE devill.types_and_files
SET material = mattypes
FROM (
         SELECT e.child_id, mattypes
         FROM devill.entities e
                  INNER JOIN
              (SELECT t.entity_id,
                      jsonb_agg(jsonb_build_object(
                              'id', t.id,
                              'name', t.name,
                              'value', t.value,
                              'path', t.path)) AS mattypes
               FROM devill.materialtypes t
               GROUP BY entity_id) AS irgendwas
              ON e.child_id = irgendwas.entity_id) f
WHERE entity_id = f.child_id;

DROP TABLE IF EXISTS devill.materialtypes;
--172 ms

-- insert timespan data
UPDATE devill.types_and_files
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
         FROM devill.entities f) AS irgendwas
WHERE entity_id = irgendwas.child_id;
--344ms


--temp table with all info
DROP TABLE IF EXISTS devill.tmp;
CREATE TABLE devill.tmp AS
    (SELECT *
     FROM devill.entities e
              LEFT JOIN devill.types_and_files t ON e.child_id = t.entity_id ORDER BY parent_id, child_name);

--DROP TABLE IF EXISTS devill.types_and_files;

UPDATE devill.tmp
SET timespan = NULL
WHERE timespan = '{}';
UPDATE devill.tmp
SET description = NULL
WHERE description = '';
UPDATE devill.tmp
SET begin_comment = NULL
WHERE begin_comment = '';
UPDATE devill.tmp
SET end_comment = NULL
WHERE end_comment = '';
UPDATE devill.tmp SET description = (SELECT split_part(description, '##German', 1)); --hack to remove German descriptions
UPDATE devill.tmp SET description = (SELECT split_part(description, '##german', 1)); --hack to remove German descriptions
UPDATE devill.tmp SET description = (SELECT split_part(description, '##Deutsch', 1)); --hack to remove German descriptions
UPDATE devill.tmp SET description = (SELECT split_part(description, '##deutsch', 1)); --hack to remove German descriptions
UPDATE devill.tmp SET description = (SELECT split_part(description, '##RCD', 1)); --hack to remove Radiocarbon string
--1,4s
"""

    g.cursor.execute(sql_5)
    filetypesdone = datetime.now()
    print("time elapsed: " + str((filetypesdone - filesdone)))
    print("processing GeoJSONs")

    sql_6 = """
---finds json
DROP TABLE IF EXISTS devill.tbl_finds;
CREATE TABLE devill.tbl_finds
(
    id         integer,
    parent_id  integer,
    properties jsonb,
    files      jsonb
);

INSERT INTO devill.tbl_finds (id, parent_id, files, properties)
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
FROM (SELECT * FROM devill.tmp WHERE openatlas_class_name LIKE 'artifact') f
ORDER BY f.child_name;



DROP TABLE IF EXISTS devill.tbl_findscomplete;
CREATE TABLE devill.tbl_findscomplete
(
    id        integer,
    parent_id integer,
    find      jsonb
);

INSERT INTO devill.tbl_findscomplete (id, parent_id, find)
SELECT id,
       parent_id,
       jsonb_strip_nulls(jsonb_build_object(
               'id', f.id,
               'properties', f.properties,
               'files', f.files
           )) AS finds
FROM devill.tbl_finds f;
--ORDER BY f.properties -> 'name' asc;

DROP TABLE IF EXISTS devill.tbl_finds;

---humanremains json
DROP TABLE IF EXISTS devill.tbl_humanremains;
CREATE TABLE devill.tbl_humanremains
(
    id         integer,
    parent_id  integer,
    properties jsonb,
    files      jsonb
);

INSERT INTO devill.tbl_humanremains (id, parent_id, files, properties)
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
FROM (SELECT * FROM devill.tmp WHERE openatlas_class_name LIKE 'human_remains') f
ORDER BY f.child_name;



DROP TABLE IF EXISTS devill.tbl_humanremainscomplete;
CREATE TABLE devill.tbl_humanremainscomplete
(
    id        integer,
    parent_id integer,
    humanremains      jsonb
);

INSERT INTO devill.tbl_humanremainscomplete (id, parent_id, humanremains)
SELECT id,
       parent_id,
       jsonb_strip_nulls(jsonb_build_object(
               'id', f.id,
               'properties', f.properties,
               'files', f.files
           )) AS humanremains
FROM devill.tbl_humanremains f;
--ORDER BY f.properties -> 'name' asc;

DROP TABLE IF EXISTS devill.tbl_humanremains;

--burial
DROP TABLE IF EXISTS devill.tbl_burials;
CREATE TABLE devill.tbl_burials
(
    id                integer,
    parent_id         integer,
    properties        jsonb,
    finds             jsonb,
    humanremains      jsonb,
    files             jsonb
);

INSERT INTO devill.tbl_burials (id, parent_id, files, properties, finds)
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
FROM (SELECT * FROM devill.tmp WHERE openatlas_class_name LIKE 'stratigraphic_unit') f
         LEFT JOIN devill.tbl_findscomplete fi ON f.child_id = fi.parent_id         
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.typename, f.path,
         f.radiocarbon, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files, f.openatlas_class_name, f.reference, f.extrefs
ORDER BY f.child_name;

DROP TABLE IF EXISTS devill.tbl_findscomplete;

UPDATE devill.tbl_burials f
SET finds = NULL
WHERE f.finds = '[null]';

UPDATE devill.tbl_burials f
SET humanremains = hr.humanremains FROM (SELECT parent_id,
                                                jsonb_strip_nulls(jsonb_agg(humanremains)) AS humanremains
                                                    FROM devill.tbl_humanremainscomplete GROUP BY parent_id) hr WHERE f.id = hr.parent_id;

DROP TABLE IF EXISTS devill.tbl_humanremainscomplete;

UPDATE devill.tbl_burials f
SET humanremains = NULL
WHERE f.humanremains = '[null]';

DROP TABLE IF EXISTS devill.tbl_burialscomplete;
CREATE TABLE devill.tbl_burialscomplete
(
    id        integer,
    parent_id integer,
    burial    jsonb
);

INSERT INTO devill.tbl_burialscomplete (id, parent_id, burial)
SELECT id,
       parent_id,
       jsonb_strip_nulls(jsonb_build_object(
               'id', f.id,
               'properties', f.properties,
               'files', f.files,
               'finds', f.finds,
               'humanremains', f.humanremains
           )) AS burials
FROM devill.tbl_burials f;
--ORDER BY f.properties -> 'name' asc;

DROP TABLE IF EXISTS devill.tbl_burials;

--graves
DROP TABLE IF EXISTS devill.tbl_graves;
CREATE TABLE devill.tbl_graves
(
    id         integer,
    parent_id  integer,
    name       text,
    geom       jsonb,
    properties jsonb,
    files      jsonb,
    burials    jsonb
);

INSERT INTO devill.tbl_graves (id, parent_id, name, files, geom, properties, burials)
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
FROM (SELECT * FROM devill.tmp WHERE openatlas_class_name LIKE 'feature') f
         LEFT JOIN devill.tbl_burialscomplete fi ON f.child_id = fi.parent_id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
         f.radiocarbon, f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files,
         f.openatlas_class_name
ORDER BY f.child_name;

DROP TABLE IF EXISTS devill.tbl_burialscomplete;

UPDATE devill.tbl_graves f
SET burials = NULL
WHERE f.burials = '[
  null
]';

UPDATE devill.tbl_graves f
SET burials = NULL
WHERE id = 0;


DROP TABLE IF EXISTS devill.tbl_gravescomplete;
CREATE TABLE devill.tbl_gravescomplete
(
    id        integer,
    parent_id integer,
    name      text,
    grave     jsonb
);

INSERT INTO devill.tbl_gravescomplete (id, parent_id, name, grave)
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
FROM devill.tbl_graves f
ORDER BY f.parent_id, f.name;

--DROP TABLE IF EXISTS devill.tbl_graves;

-- get data for sites
DROP TABLE IF EXISTS devill.tbl_sites;
CREATE TABLE devill.tbl_sites
(
    id      integer,
    name    text,
    polygon text,
    point   text
);

INSERT INTO devill.tbl_sites (id, name)
SELECT child_id,
       child_name
FROM devill.sites;

UPDATE devill.tbl_sites
SET polygon = geom
FROM (SELECT ST_AsGeoJSON(geom_polygon) AS geom,
             domain_id
      FROM model.gis p
               JOIN model.link l ON p.entity_id = l.range_id 
               WHERE p.geom_polygon IS NOT NULL) g
WHERE devill.tbl_sites.id = g.domain_id;

UPDATE devill.tbl_sites
SET point = geom
FROM (SELECT ST_AsGeoJSON(geom_point) AS geom,
             domain_id
      FROM model.gis p
               JOIN model.link l ON p.entity_id = l.range_id
               WHERE p.geom_point IS NOT NULL) g
WHERE devill.tbl_sites.id = g.domain_id;

UPDATE devill.tbl_sites
SET point = geom
FROM (SELECT ST_AsGeoJSON(ST_PointOnSurface(geom_polygon)) AS geom,
             domain_id
      FROM model.gis p
               JOIN model.link l ON p.entity_id = l.range_id
               WHERE p.geom_polygon IS NOT NULL) g
WHERE devill.tbl_sites.id = g.domain_id AND tbl_sites.point ISNULL;

DROP TABLE IF EXISTS devill.tbl_sitescomplete;
CREATE TABLE devill.tbl_sitescomplete
(
    id         integer,
    name       text,
    properties jsonb
);
INSERT INTO devill.tbl_sitescomplete (id, name, properties)
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
FROM (SELECT * FROM devill.tmp WHERE openatlas_class_name LIKE 'place') f
         LEFT JOIN devill.tbl_sites s ON f.child_id = s.id
GROUP BY f.child_id, f.parent_id, f.child_name, f.description, f.timespan, f.reference, f.extrefs,
         f.geom, f.typename, f.path, f.type_id, f.parenttype_id, f.types, f.dimensions, f.material, f.files,
         f.radiocarbon, f.openatlas_class_name, s.id, s.name,
         s.point, s.polygon
ORDER BY f.child_name;

--DROP TABLE IF EXISTS devill.tmp;


DROP TABLE IF EXISTS devill.tbl_thanados_data;
CREATE TABLE devill.tbl_thanados_data
(
    id   integer,
    name text,
    data jsonb
);

INSERT INTO devill.tbl_thanados_data (id, name, data)
SELECT s.id   AS id,
       s.name AS name,
       (jsonb_strip_nulls(jsonb_build_object(
               'type', 'FeatureCollection',
               'site_id', s.id,
               'name', s.name,
               'properties', s.properties,
               'features', jsonb_strip_nulls(jsonb_agg(f.grave ORDER BY f.name))
           )))
FROM devill.tbl_sitescomplete s
         LEFT JOIN (SELECT * FROM devill.tbl_gravescomplete ORDER BY parent_id, name) f
                   ON s.id = f.parent_id
GROUP BY s.id, s.name, s.properties;

DROP TABLE IF EXISTS devill.tbl_sitescomplete;
"""
    g.cursor.execute(sql_6)
    jsonsdone = datetime.now()
    print("time elapsed: " + str((jsonsdone - filetypesdone)))

    print("processing other tables")

    sql7 = """
-- create table with all types for json
DROP TABLE IF EXISTS devill.typesforjson;
CREATE TABLE devill.typesforjson AS
SELECT DISTINCT 'type' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM devill.types_all
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
FROM devill.types_all
WHERE name_path LIKE 'Dimensions%'
UNION ALL
SELECT DISTINCT 'material' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM devill.types_all
WHERE name_path LIKE 'Material%'
UNION ALL
SELECT DISTINCT 'value' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM devill.types_all
WHERE name_path LIKE 'Body Height%' OR
name_path LIKE 'Isotopic Analyses%' OR
name_path LIKE 'Count%' OR
name_path LIKE 'Bone measurements%' OR
name_path LIKE 'Absolute Age%'
UNION ALL
SELECT DISTINCT 'find' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM devill.types_all
WHERE name_path LIKE 'Artifact%'
UNION ALL
SELECT DISTINCT 'osteology' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM devill.types_all
WHERE name_path LIKE 'Human remains%'
UNION ALL
SELECT DISTINCT 'strat' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM devill.types_all
WHERE name_path LIKE 'Stratigraphic unit%'
UNION ALL
SELECT DISTINCT 'burial_site' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM devill.types_all
WHERE name_path LIKE '%Burial Site%'
UNION ALL
SELECT DISTINCT 'feature' AS level, id::text, name AS text, parent_id::text AS parent, path, name_path, topparent, forms
FROM devill.types_all
WHERE name_path LIKE 'Feature%'

ORDER BY level, name_path;

UPDATE devill.typesforjson
SET parent = '#'
WHERE parent ISNULL; --necessary for jstree
UPDATE devill.typesforjson
SET parent = '#'
WHERE parent = '73'; --necessary for jstree (removes parent from burial site type)
--INSERT INTO devill.typesforjson (level, id, text, parent, path, name_path, forms, topparent)
--VALUES ('find', '157754', 'Artifact', '#', '157754', 'Artifact', '["artifact", "find"]', 157754);
--hack because find has no parent

-- create table with all types as json
DROP TABLE IF EXISTS devill.typesjson;
CREATE TABLE devill.typesjson AS (
    SELECT jsonb_agg(jsonb_build_object('id', id,
                                        'text', text,
                                        'parent', parent,
                                        'namepath', name_path,
                                        'path', path,
                                        'level', level,
                                        'forms', forms
        )) as types
    FROM (SELECT *
          FROM devill.typesforjson AS types
          GROUP BY types.level, types.id, types.text, types.parent, types.name_path, types.path, types.forms, types.topparent
          ORDER BY name_path) as u);
          
-- prepare data for charts

DROP TABLE IF EXISTS devill.chart_data;
CREATE TABLE devill.chart_data
(
    depth       JSONB,
    bodyheight  JSONB,
    orientation JSONB,
    azimuth     JSONB,
    sex         JSONB,
    gender      JSONB
);


DROP TABLE IF EXISTS devill.depth_labels;
CREATE TABLE devill.depth_labels AS (
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
                                  FROM devill.tbl_sites s
                                           JOIN devill.graves g ON g.parent_id = s.id
                                           JOIN devill.dimensiontypes d ON g.child_id = d.entity_id
                                  WHERE d.name = 'Height'
                              ) v

                         group BY parent_id, site_name
                     ) c
                LIMIT 1) AS ok) AS js);

--get values
DROP TABLE IF EXISTS devill.depth;
CREATE TABLE devill.depth AS (
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
             FROM devill.tbl_sites s
                      JOIN devill.graves g ON g.parent_id = s.id
                      JOIN devill.dimensiontypes d ON g.child_id = d.entity_id
             WHERE d.name = 'Height'
         ) v

    GROUP BY parent_id, site_name);



DROP TABLE IF EXISTS devill.chart_depth;
CREATE TABLE devill.chart_depth
(
    depth TEXT
);
INSERT INTO devill.chart_depth (depth)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM devill.depth_labels dl,
     devill.depth d
GROUP BY dl.labels;

DROP TABLE IF EXISTS devill.depth;
DROP TABLE IF EXISTS devill.depth_labels;

UPDATE devill.chart_depth
SET depth = REPLACE(depth, '"[', '[');
UPDATE devill.chart_depth
SET depth = REPLACE(depth, ']"', ']');

INSERT INTO devill.chart_data (depth)
SELECT depth::JSONB
FROM devill.chart_depth;

DROP TABLE IF EXISTS devill.chart_depth;


DROP TABLE IF EXISTS devill.orientation_labels;
CREATE TABLE devill.orientation_labels AS (
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
                                  FROM devill.tbl_sites s
                                           JOIN devill.graves g ON g.parent_id = s.id
                                           JOIN devill.dimensiontypes d ON g.child_id = d.entity_id
                                  WHERE d.name = 'Degrees'
                              ) v

                         group BY parent_id, site_name
                     ) c
                LIMIT 1) AS ok) AS js);

--get values
DROP TABLE IF EXISTS devill.orientation;
CREATE TABLE devill.orientation AS (
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
             FROM devill.tbl_sites s
                      JOIN devill.graves g ON g.parent_id = s.id
                      JOIN devill.dimensiontypes d ON g.child_id = d.entity_id
             WHERE d.name = 'Degrees'
         ) v
    GROUP BY parent_id, site_name);

DROP TABLE IF EXISTS devill.chart_orientation;
CREATE TABLE devill.chart_orientation(orientation TEXT);
INSERT INTO devill.chart_orientation (orientation)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM devill.orientation_labels dl,
     devill.orientation d
GROUP BY dl.labels;

DROP TABLE IF EXISTS devill.orientation_labels;
DROP TABLE IF EXISTS devill.orientation;

UPDATE devill.chart_orientation
SET orientation = REPLACE(orientation, '"[', '[');
UPDATE devill.chart_orientation
SET orientation = REPLACE(orientation, ']"', ']');

UPDATE devill.chart_data
SET orientation = (SELECT orientation::JSONB FROM devill.chart_orientation);

DROP TABLE IF EXISTS devill.chart_orientation;

DROP TABLE IF EXISTS devill.azimuth_labels;
CREATE TABLE devill.azimuth_labels AS (
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
                                  FROM devill.tbl_sites s
                                           JOIN devill.graves g ON g.parent_id = s.id
                                           JOIN devill.dimensiontypes d ON g.child_id = d.entity_id
                                  WHERE d.name = 'Azimuth'
                              ) v

                         group BY parent_id, site_name
                     ) c
                LIMIT 1) AS ok) AS js);

--get values
DROP TABLE IF EXISTS devill.azimuth;
CREATE TABLE devill.azimuth AS (
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
             FROM devill.tbl_sites s
                      JOIN devill.graves g ON g.parent_id = s.id
                      JOIN devill.dimensiontypes d ON g.child_id = d.entity_id
             WHERE d.name = 'Azimuth'
         ) v
    GROUP BY parent_id, site_name);

DROP TABLE IF EXISTS devill.chart_azimuth;
CREATE TABLE devill.chart_azimuth(azimuth TEXT);
INSERT INTO devill.chart_azimuth (azimuth)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM devill.azimuth_labels dl,
     devill.azimuth d
GROUP BY dl.labels;

DROP TABLE IF EXISTS devill.azimuth_labels;
DROP TABLE IF EXISTS devill.azimuth;

UPDATE devill.chart_azimuth
SET azimuth = REPLACE(azimuth, '"[', '[');
UPDATE devill.chart_azimuth
SET azimuth = REPLACE(azimuth, ']"', ']');

UPDATE devill.chart_data
SET azimuth = (SELECT azimuth::JSONB FROM devill.chart_azimuth);

DROP TABLE IF EXISTS devill.chart_azimuth;

-- gender start

DROP TABLE IF EXISTS devill.gender;
CREATE TABLE devill.gender AS (
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
             FROM devill.tbl_sites s
                      JOIN devill.graves g ON g.parent_id = s.id
                      JOIN devill.burials b ON g.child_id = b.parent_id
                      JOIN devill.types d ON b.child_id = d.entity_id
             WHERE d.path LIKE 'Gender >%') s
             JOIN (
        SELECT g.parent_id        AS site_id,
               count(g.parent_id) AS burialcount
        FROM devill.tbl_sites s
                 JOIN devill.graves g ON g.parent_id = s.id
                 JOIN devill.burials b ON g.child_id = b.parent_id
        GROUP by g.parent_id
    ) bc ON s.parent_id = bc.site_id
    GROUP BY site_name, parent_id, burialcount);

DROP TABLE IF EXISTS devill.chart_gender;
CREATE TABLE devill.chart_gender
(
    gender TEXT
);

INSERT INTO devill.chart_gender (gender)
    (SELECT jsonb_build_object(
                    'labels', array_to_json('{"male", "female", "unknown"}'::TEXT[]),
                    'datasets', jsonb_agg(d)
                )
     FROM devill.gender d);
     
DROP TABLE IF EXISTS devill.gender;     

UPDATE devill.chart_gender
SET gender = REPLACE(gender, '"[', '[');
UPDATE devill.chart_gender
SET gender = REPLACE(gender, ']"', ']');

UPDATE devill.chart_data
SET gender = (SELECT gender::JSONB FROM devill.chart_gender);
DROP TABLE IF EXISTS devill.chart_gender;

-- gender end

DROP TABLE IF EXISTS devill.sex;
CREATE TABLE devill.sex AS (
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
             FROM devill.tbl_sites s
                      JOIN devill.graves g ON g.parent_id = s.id
                      JOIN devill.burials b ON g.child_id = b.parent_id
                      JOIN devill.types d ON b.child_id = d.entity_id
             WHERE d.path LIKE 'Sex >%') s
             JOIN (
        SELECT g.parent_id        AS site_id,
               count(g.parent_id) AS burialcount
        FROM devill.tbl_sites s
                 JOIN devill.graves g ON g.parent_id = s.id
                 JOIN devill.burials b ON g.child_id = b.parent_id
        GROUP by g.parent_id
    ) bc ON s.parent_id = bc.site_id
    GROUP BY site_name, parent_id, burialcount);

DROP TABLE IF EXISTS devill.chart_sex;
CREATE TABLE devill.chart_sex
(
    sex TEXT
);

INSERT INTO devill.chart_sex (sex)
    (SELECT jsonb_build_object(
                    'labels', array_to_json('{"male", "female", "unknown"}'::TEXT[]),
                    'datasets', jsonb_agg(d)
                )
     FROM devill.sex d);
     
DROP TABLE IF EXISTS devill.sex;     

UPDATE devill.chart_sex
SET sex = REPLACE(sex, '"[', '[');
UPDATE devill.chart_sex
SET sex = REPLACE(sex, ']"', ']');

UPDATE devill.chart_data
SET sex = (SELECT sex::JSONB FROM devill.chart_sex);
DROP TABLE IF EXISTS devill.chart_sex;

--age at death estimation for boxplot/violin plot
DROP TABLE IF EXISTS devill.ageatdeath;
CREATE TABLE devill.ageatdeath AS (
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
                      FROM devill.sites s
                               JOIN devill.graves g ON s.child_id = g.parent_id
                               JOIN devill.burials b ON b.parent_id = g.child_id
                               JOIN devill.types t ON t.entity_id = b.child_id
                      WHERE t.path LIKE '%> Age >%'
                      ORDER BY sitename) AS a) age
          GROUP BY sitename, site_id) ar ORDER BY site_id);
          
            

          
    DROP TABLE IF EXISTS devill.searchData;
    CREATE TABLE devill.searchData AS
    SELECT e.child_id, e.child_name, 'timespan' AS type, NULL AS path, 0 AS type_id, e.begin_from AS min, e.end_to AS max, e.openatlas_class_name FROM devill.entities e WHERE e.child_id != 0
    UNION ALL
    SELECT e.child_id, e.child_name, t.name AS type, t.path AS path, t.id AS type_id, t.value::double precision AS min, t.value::double precision AS max, e.openatlas_class_name FROM devill.entities e LEFT JOIN devill.types_main t ON e.child_id = t.entity_id
    WHERE e.child_id != 0
    ORDER BY child_id;

DROP TABLE IF EXISTS devill.searchData_tmp;
    CREATE TABLE devill.searchData_tmp AS (

SELECT
	se.*,
	mt.path AS maintype,
	f.parent_id AS burial_id,
	b.parent_id AS grave_id,
	g.parent_id AS site_id,
	s.lon,
	s.lat,
	s.child_name || ' > ' || g.child_name || ' > ' || b.child_name || ' > ' || se.child_name AS context

	FROM devill.searchData se
		JOIN devill.maintype mt ON se.child_id = mt.entity_id
		JOIN devill.finds f ON se.child_id = f.child_id
		JOIN devill.burials b ON f.parent_id = b.child_id
		JOIN devill.graves g ON b.parent_id = g.child_id
		JOIN devill.sites s ON g.parent_id = s.child_id
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

	FROM devill.searchData se
		JOIN devill.maintype mt ON se.child_id = mt.entity_id
		JOIN devill.humanremains f ON se.child_id = f.child_id
		JOIN devill.burials b ON f.parent_id = b.child_id
		JOIN devill.graves g ON b.parent_id = g.child_id
		JOIN devill.sites s ON g.parent_id = s.child_id
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
	
	FROM devill.searchData se
		JOIN devill.maintype mt ON se.child_id = mt.entity_id
		JOIN devill.burials b ON se.child_id = b.child_id 
		JOIN devill.graves g ON b.parent_id = g.child_id 
		JOIN devill.sites s ON g.parent_id = s.child_id 
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

	FROM devill.searchData se
		JOIN devill.maintype mt ON se.child_id = mt.entity_id
		JOIN devill.graves g ON se.child_id = g.child_id 
		JOIN devill.sites s ON g.parent_id = s.child_id 
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

	FROM devill.searchData se
		JOIN devill.maintype mt ON se.child_id = mt.entity_id
		JOIN devill.sites s ON se.child_id = s.child_id 
		WHERE se.openatlas_class_name = 'place'); 

DROP TABLE IF EXISTS devill.searchData;
    CREATE TABLE devill.searchData AS SELECT * FROM devill.searchData_tmp;
DROP TABLE IF EXISTS devill.searchData_tmp;

DELETE FROM devill.searchData WHERE type_id = 0 AND min ISNULL AND max ISNULL;

DROP TABLE IF EXISTS devill.searchData_tmp;
CREATE TABLE devill.searchData_tmp AS (

SELECT
d.*,
fi.filename
	FROM

(select distinct on (f.parent_id)
    f.parent_id, f.filename
from devill.files f WHERE filename != ''   
order by f.parent_id) fi RIGHT JOIN devill.searchData d ON d.child_id = fi.parent_id ORDER BY child_id, type);

DROP TABLE devill.searchData;
CREATE TABLE devill.searchData AS (
SELECT * FROM devill.searchData_tmp);
DROP TABLE devill.searchData_tmp;


DROP TABLE IF EXISTS devill.valueageatdeath;
CREATE TABLE devill.valueageatdeath AS (
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

(SELECT site_id, child_id, child_name, avg(min) AS avg FROM devill.searchdata
WHERE type_id IN (117199)
GROUP BY site_id, child_id, child_name ORDER BY avg desc) a JOIN

(SELECT site_id, child_id, child_name, avg(min) AS avg FROM devill.searchdata
WHERE type_id IN (117200)
GROUP BY site_id, child_id, child_name ORDER BY avg desc) b ON a.child_id = b.child_id
                        JOIN model.entity c ON a.site_id = c.id
                    ) age
          GROUP BY sitename, site_id) ar ORDER BY site_id);


DROP TABLE IF EXISTS devill.bodyheight_labels;
CREATE TABLE devill.bodyheight_labels AS (
    SELECT '["0-10", "11-20", "21-30", "31-40", "41-50", "51-60", "61-70", "71-80", "81-90", "91-100", "101-110", "111-120", "121-130", "131-140", "141-150", "151-160", "161-170", "171-180", "181-190", "191-200", "over 200"]'::JSONB AS labels
);

DROP TABLE IF EXISTS devill.bodyheight;
CREATE TABLE devill.bodyheight AS (

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
         FROM devill.searchdata
         WHERE type_id IN (SELECT id FROM devill.types_all WHERE path LIKE '118155%')
         GROUP BY site_id, child_id) a
         JOIN model.entity b on a.site_id = b.id
GROUP BY b.name, b.id);

DROP TABLE IF EXISTS devill.chart_bodyheight;
CREATE TABLE devill.chart_bodyheight(bodyheight TEXT);
INSERT INTO devill.chart_bodyheight (bodyheight)
SELECT jsonb_build_object(
               'labels', dl.labels,
               'datasets', jsonb_agg(d)
           )
FROM devill.bodyheight_labels dl,
     devill.bodyheight d
GROUP BY dl.labels;

DROP TABLE IF EXISTS devill.bodyheight_labels;
DROP TABLE IF EXISTS devill.bodyheight;

UPDATE devill.chart_bodyheight
SET bodyheight = REPLACE(bodyheight, '"[', '[');
UPDATE devill.chart_bodyheight
SET bodyheight = REPLACE(bodyheight, ']"', ']');

UPDATE devill.chart_data
SET bodyheight = (SELECT bodyheight::JSONB FROM devill.chart_bodyheight);

DROP TABLE IF EXISTS devill.EntCount;
CREATE TABLE devill.EntCount AS
    SELECT * FROM devill.searchdata WHERE site_id IN (SELECT child_id from devill.sites);
    """

    g.cursor.execute(sql7)
    restdone = datetime.now()
    print("time elapsed: " + str((restdone - jsonsdone)))

    endtime = datetime.now()
    print("finished")
    print("totaltime: " + str((endtime - start)))

    sql = """
            CREATE SCHEMA IF NOT EXISTS devill_meta;
            
            CREATE TABLE IF NOT EXISTS devill_meta.xml_data AS (
                SELECT DISTINCT
                f.id,
                fl.filename,
                fl.extension,
                fl.mimetype,
                now()::timestamp AS last_update
                FROM devill.files f JOIN devill.filelist fl ON f.id = fl.id
            );
            
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'xml_data'
                    AND column_name = 'edm'
                ) THEN
                    ALTER TABLE devill_meta.xml_data
                    ADD COLUMN edm XML;
                END IF;
            END $$;
    """

    g.cursor.execute(sql)

    return redirect(url_for('admin'))


@app.route('/admin/filerefs', methods=['POST'])
@login_required
def admin_filerefs() -> str:
    sql_refs = """
    INSERT INTO model.link (range_id, domain_id, property_code, description) VALUES (%(range_id)s, %(domain_id)s, 'P67', %(page)s)
    """

    refs = json.loads(request.form['refs'])
    for row in refs:
        g.cursor.execute(sql_refs,
                         {'domain_id': row['refId'], 'range_id': row['file_id'],
                          'page': row['page']})
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

    print("processing external vocabularies")

    Data.get_ext_type_data()

    g.cursor.execute('SELECT * FROM devill.ext_types ORDER BY type_id')
    types = g.cursor.fetchall()

    sqlPrefs = """
                            UPDATE devill.ext_types SET prefterm = %(prefTerm)s 
                            WHERE type_id = %(type_id)s AND name = %(vocab)s
                """

    for row in types:
        prefTerm = None
        vocab = row.name
        print(row.type_id)
        print(vocab)
        if row.name == 'Getty AAT':
            try:
                prefTerm = (Data.getGettyData(str(row.identifier)))['label']
                print(prefTerm)
                g.cursor.execute(sqlPrefs,
                                 {'prefTerm': prefTerm, 'type_id': row.type_id,
                                  'vocab': vocab})
            except:
                print('something went wrong with ' + str(row.type_id))

        if row.name == 'Wikidata':
            prefTerm = (Data.getWikidata(str(row.identifier)))['label']
            print(prefTerm)
            g.cursor.execute(sqlPrefs,
                             {'prefTerm': prefTerm, 'type_id': row.type_id,
                              'vocab': vocab})

    g.cursor.execute("SELECT * FROM devill.refsys")
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

    SIZE_RE = re.compile(r'(?P<width>\d{2,4})x(?P<height>\d{2,4})',
                         flags=re.IGNORECASE)

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
        favicon_url = urlunparse(
            (parsed.scheme, parsed.netloc, 'favicon.ico', '', '', ''))
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
                    'link', attrs={'rel': lambda r: r and r.lower() == rel,
                                   'href': True}
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
    if resultRefs != None:
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
                        with open(
                                app.root_path + '/static/images/favicons/' + str(
                                    ref_id) + '.{}'.format(icons[0].format),
                                'wb') as image:
                            for chunk in response.iter_content(1024):
                                image.write(chunk)
                            fav_filename = '/static/images/favicons/' + str(
                                ref_id) + '.' + icons[0].format

                        g.cursor.execute(
                            "UPDATE devill.refsys SET icon_url = %(favicon_)s WHERE entity_id = %(ref_id)s",
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
                                "UPLOAD_FOLDER_PATH"] + '/' + str(
                row.file) + extension

            newimage = (app.config["UPLOAD_JPG_FOLDER_PATH"] + '/' + str(
                row.file)
                        + '.jpg')
            # os.makedirs(os.path.dirname(newimage), exist_ok=True)
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
                if newbbox[0] >= 25:
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
                    if not im.crop(bbox).size == (0, 0):
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
                            filesonlyconverted += 1
                    else:
                        message_ = 'size 0? at ' + str(row.file)
                        filessizezero += 1
                        failedlist.append(
                            str(filesthere) + ':' + str(row.file) + ' + size 0')


            except Exception:
                message_ = ('Cropping error with file ' + current_image + '.')
                try:
                    copy(
                        current_image,
                        app.config["UPLOAD_JPG_FOLDER_PATH"] + '/')
                    message_ = ('kept original file, check:' + current_image)
                    failedlist.append(str(filesthere) + ':' + str(
                        row.file) + ' kept the original. Check the file')
                except Exception:
                    filesfailed += 1
                    failedlist.append(str(filesthere) + ':' + str(
                        row.file) + ' general error')



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
            filesthere / filestotal * 100)) + "% - File: " + str(
            row.file) + " - " + str(
            filesthere) + " of " + str(filestotal) + ": " + message_)

    print(str(filestotal - (filesfailed + filesnotfound)) + ' of ' + str(
        filestotal) + ' successully done. ' + str(filesnotfound) + ' not found')
    print(str(len(failedlist)) + ' failed files:')
    print(failedlist)
    return redirect(url_for('admin'))


@app.route('/admin/download_files/')
@login_required
def download_files():
    if current_user.group != 'admin':
        abort(403)

    api_download()
    return redirect(url_for('admin'))

@app.route('/admin/setedm/')
@login_required
def set_edm():
    import requests
    if current_user.group != 'admin':
        abort(403)

    g.cursor.execute('SELECT DISTINCT id FROM devill.files ORDER BY id DESC')

    result=g.cursor.fetchall()
    i = 1
    for row in result:
        print('...')
        print('...')
        print('...')
        print(str(i) + ' of ' + str(len(result)))
        i += 1
        g.cursor.execute(f'SELECT * FROM devill_meta.xml_data WHERE id = {row.id}')
        entry = g.cursor.fetchone()
        if entry:
            saved_edm = entry.edm
            print('checking if edm exists for ' + entry.filename + ':')
            if saved_edm == None or saved_edm == '':
                print('No, there is none, we are going to make one ...')
            else:
                print('Yes, there is one, checking if it is up to date...')

            response = requests.get(app.config['META_RESOLVE_URL'] + '/edm/' + str(entry.id) + '/True', timeout=600)
            if response.status_code == 200:
                current_xml = response.text
                if saved_edm != current_xml:
                    escaped_xml = current_xml.replace("'", "''")
                    g.cursor.execute(f"UPDATE devill_meta.xml_data SET edm = '{escaped_xml}' WHERE id = {row.id}")
                    g.cursor.execute(f'UPDATE devill_meta.xml_data SET last_update = NOW() WHERE id = {row.id}')
                    if saved_edm:
                        print('Was not. But now ' + entry.filename + ' is up to date')
                    else:
                        print('Its done. EDM created for ' + entry.filename)
                else:
                    if saved_edm == current_xml:
                        print(entry.filename + ' is up to date')
                    else: print('something went wrong with ' + entry.filename)
            else:
                print('did not work with: ' + str(row.id))
                print(f"Failed to fetch XML data. HTTP Status Code: {response.status_code}")
        else:
            print('New file detected for id: ' + str(row.id))
            g.cursor.execute(f"""INSERT INTO devill_meta.xml_data (id, filename, extension, mimetype, last_update) (SELECT DISTINCT
                fl.id,
                fl.filename,
                fl.extension,
                fl.mimetype,
                now()::timestamp AS last_update FROM devill.filelist fl WHERE id = {row.id} LIMIT 1) """)
            response = requests.get(
                app.config['META_RESOLVE_URL'] + '/edm/' + str(row.id) + '/True', timeout=600)
            if response.status_code == 200:
                current_xml = response.text
                print('making EDM for new file')
                current_xml = current_xml.replace("'", "''")
                g.cursor.execute(
                    f"UPDATE devill_meta.xml_data SET edm = '{current_xml}' WHERE id = {row.id}")
                g.cursor.execute(
                    f'UPDATE devill_meta.xml_data SET last_update = NOW() WHERE id = {row.id}')
                print('EDM for id ' + str(row.id) + ' created')
            else:
                print('did not work with: ' + str(row.id))
                print(f"Failed to fetch XML data. HTTP Status Code: {response.status_code}")
    return redirect(url_for('admin'))
