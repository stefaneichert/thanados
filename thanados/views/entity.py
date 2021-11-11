import ast
import collections
# import json,urllib.request

from flask import json, render_template, g

from thanados import app
from thanados.models.entity import Data


@app.route('/entity/<int:object_id>')
@app.route('/entity/<int:object_id>/<format_>')
@app.route('/<api_>/<type_>/<int:object_id>')
def entity_view(object_id: int, format_=None, api_=None, type_=None):
    openatlas_class_name = Data.get_openatlas_class_name(object_id)
    place_id = Data.get_parent_place_id(object_id)
    data = Data.get_data(place_id)[0].data
    entity = {}
    api_url = app.config["API_URL"]
    url = api_url + str(object_id)
    # jsondata = urllib.request.urlopen(url).read()
    # output = json.loads(jsondata)

    sql = """
    SELECT name, description FROM model.entity WHERE id = %(id)s 
    """
    g.cursor.execute(sql, {"id": object_id})
    result = g.cursor.fetchone()
    entity['name'] = result.name
    entity['description'] = result.description

    if format_ == 'json':
        return json.dumps(data)

    if format_ == 'network':
        network = Data.getNetwork(object_id)
        return render_template('entity/network.html', place_id=place_id, object_id=object_id,
                               mysitejson=data, openatlas_class_name=openatlas_class_name, entity=entity, network=network)
    if format_ == 'dashboard':

        # prepare AgeData
        sqlAge = """
        DROP TABLE IF EXISTS thanados.valueages;
CREATE TABLE thanados.valueages AS
SELECT a.child_name, a.child_id AS burial_id, a.avg AS min, b.avg AS max FROM

(SELECT site_id, child_id, child_name, avg(min)::numeric(10,2) AS avg FROM thanados.searchdata
WHERE type_id IN (118152, 144521, 118134, 117199)
GROUP BY site_id, child_id, child_name ORDER BY avg desc) a JOIN

(SELECT site_id, child_id, child_name, avg(min)::numeric(10,2) AS avg FROM thanados.searchdata
WHERE type_id IN (118151, 118132, 117200, 144520)
GROUP BY site_id, child_id, child_name ORDER BY avg desc) b ON a.child_id = b.child_id WHERE a.site_id = %(place_id)s
        
        """
        g.cursor.execute(sqlAge, {'place_id': place_id})

        def getScatterDataX(xarr, yval, labelarr):
            iter = 0
            isodata = {}
            isodata['datasets'] = []
            for row in xarr:
                sqlScatter = """
                    SELECT jsonb_build_object(
                         'label', %(labelval)s,
                         'labels', jsonb_agg(f.child_name),
                         'data', jsonb_agg(jsonb_build_object(
                             'x', f.xaxe,
                             'y', f.yaxe))
                     ) as datasets
                FROM (
         SELECT b.child_name, a.min AS xaxe, b.min AS yaxe
         FROM thanados.searchdata a
                  JOIN (SELECT child_id, child_name, min FROM thanados.searchdata WHERE type_id = %(yval)s AND site_id = %(site_id)s) b
                       ON a.child_id = b.child_id
         WHERE a.type_id = %(xarrval)s) f
                """
                g.cursor.execute(sqlScatter,
                                 {'site_id': place_id, 'yval': yval, 'labelval': labelarr[iter], 'xarrval': xarr[iter]})
                iter += 1
                isojson = g.cursor.fetchone()
                if (isojson.datasets['data']) != None:
                    isodata['datasets'].append(isojson.datasets)
                else:
                    isodata = None
            return isodata

        isoAge = getScatterDataX([117199, 117200], 118182, ['min age', 'max age'])
        isodata = getScatterDataX([118183], 118182, ['Burials'])

        def getAvgValuesPerTypeParent(topparent, label):

            sql = """
                SELECT jsonb_build_object(
    'labels', jsonb_agg(f.child_name),
    'datasets', jsonb_agg(f.avg),
    'tooltips', jsonb_agg(f.label)
        ) as values FROM
(SELECT child_name, array_agg(type || ': ' || min || 'cm') AS label, avg(min)::int AS avg FROM thanados.searchdata
WHERE type_id IN (SELECT id FROM thanados.types_all WHERE path LIKE %(topparent)s AND site_id = %(site_id)s)
GROUP BY site_id, child_id, child_name ORDER BY avg) f
            """
            g.cursor.execute(sql, {'site_id': place_id, 'topparent': str(topparent) + ' >%', 'label': label})
            result = g.cursor.fetchone()
            return result.values

        def getBubbleData(treeName, topId, prefix):

            bubbletree = [{
                'name': treeName,
                'id': prefix + str(topId),
                'size': 0
            }]

            sqlBubblePrepare = """
                DROP TABLE IF EXISTS thanados.typeBubble;
                CREATE TABLE thanados.typeBubble AS
                WITH RECURSIVE supertypes AS (
                        	SELECT
                        		name,
                        	    name_path,
                        	    parent_id,
                        		id,
                        		0 as count
                        	FROM
                        		thanados.types_all
                        	WHERE
                        		id IN (SELECT id from thanados.types_all t JOIN thanados.searchdata s ON t.id = s.type_id WHERE t.topparent = %(topId)s AND s.site_id = %(site_id)s GROUP BY name, id, parent_id)
                        	UNION
                        		SELECT
                        	    l.name,
                        	    l.name_path,
                        		l.parent_id,
                        		l.id,
                        		0 as count
                        	FROM
                        		thanados.types_all l JOIN supertypes s ON s.parent_id = l.id
                        ) SELECT
                        	*
                        FROM
                        	supertypes ORDER BY name_path;

                UPDATE thanados.typeBubble t SET count = l.size 
                FROM (SELECT name, id, COUNT(type_id) AS size 
                    FROM thanados.types_all t LEFT JOIN thanados.searchdata s ON t.id = s.type_id 
                    WHERE s.site_id = %(site_id)s GROUP BY name, id) l WHERE t.id = l.id;
                """
            g.cursor.execute(sqlBubblePrepare, {'topId': topId, 'site_id': place_id})

            def getBubblechildren(id, node, prefix):
                sql_getChildren = """
                                    SELECT name, id, count AS size FROM thanados.typeBubble t WHERE t.parent_id = %(id)s;
                                """
                g.cursor.execute(sql_getChildren, {'id': str(id)[1:], 'site_id': place_id})
                results = g.cursor.fetchall()
                if results:
                    node['children'] = []
                    for row in results:
                        if row.size:
                            size = row.size
                        else:
                            size = 0
                        currentnode = {'name': row.name,
                                       'id': prefix + str(row.id),
                                       'size': size}
                        node['children'].append(currentnode)
                        getBubblechildren(prefix + str(row.id), currentnode, prefix)

            getBubblechildren(bubbletree[0]['id'], bubbletree[0], prefix)
            return bubbletree

        def getFindsPerDim(_dim, term):
            sql_dim = """
            SELECT
                string_to_array('0-10 cm, 11-20 cm, 21-30 cm, 31-40cm, 41-50 cm, 51-60 cm, 61-70 cm, 71-80 cm, 81-90 cm, 91-100 cm,' ||
                                '101-110 cm, 111-120 cm, 121-130 cm, 131-140 cm, 141-150 cm, 151-160 cm, 161-170 cm, 171-180 cm, 181-190 cm, 191-200 cm,' ||
                                '201-210 cm, 211-220 cm, 221-230 cm, 231-240 cm, 241-250 cm, 251-260 cm, 261-270 cm, 271-280 cm, 281-290 cm, 291-300 cm,' ||
                                '301-310 cm, 311-320 cm, 321-330 cm, 331-340 cm, 341-350 cm, 351-360 cm, 361-370 cm, 371-380 cm, 381-390 cm, 391-400 cm,' ||
                                '401-410 cm, 411-420 cm, 421-430 cm, 431-440 cm, 441-450 cm, 451-460 cm, 461-470 cm, 471-480 cm, 481-490 cm, 491-500 cm,' ||
                                'over 500 cm', ',') AS labels,
                string_to_array(
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE <= 10)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 10 AND VALUE <= 20)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 20 AND VALUE <= 30)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 30 AND VALUE <= 40)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 40 AND VALUE <= 50)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 50 AND VALUE <= 60)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 60 AND VALUE <= 70)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 70 AND VALUE <= 80)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 80 AND VALUE <= 90)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 90 AND VALUE <= 100)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 100 AND VALUE <= 110)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 110 AND VALUE <= 120)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 120 AND VALUE <= 130)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 130 AND VALUE <= 140)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 140 AND VALUE <= 150)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 150 AND VALUE <= 160)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 160 AND VALUE <= 170)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 170 AND VALUE <= 180)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 180 AND VALUE <= 190)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 190 AND VALUE <= 200)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 200 AND VALUE <= 210)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 210 AND VALUE <= 220)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 220 AND VALUE <= 230)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 230 AND VALUE <= 240)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 240 AND VALUE <= 250)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 250 AND VALUE <= 260)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 260 AND VALUE <= 270)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 270 AND VALUE <= 280)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 280 AND VALUE <= 290)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 290 AND VALUE <= 300)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 310 AND VALUE <= 320)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 320 AND VALUE <= 330)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 330 AND VALUE <= 340)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 340 AND VALUE <= 350)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 350 AND VALUE <= 360)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 360 AND VALUE <= 370)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 370 AND VALUE <= 380)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 380 AND VALUE <= 390)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 390 AND VALUE <= 400)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 400 AND VALUE <= 410)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 410 AND VALUE <= 420)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 420 AND VALUE <= 430)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 430 AND VALUE <= 440)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 440 AND VALUE <= 450)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 450 AND VALUE <= 460)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 460 AND VALUE <= 470)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 470 AND VALUE <= 480)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 480 AND VALUE <= 490)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 490 AND VALUE <= 500)),  0)::numeric, 2) || ',' ||
                ROUND(COALESCE((avg(finds) FILTER (WHERE VALUE > 500)),  0)::numeric, 2), ',')::numeric[] AS data
            FROM

            (SELECT d.value::DOUBLE PRECISION AS value, COALESCE(s.count, 0) AS finds  FROM thanados.graves g JOIN thanados.maintype t ON g.child_id = t.entity_id LEFT JOIN (
                SELECT grave_id, count(grave_id) FROM thanados.searchdata WHERE path LIKE %(term)s AND site_id = %(place_id)s GROUP BY grave_id) s ON g.child_id = s.grave_id
                LEFT JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
                WHERE g.parent_id = %(place_id)s  AND t.path LIKE 'Feature > Grave%%' AND d.name = %(dim)s ORDER BY value) v
            """

            g.cursor.execute(sql_dim, {'place_id': place_id, 'dim': _dim, 'term': term})
            result = g.cursor.fetchone()
            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                return {"labels": [],
                        "datasets": []}

        def getDims(_dim):
            sql_dim = """
        
            SELECT 
                parent_id                                  AS "site_id",
                site_name                                  AS "label",
                string_to_array('0-20 cm, 21-40 cm, 41-60 cm, 61-80 cm, 81-100 cm, ' ||
                 '101-120 cm, 121-140 cm, 141-160 cm, 161-180 cm, 181-200 cm, '||
                 '201-220 cm, 221-240 cm, 241-260 cm, 261-280 cm, 281-300 cm, '||
                 '301-320 cm, 321-340 cm, 341-360 cm, 361-380 cm, 381-400 cm, '||
                 '401-420 cm, 421-440 cm, 441-460 cm, 461-480 cm, 481-500 cm, '||
                 '501-520 cm, 521-540 cm, 541-560 cm, 561-580 cm, 581-600 cm, over 600 cm', ',') AS labels,
                string_to_array(count(*) FILTER (WHERE VALUE <= 20) || ',' ||
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
                count(*) FILTER (WHERE VALUE > 600) , ',')::int[] AS data

                FROM (
                     SELECT g.parent_id,
                            s.name AS site_name,
                            d.value::double precision
                     FROM thanados.tbl_sites s
                              JOIN thanados.graves g ON g.parent_id = s.id
                              JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
                     WHERE d.name = %(dim)s AND g.parent_id = %(place_id)s
                 ) v
                
                GROUP BY parent_id, site_name;
            """

            g.cursor.execute(sql_dim, {'place_id': place_id, 'dim': _dim})
            result = g.cursor.fetchone()
            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                return {"labels": [],
                        "datasets": []}

        def getDegs():
            sql_deg = """

            SELECT 
                parent_id                                  AS "site_id",
                site_name                                  AS "label",
                string_to_array('0-20 °, 21-40 °, 41-60 °, 61-80 °, 81-100 °, 101-120 °, 121-140 °, 141-160 °, 161-180 °, 181-200 °, 201-220 °, 221-240 °, 241-260 °, 261-280 °, 281-300 °, 301-320 °, 321-340 °, 341-360 °', ',') AS labels,
                string_to_array(count(*) FILTER (WHERE VALUE <= 20) || ',' ||
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
                count(*) FILTER (WHERE VALUE > 340 AND VALUE <= 360), ',')::int[] AS data
            FROM (
                     SELECT g.parent_id,
                            s.name AS site_name,
                            d.value::double precision
                     FROM thanados.tbl_sites s
                              JOIN thanados.graves g ON g.parent_id = s.id
                              JOIN thanados.burials b ON b.parent_id = g.child_id
                              JOIN thanados.dimensiontypes d ON b.child_id = d.entity_id
                     WHERE d.name = 'Degrees' AND g.parent_id = %(place_id)s
                 ) v
            GROUP BY parent_id, site_name;
            """

            g.cursor.execute(sql_deg, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                _data = {"labels": [],
                         "datasets": []}
                return _data

        def getAzimuth():
            sql_azimuth = """

            SELECT 
                parent_id                                  AS "site_id",
                site_name                                  AS "label",
                string_to_array('0-20 °, 21-40 °, 41-60 °, 61-80 °, 81-100 °, 101-120 °, 121-140 °, 141-160 °, 161-180 °', ',') AS labels,
                string_to_array(count(*) FILTER (WHERE VALUE <= 20) || ',' ||
                count(*) FILTER (WHERE VALUE > 20 AND VALUE <= 40) || ',' ||
                count(*) FILTER (WHERE VALUE > 40 AND VALUE <= 60) || ',' ||
                count(*) FILTER (WHERE VALUE > 60 AND VALUE <= 80) || ',' ||
                count(*) FILTER (WHERE VALUE > 80 AND VALUE <= 100) || ',' ||
                count(*) FILTER (WHERE VALUE > 100 AND VALUE <= 120) || ',' ||
                count(*) FILTER (WHERE VALUE > 120 AND VALUE <= 140) || ',' ||
                count(*) FILTER (WHERE VALUE > 140 AND VALUE <= 160) || ',' ||
                count(*) FILTER (WHERE VALUE > 160 AND VALUE <= 180), ',')::int[] AS data   
            FROM (
                     SELECT g.parent_id,
                            s.name AS site_name,
                            d.value::double precision
                     FROM thanados.tbl_sites s
                              JOIN thanados.graves g ON g.parent_id = s.id
                              JOIN thanados.dimensiontypes d ON g.child_id = d.entity_id
                     WHERE d.name = 'Azimuth' AND g.parent_id = %(place_id)s
                 ) v
            GROUP BY parent_id, site_name;
            """

            g.cursor.execute(sql_azimuth, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                return {"labels": [],
                        "datasets": []}

        def getMultiBoxPlotValues(topparent, type_id, label):
            sql = """
            SELECT jsonb_build_object(
    'labels', jsonb_agg(c.type || ' (' || c.count || ')'),
    'datasets', jsonb_build_array(jsonb_build_object('data',jsonb_agg(c.values), 'label', %(label)s))
        ) AS data
            FROM
(SELECT a.type, jsonb_agg(b.min) AS values, COUNT(b.min)  FROM thanados.searchdata a JOIN thanados.searchdata b ON a.child_id = b.child_id
WHERE a.type_id IN (SELECT id from thanados.types_all WHERE topparent = '%(topparent)s')
  AND a.site_id = %(place_id)s AND b.type_id = %(type_id)s GROUP BY a.type
        UNION ALL
    SELECT 'total', jsonb_agg(b.min) AS values, COUNT(b.min)  FROM thanados.searchdata a JOIN thanados.searchdata b ON a.child_id = b.child_id
WHERE a.type_id IN (SELECT id from thanados.types_all WHERE topparent = '%(topparent)s')
  AND a.site_id = %(place_id)s AND b.type_id = %(type_id)s) c
            """
            g.cursor.execute(sql, {'place_id': place_id, 'topparent': topparent, 'type_id': type_id, 'label': label})
            result = g.cursor.fetchone()
            return result.data

        def getAges():
            sql_age = """
                SELECT ages FROM (SELECT gre.site_id, jsonb_agg(jsonb_build_object(
                                     'name', gre.burial, 'from', gre.agemin, 'to', gre.agemax)) AS ages FROM (
                SELECT t.child_id AS site_id, t.burial,
                       (((t.age::jsonb) -> 0)::text)::double precision         AS agemin,
                       (((t.age::jsonb) -> 1)::text)::double precision         AS agemax
                                FROM (SELECT
                                             s.child_id,
                                             t.description AS age,
                                             b.child_name AS burial                                             
                                      FROM thanados.sites s
                                               JOIN thanados.graves g ON s.child_id = g.parent_id
                                               JOIN thanados.burials b ON b.parent_id = g.child_id
                                               JOIN thanados.types t ON t.entity_id = b.child_id
                                      WHERE t.path LIKE 'Anthropology > Age%%') AS t ORDER BY agemin, agemax) gre GROUP BY gre.site_id) a WHERE site_id = %(place_id)s                                                
            """
            g.cursor.execute(sql_age, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result:
                _data = result.ages
                return _data
            else:
                return []

        def getBoxPlotAges():

            def BuildData(data):

                _data = {'labels': [],
                         'datasets': [{'label': 'min', 'data': []}, {'label': 'avg', 'data': []},
                                      {'label': 'max', 'data': []}]
                         }

                myresult = collections.OrderedDict(sorted(data.myjson.items()))

                for row in myresult:
                    if myresult[row] is not None:
                        if '_min' in row:
                            _data['labels'].append(row[1:-4] + ' (' + str(len(myresult[row])) + ')')
                            _data['datasets'][0]['data'].append(myresult[row])
                        if '_avg' in row:
                            _data['datasets'][1]['data'].append(myresult[row])
                        if '_max' in row:
                            _data['datasets'][2]['data'].append(myresult[row])

                return _data

            sql_BPageBrackets = """
                SELECT row_to_json(t)::JSONB AS myjson FROM
                            (SELECT 
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'Male') AS "2male_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'Male') AS "2male_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'Male') AS "2male_max",
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'Female') AS "1female_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'Female') AS "1female_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'Female') AS "1female_max",
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'Subadult') AS "0subadult_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'Subadult') AS "0subadult_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'Subadult') AS "0subadult_max",
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'indifferent') AS "3indifferent_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'indifferent') AS "3indifferent_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'indifferent') AS "3indifferent_max",
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'Undetermined') AS "4undetermined_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'Undetermined') AS "4undetermined_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'Undetermined') AS "4undetermined_max",
            				jsonb_agg(minage) AS "5total_min",
            				jsonb_agg(avgage) AS "5total_avg",
            				jsonb_agg(maxage) AS "5total_max"
            				FROM
            
                            (SELECT 
                          	(((age::jsonb) -> 0)::text)::double precision AS minage,
                          	(((age::jsonb) -> 1)::text)::double precision AS maxage,
                          	ROUND((((((age::jsonb) -> 0)::text)::double precision + (((age::jsonb) -> 1)::text)::double precision)/2)::numeric, 2) AS avgage,
                          	sex AS before, 
              	CASE
                         WHEN sex = 'Female'
                              AND (((age::jsonb) -> 0)::text)::double precision >= 18 THEN 'Female'
                         WHEN sex = 'Male'
                              AND (((age::jsonb) -> 0)::text)::double precision >= 18 THEN 'Male'
                         WHEN sex = 'indifferent'
                              AND (((age::jsonb) -> 0)::text)::double precision >= 18 THEN 'indifferent'
              	    WHEN (((age::jsonb) -> 0)::text)::double precision < 18 THEN 'Subadult'
                          ELSE 'Undetermined'
                          
                        END sex FROM               
                        (SELECT age, burial_id, COALESCE(REPLACE(name, '?', ''), 'undetermined') AS sex FROM (SELECT a.age, a.burial_id FROM (SELECT
                                                                     s.child_id,
                                                                     t.description AS age,
                                                                     b.child_name AS burial,
                        					     b.child_id AS burial_id
                                                FROM thanados.sites s
                                                         JOIN thanados.graves g ON s.child_id = g.parent_id
                                                         JOIN thanados.burials b ON b.parent_id = g.child_id
                                                         JOIN thanados.types t ON t.entity_id = b.child_id
                                                         
                                                         
                                                WHERE t.path LIKE 'Anthropology > Age%%' AND g.parent_id = %(place_id)s) a) y  
                                                LEFT JOIN (SELECT name, entity_id, path FROM thanados.types WHERE path LIKE '%%Sex >%%') x 
                                                ON y.burial_id = x.entity_id ORDER BY sex, age) a
                        
                                                ORDER BY sex, minage) xy) t                                             
            """
            g.cursor.execute(sql_BPageBrackets, {'place_id': place_id})
            result = g.cursor.fetchone()
            if result:
                BracketData = BuildData(result)
            else:
                BracketData = {}

            sql_BPageValues = """
                            SELECT row_to_json(t)::JSONB AS myjson FROM
                            (SELECT 
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'Male') AS "2male_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'Male') AS "2male_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'Male') AS "2male_max",
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'Female') AS "1female_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'Female') AS "1female_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'Female') AS "1female_max",
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'Subadult') AS "0subadult_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'Subadult') AS "0subadult_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'Subadult') AS "0subadult_max",
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'indifferent') AS "3indifferent_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'indifferent') AS "3indifferent_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'indifferent') AS "3indifferent_max",
            				jsonb_agg(minage) FILTER (WHERE xy.sex = 'Undetermined') AS "4undetermined_min",
            				jsonb_agg(avgage) FILTER (WHERE xy.sex = 'Undetermined') AS "4undetermined_avg",
            				jsonb_agg(maxage) FILTER (WHERE xy.sex = 'Undetermined') AS "4undetermined_max",
            				jsonb_agg(minage) AS "5total_min",
            				jsonb_agg(avgage) AS "5total_avg",
            				jsonb_agg(maxage) AS "5total_max"
            				FROM
            
                            (SELECT 
                          	(((age::jsonb) -> 0)::text)::double precision AS minage,
                          	(((age::jsonb) -> 1)::text)::double precision AS maxage,
                          	ROUND((((((age::jsonb) -> 0)::text)::double precision + (((age::jsonb) -> 1)::text)::double precision)/2)::numeric, 2) AS avgage,
                          	sex AS before, 
                          	CASE
                                     WHEN sex = 'Female'
                                          AND (((age::jsonb) -> 0)::text)::double precision >= 18 THEN 'Female'
                                     WHEN sex = 'Male'
                                          AND (((age::jsonb) -> 0)::text)::double precision >= 18 THEN 'Male'
                                     WHEN sex = 'indifferent'
                                          AND (((age::jsonb) -> 0)::text)::double precision >= 18 THEN 'indifferent'
                          	    WHEN (((age::jsonb) -> 0)::text)::double precision < 18 THEN 'Subadult'
                                      ELSE 'Undetermined'
                                      
                                    END sex FROM               
                                    (SELECT age, burial_id, COALESCE(REPLACE(name, '?', ''), 'undetermined') AS sex FROM (SELECT a.age, a.burial_id 
                                    FROM (SELECT burial_id, ('[' || min || ',' || max || ']')::JSONB AS age FROM thanados.valueAges) a) y  
                                                            LEFT JOIN (SELECT name, entity_id, path FROM thanados.types WHERE path LIKE '%%Sex >%%') x 
                                                            ON y.burial_id = x.entity_id ORDER BY sex, age) a
                                    
                                                            ORDER BY sex, minage) xy) t                                          
                        """
            g.cursor.execute(sql_BPageValues)
            result = g.cursor.fetchone()

            if result:
                ValueData = BuildData(result)
            else:
                ValueData = {}

            data = {'ValueData': ValueData, 'BracketData': BracketData}
            return data

        def getValueAges():

            sqlValueAges = """
                SELECT jsonb_agg(jsonb_build_object(
                    'name', v.name,
                    'from', v.from,
                    'to', v.to
                    )) AS ages FROM (
                    SELECT a.site_id, a.child_name AS name, a.avg AS "from", b.avg AS "to" FROM

(SELECT site_id, child_id, child_name, avg(min)::numeric(10,2) AS avg FROM thanados.searchdata
WHERE type_id IN (117199)
GROUP BY site_id, child_id, child_name ORDER BY avg desc) a JOIN

(SELECT site_id, child_id, child_name, avg(min)::numeric(10,2) AS avg FROM thanados.searchdata
WHERE type_id IN (117200)
GROUP BY site_id, child_id, child_name ORDER BY avg desc) b ON a.child_id = b.child_id WHERE a.site_id = %(place_id)s
                    ) v;
            """

            g.cursor.execute(sqlValueAges, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result.ages:
                _data = result.ages
                return _data
            else:
                return []

        def getSex():
            sql_sex = """
                    DROP TABLE IF EXISTS thanados.sexDash;
                    CREATE TABLE thanados.sexDash AS (
                    
                    SELECT burial_id, type, type_id
                    FROM thanados.searchdata WHERE type_id IN (25, 22374, 24, 22373, 118129, 22375) AND site_id = %(place_id)s);
                    
                    INSERT INTO thanados.sexDash (
                    SELECT burial_id, 'subadult', '0'
                    FROM thanados.searchdata WHERE
                                                    type_id NOT IN (22283, 22284, 117201, 22285, 22286, 22287, 22288)
                                                    AND path LIKE 'Anthropology > Age%%'
                                                    AND site_id = %(place_id)s
                                                    AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    INSERT INTO thanados.sexDash (
                    SELECT burial_id, 'subadult', '0'
                    FROM thanados.searchdata WHERE
                                                    type_id NOT IN (118152, 118134, 117199)
                                                    AND path LIKE 'Absolute Age%%'
                                                    AND type_id NOT IN (118152, 118134, 117199)
                                                    AND min < 18
                                                    AND site_id = %(place_id)s
                                                    AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    SELECT jsonb_agg(jsonb_build_object(
                                   'name', b.type,
                                   'count', b.count)) AS sex FROM (SELECT type, count(type) FROM
                                        (SELECT type
                                        FROM thanados.sexDash) a GROUP BY type ORDER BY type ASC) b
                    """

            g.cursor.execute(sql_sex, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result.sex:
                _data = result.sex
                return _data
            else:
                return []

        def getgender():
            sql_gender = """
                    SELECT jsonb_agg(jsonb_build_object(
                        'name', b.type,
                        'count', b.count
                      )) AS gender FROM (SELECT type, count(type) FROM
                            (SELECT burial_id, type, type_id
                            FROM thanados.searchdata WHERE type_id IN (120168, 120167) 
                            AND site_id = %(place_id)s) a GROUP BY type ORDER BY type DESC) b
                    """

            g.cursor.execute(sql_gender, {'place_id': place_id})
            result = g.cursor.fetchone()

            if result.gender:
                _data = result.gender
                return _data
            else:
                return []

        def getAgeBracketFindsPerTerm(term):
            sql_gender = """
                    SELECT
                        string_to_array('0-10 yrs, 11-20 yrs, 21-30 yrs, 31-40 yrs, 41-50 yrs, 51-60 yrs, 61-70 yrs, 71-80 yrs, 81-90 yrs, over 90 yrs', ',') AS labels,
                        string_to_array(
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg <= 10)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 10 AND avg >=20)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 20 AND avg >=30)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 30 AND avg >=40)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 40 AND avg >=50)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 50 AND avg >=60)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 60 AND avg >=70)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 70 AND avg >=80)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 80 AND avg >=90)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 90)),  0)::numeric, 2), ',')::numeric[] AS data
                        
                        FROM
                        (SELECT avg, count FROM
                        (SELECT ages.burial_id, ROUND(((ages.min+ages.max)/2)::numeric, 2) AS avg, COUNT(s.burial_id) AS count
                            FROM
                        (SELECT a.burial_id, (((age::jsonb) -> 0)::text)::double precision AS min, (((age::jsonb) -> 1)::text)::double precision AS max
                            FROM (SELECT
                                                                                             t.description AS age,
                                                                                             b.child_id AS burial_id
                                                                        FROM thanados.sites s
                                                                                 JOIN thanados.graves g ON s.child_id = g.parent_id
                                                                                 JOIN thanados.burials b ON b.parent_id = g.child_id
                                                                                 JOIN thanados.types t ON t.entity_id = b.child_id


                                                                        WHERE t.path LIKE 'Anthropology > Age%%' AND g.parent_id = %(place_id)s) a) ages
                        LEFT JOIN (SELECT burial_id FROM thanados.searchdata WHERE path LIKE %(term)s) s ON s.burial_id = ages.burial_id GROUP BY ages.burial_id, avg) c) d                        
                    """

            g.cursor.execute(sql_gender, {'place_id': place_id, 'term': term})
            result = g.cursor.fetchone()

            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                return {"labels": [],
                        "datasets": []}

        def getAgeValueFindsPerTerm(term):
            sql_gender = """
                    SELECT
                        string_to_array('0-10 yrs, 11-20 yrs, 21-30 yrs, 31-40 yrs, 41-50 yrs, 51-60 yrs, 61-70 yrs, 71-80 yrs, 81-90 yrs, over 90 yrs', ',') AS labels,
                        string_to_array(
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg <= 10)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 10 AND avg >=20)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 20 AND avg >=30)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 30 AND avg >=40)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 40 AND avg >=50)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 50 AND avg >=60)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 60 AND avg >=70)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 70 AND avg >=80)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 80 AND avg >=90)),  0)::numeric, 2) || ',' ||
                        ROUND(COALESCE((avg(count) FILTER (WHERE avg > 90)),  0)::numeric, 2), ',')::numeric[] AS data

                        FROM 
                        (SELECT v.min, ROUND(((v.min+v.max)/2)::numeric, 2) AS avg, v.max, v.burial_id, COUNT(s.burial_id)
                        FROM thanados.valueages v
                        LEFT JOIN (SELECT burial_id FROM thanados.searchdata WHERE path LIKE %(term)s) s
                            ON s.burial_id = v.burial_id
                        GROUP BY v.min, v.max, avg, v.burial_id) c
                    """

            g.cursor.execute(sql_gender, {'term': term})
            result = g.cursor.fetchone()

            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                return {"labels": [],
                        "datasets": []}

        def getFindAges():
            sql_Findages = """
            SELECT
                   string_to_array('0-10 yrs, 11-20 yrs, 21-30 yrs, 31-40 yrs, 41-50 yrs, 51-60 yrs, 61-70 yrs, 71-80 yrs, 81-90 yrs, over 90 yrs', ',') AS labels,
                   string_to_array(
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg <= 10)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 10 AND avg >=20)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 20 AND avg >=30)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 30 AND avg >=40)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 40 AND avg >=50)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 50 AND avg >=60)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 60 AND avg >=70)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 70 AND avg >=80)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 80 AND avg >=90)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 90)),  0)::numeric, 2), ',')::numeric[] AS data
            
                   FROM
            
            
            (SELECT g.parent_id AS grave_id, a.burial_id, a.avg, COUNT(f.parent_id)
            FROM (SELECT child_name, burial_id, min, ROUND(((min+max)/2)::numeric, 2) AS avg, max FROM thanados.valueages) a
                LEFT JOIN thanados.burials g ON g.child_id = a.burial_id
                LEFT JOIN thanados.finds f ON f.parent_id = a.burial_id
            GROUP BY g.parent_id, a.burial_id, a.avg) c
            """
            g.cursor.execute(sql_Findages)
            result = g.cursor.fetchone()
            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                return {"labels": [],
                        "datasets": []}

        def getBracketFindAges():
            sql_Findages = """
            SELECT
                   string_to_array('0-10 yrs, 11-20 yrs, 21-30 yrs, 31-40 yrs, 41-50 yrs, 51-60 yrs, 61-70 yrs, 71-80 yrs, 81-90 yrs, over 90 yrs', ',') AS labels,
                   string_to_array(
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg <= 10)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 10 AND avg >=20)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 20 AND avg >=30)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 30 AND avg >=40)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 40 AND avg >=50)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 50 AND avg >=60)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 60 AND avg >=70)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 70 AND avg >=80)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 80 AND avg >=90)),  0)::numeric, 2) || ',' ||
                   ROUND(COALESCE((avg(count) FILTER (WHERE avg > 90)),  0)::numeric, 2), ',')::numeric[] AS data

                   FROM
                    (SELECT g.parent_id AS grave_id, ages.burial_id, ROUND(((ages.min+ages.max)/2)::numeric, 2) AS avg, COUNT(f.parent_id)
                        FROM
                    (SELECT a.burial, a.burial_id, (((age::jsonb) -> 0)::text)::double precision AS min, (((age::jsonb) -> 1)::text)::double precision AS max   FROM (SELECT
                                                                                         t.description AS age,
                                                                                         b.child_name AS burial,
                                            					     b.child_id AS burial_id
                                                                    FROM thanados.sites s
                                                                             JOIN thanados.graves g ON s.child_id = g.parent_id
                                                                             JOIN thanados.burials b ON b.parent_id = g.child_id
                                                                             JOIN thanados.types t ON t.entity_id = b.child_id
                    
                    
                                                                    WHERE t.path LIKE 'Anthropology > Age%%' AND g.parent_id = %(place_id)s) a) ages
                    LEFT JOIN thanados.burials g ON g.child_id = ages.burial_id
                        LEFT JOIN thanados.finds f ON f.parent_id = ages.burial_id
                    GROUP BY g.parent_id, burial_id, avg) t
            """
            g.cursor.execute(sql_Findages, {'place_id': place_id})
            result = g.cursor.fetchone()
            if result:
                _data = {"labels": result.labels,
                         "datasets": result.data}
                return _data
            else:
                return {"labels": [],
                        "datasets": []}

        def getSexDepth():
            sqlSexDepth = """
                    DROP TABLE IF EXISTS thanados.sexDash;
                    CREATE TABLE thanados.sexDash AS (
                        SELECT burial_id, 
                        REPLACE (type, '?', '') AS type,
                        type_id 
                        FROM thanados.searchdata
                        WHERE type_id IN (25, 22374, 24, 22373)
                          AND site_id = %(place_id)s);
                    
                    INSERT INTO thanados.sexDash (
                        SELECT burial_id, type, type_id
                        FROM thanados.searchdata
                        WHERE type_id IN (120168, 120167)
                          AND site_id = %(place_id)s
                          AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    INSERT INTO thanados.sexDash (
                        SELECT burial_id, 'Subadult', '0'
                        FROM thanados.searchdata
                        WHERE type_id NOT IN (22283, 22284, 117201, 22285, 22286, 22287, 22288)
                          AND path LIKE 'Anthropology > Age%%'
                          AND site_id = %(place_id)s
                          AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    INSERT INTO thanados.sexDash (
                        SELECT burial_id, 'Subadult', '0'
                        FROM thanados.searchdata
                        WHERE type_id NOT IN (118152, 118134, 117199)
                          AND path LIKE 'Absolute Age%%'
                          AND type_id NOT IN (118152, 118134, 117199)
                          AND min < 18
                          AND site_id = %(place_id)s
                          AND burial_id NOT IN (SELECT burial_id FROM thanados.sexDash));
                    
                    DROP TABLE IF EXISTS thanados.sexGraveDepth;
                    
                    
                       
                    
                    CREATE TABLE thanados.sexGraveDepth AS
                    
                    (SELECT s.type, g.min FROM thanados.sexDash s JOIN thanados.burials b ON s.burial_id = b.child_id JOIN thanados.searchdata g ON g.child_id = b.parent_id
                    WHERE g.type = 'Height' AND g.openatlas_class_name = 'feature');
                    
                    DROP TABLE IF EXISTS thanados.sexGraveDepthJSON;
                    CREATE TABLE thanados.sexGraveDepthJSON AS
                    SELECT
                                    type,
                                    string_to_array('0-20 cm, 21-40 cm, 41-60 cm, 61-80 cm, 81-100 cm, ' ||
                                    '101-120 cm, 121-140 cm, 141-160 cm, 161-180 cm, 181-200 cm, '||
                                    '201-220 cm, 221-240 cm, 241-260 cm, 261-280 cm, 281-300 cm, '||
                                    '301-320 cm, 321-340 cm, 341-360 cm, 361-380 cm, 381-400 cm, '||
                                    '401-420 cm, 421-440 cm, 441-460 cm, 461-480 cm, 481-500 cm, '||
                                    '501-520 cm, 521-540 cm, 541-560 cm, 561-580 cm, 581-600 cm, over 600 cm', ',') AS labels,
                                    string_to_array(count(type) FILTER (WHERE min <= 20 ) || ',' ||
                                    count(type) FILTER (WHERE min > 20 AND min <= 40 ) || ',' ||
                                    count(type) FILTER (WHERE min > 40 AND min <= 60 ) || ',' ||
                                    count(type) FILTER (WHERE min > 60 AND min <= 80 ) || ',' ||
                                    count(type) FILTER (WHERE min > 80 AND min <= 100 ) || ',' ||
                                    count(type) FILTER (WHERE min > 100 AND min <= 120 ) || ',' ||
                                    count(type) FILTER (WHERE min > 120 AND min <= 140 ) || ',' ||
                                    count(type) FILTER (WHERE min > 140 AND min <= 160 ) || ',' ||
                                    count(type) FILTER (WHERE min > 160 AND min <= 180 ) || ',' ||
                                    count(type) FILTER (WHERE min > 180 AND min <= 200 ) || ',' ||
                                    count(type) FILTER (WHERE min > 200 AND min <= 220 ) || ',' ||
                                    count(type) FILTER (WHERE min > 220 AND min <= 240 ) || ',' ||
                                    count(type) FILTER (WHERE min > 240 AND min <= 260 ) || ',' ||
                                    count(type) FILTER (WHERE min > 260 AND min <= 280 ) || ',' ||
                                    count(type) FILTER (WHERE min > 280 AND min <= 300 ) || ',' ||
                                    count(type) FILTER (WHERE min > 300 AND min <= 320 ) || ',' ||
                                    count(type) FILTER (WHERE min > 320 AND min <= 340 ) || ',' ||
                                    count(type) FILTER (WHERE min > 340 AND min <= 360 ) || ',' ||
                                    count(type) FILTER (WHERE min > 360 AND min <= 380 ) || ',' ||
                                    count(type) FILTER (WHERE min > 380 AND min <= 400 ) || ',' ||
                                    count(type) FILTER (WHERE min > 300 AND min <= 420 ) || ',' ||
                                    count(type) FILTER (WHERE min > 420 AND min <= 440 ) || ',' ||
                                    count(type) FILTER (WHERE min > 440 AND min <= 460 ) || ',' ||
                                    count(type) FILTER (WHERE min > 460 AND min <= 480 ) || ',' ||
                                    count(type) FILTER (WHERE min > 480 AND min <= 500 ) || ',' ||
                                    count(type) FILTER (WHERE min > 500 AND min <= 520 ) || ',' ||
                                    count(type) FILTER (WHERE min > 520 AND min <= 540 ) || ',' ||
                                    count(type) FILTER (WHERE min > 540 AND min <= 560 ) || ',' ||
                                    count(type) FILTER (WHERE min > 560 AND min <= 580 ) || ',' ||
                                    count(type) FILTER (WHERE min > 580 AND min <= 600 ) || ',' ||
                                    count(type) FILTER (WHERE min > 600) , ',')::int[] AS data
                    
                                    FROM thanados.sexGraveDepth v GROUP BY type;
                    
                    SELECT * FROM thanados.sexGraveDepthJSON;
            """
            g.cursor.execute(sqlSexDepth, {'place_id': place_id})
            result = g.cursor.fetchall()
            _data = {}
            _data['datasets'] = []
            for row in result:
                _data['labels'] = row.labels
                _data['datasets'].append({'label': row.type, 'data': row.data})

            return (_data)

        def knn():
            sql = """
                    SELECT
				                    parent_id,
                                    string_to_array('0-0.2 m, 0.2-0.4 m, 0.4-0.6 m, 0.6-0.8 m, 0.8-1 m, ' ||
                                    '1-1.2 m, 1.2-1.4 m, 1.4-1.6 m, 1.6-1.8 m, 1.8-2 m, '||
                                    '2-2.2 m, 2.2-2.4 m, 2.4-2.6 m, 2.6-2.8 m, 2.8-3 m, '||
                                    '3-3.2 m, 3.2-3.4 m, 3.4-3.6 m, 3.6-3.8 m, 3.8-4 m, '||
                                    '4-4.2 m, 4.2-4.4 m, 4.4-4.6 m, 4.6-4.8 m, 4.8-5 m, '||
                                    '5-10 m, 10-20 m, 20-30 m, 30-40 m, 40-50 m, over 50 m', ',') AS labels,
                                    string_to_array(count(parent_id) FILTER (WHERE distance <= 0.20 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 0.20 AND distance <= 0.40 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 0.40 AND distance <= 0.60 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 0.60 AND distance <= 0.80 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 0.80 AND distance <= 0.100 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 1.00 AND distance <= 1.20 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 1.20 AND distance <= 1.40 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 1.40 AND distance <= 1.60 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 1.60 AND distance <= 1.80 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 1.80 AND distance <= 2.00 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 2.00 AND distance <= 2.20 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 2.20 AND distance <= 2.40 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 2.40 AND distance <= 2.60 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 2.60 AND distance <= 2.80 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 2.80 AND distance <= 3.00 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 3.00 AND distance <= 3.20 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 3.20 AND distance <= 3.40 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 3.40 AND distance <= 3.60 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 3.60 AND distance <= 3.80 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 3.80 AND distance <= 4.00 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 3.00 AND distance <= 4.20 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 4.20 AND distance <= 4.40 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 4.40 AND distance <= 4.60 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 4.60 AND distance <= 4.80 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 4.80 AND distance <= 5.00 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 5.00 AND distance <= 10.00 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 10.00 AND distance <= 20.00 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 20.00 AND distance <= 30.00 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 30.00 AND distance <= 40.00 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 40.00 AND distance <= 50.00 ) || ',' ||
                                    count(parent_id) FILTER (WHERE distance > 50.00) , ',')::int[] AS data
                    
                                    FROM thanados.knn WHERE parent_id = %(place_id)s GROUP BY parent_id;
            """
            g.cursor.execute(sql, {'place_id': place_id})
            result = g.cursor.fetchone()
            _data = {
                'datasets': [],
                'labels': [],
                'values': []
            }
            if result:
                _data['datasets'] = result.data
                _data['labels'] = result.labels

                sql = """
                            SELECT jsonb_agg(distance) AS values FROM (
                            SELECT distance FROM thanados.knn WHERE parent_id = %(place_id)s ORDER BY distance) d
                            """

                g.cursor.execute(sql, {'place_id': place_id})
                result = g.cursor.fetchone()

                if result:
                    _data['values'] = result.values

            return (_data)

        knn = knn()
        pathotree = getBubbleData('Pathologies', '119444', 'p')
        findtree = getBubbleData('Finds', '157754', 'f')
        findtree2 = getBubbleData('Finds', '157754', 'i')
        SexDepthData = getSexDepth()
        SexData = getSex()
        GenderData = getgender()
        ValueAgeData = getValueAges()
        BoxPlotData = getBoxPlotAges()
        DashAgeData = getAges()
        constrData = Data.get_type_data('grave', 'Grave Constr%', tuple(ast.literal_eval('[' + str(place_id) + ']')))[0]
        aziData = getAzimuth()
        degData = getDegs()
        depthData = getDims('Height')
        widthData = getDims('Width')
        lengthData = getDims('Length')
        findsPerDepth = getFindsPerDim('Height', 'Artifact >%')
        findAges = getFindAges()
        findBracketAges = getBracketFindAges()

        preciousMetalfinds = {
            "labels": getFindsPerDim('Height', 'Material > Metal > Non-Ferrous Metal > Precious Metal > Gold%').get(
                'labels'),
            "datasets": [
                {'label': 'Gold',
                 'data': getFindsPerDim('Height', 'Material > Metal > Non-Ferrous Metal > Precious Metal > Gold%').get(
                     'datasets')},
                {'label': 'Silver',
                 'data': getFindsPerDim('Height',
                                        'Material > Metal > Non-Ferrous Metal > Precious Metal > Silver%').get(
                     'datasets')},
                {'label': 'Copper/Copper Alloys',
                 'data': getFindsPerDim('Height',
                                        'Material > Metal > Non-Ferrous Metal > Copper%').get(
                     'datasets')}
            ]}

        preciousMetalfindsAgeValue = {
            "labels": getAgeValueFindsPerTerm('Material > Metal > Non-Ferrous Metal > Precious Metal > Gold%').get(
                'labels'),
            "datasets": [
                {'label': 'Gold',
                 'data': getAgeValueFindsPerTerm('Material > Metal > Non-Ferrous Metal > Precious Metal > Gold%').get(
                     'datasets')},
                {'label': 'Silver',
                 'data': getAgeValueFindsPerTerm('Material > Metal > Non-Ferrous Metal > Precious Metal > Silver%').get(
                     'datasets')},
                {'label': 'Copper/Copper Alloys',
                 'data': getAgeValueFindsPerTerm('Material > Metal > Non-Ferrous Metal > Copper%').get(
                     'datasets')}
            ]}

        preciousMetalfindsAgeBracket = {
            "labels": getAgeBracketFindsPerTerm('Material > Metal > Non-Ferrous Metal > Precious Metal > Gold%').get(
                'labels'),
            "datasets": [
                {'label': 'Gold',
                 'data': getAgeBracketFindsPerTerm('Material > Metal > Non-Ferrous Metal > Precious Metal > Gold%').get(
                     'datasets')},
                {'label': 'Silver',
                 'data': getAgeBracketFindsPerTerm(
                     'Material > Metal > Non-Ferrous Metal > Precious Metal > Silver%').get(
                     'datasets')},
                {'label': 'Copper/Copper Alloys',
                 'data': getAgeBracketFindsPerTerm('Material > Metal > Non-Ferrous Metal > Copper%').get(
                     'datasets')}
            ]}

        prestigiousfinds = {
            "labels": getFindsPerDim('Height', 'Artifact > %').get(
                'labels'),
            "datasets": [
                {'label': 'Weapons/Riding Equipment',
                 'data': getFindsPerDim('Height', 'Artifact > Weapons/Armour/Riding%').get(
                     'datasets')},
                {'label': 'Jewellery',
                 'data': getFindsPerDim('Height',
                                        'Artifact > Accessories > Jewellery%').get(
                     'datasets')},
                {'label': 'Belt Accessories',
                 'data': getFindsPerDim('Height',
                                        'Artifact > Accessories > Belt Accessories%').get(
                     'datasets')},
                {'label': 'Pottery',
                 'data': getFindsPerDim('Height',
                                        'Artifact > Pottery%').get(
                     'datasets')},
                {'label': 'Knife',
                 'data': getFindsPerDim('Height',
                                        'Artifact > Equipment > Knife%').get(
                     'datasets')}
            ]}

        prestigiousfindsValueAge = {
            "labels": getAgeValueFindsPerTerm('Artifact > Weapons/Armour/Riding%').get('labels'),
            "datasets": [
                {'label': 'Weapons/Riding Equipment',
                 'data': getAgeValueFindsPerTerm('Artifact > Weapons/Armour/Riding%').get('datasets')},
                {'label': 'Jewellery',
                 'data': getAgeValueFindsPerTerm('Artifact > Accessories > Jewellery%').get('datasets')},
                {'label': 'Belt Accessories',
                 'data': getAgeValueFindsPerTerm('Artifact > Accessories > Belt Accessories%').get('datasets')},
                {'label': 'Pottery',
                 'data': getAgeValueFindsPerTerm('Artifact > Pottery%').get('datasets')},
                {'label': 'Knife',
                 'data': getAgeValueFindsPerTerm('Artifact > Equipment > Knife%').get('datasets')}
            ]}

        prestigiousfindsBracketAge = {
            "labels": getAgeBracketFindsPerTerm('Artifact > Weapons/Armour/Riding%').get('labels'),
            "datasets": [
                {'label': 'Weapons/Riding Equipment',
                 'data': getAgeBracketFindsPerTerm('Artifact > Weapons/Armour/Riding%').get('datasets')},
                {'label': 'Jewellery',
                 'data': getAgeBracketFindsPerTerm('Artifact > Accessories > Jewellery%').get('datasets')},
                {'label': 'Belt Accessories',
                 'data': getAgeBracketFindsPerTerm('Artifact > Accessories > Belt Accessories%').get('datasets')},
                {'label': 'Pottery',
                 'data': getAgeBracketFindsPerTerm('Artifact > Pottery%').get('datasets')},
                {'label': 'Knife',
                 'data': getAgeBracketFindsPerTerm('Artifact > Equipment > Knife%').get('datasets')}
            ]}

        network = Data.getNetwork(place_id)
        wordcloud = Data.get_wordcloud(place_id)
        return render_template('entity/dashboard.html', network=network, entity=entity, wordcloud=wordcloud,
                               mysitejson=data, findBubble=findtree, findBubble2=findtree2, depthData=depthData,
                               widthData=widthData,
                               lengthData=lengthData, degData=degData, aziData=aziData, constrData=constrData,
                               DashAgeData=DashAgeData, ValueAgeData=ValueAgeData, SexData=SexData,
                               GenderData=GenderData, SexDepthData=SexDepthData, pathoBubble=pathotree,
                               findsPerDepth=findsPerDepth,
                               preciousMetalfinds=preciousMetalfinds, prestigiousfinds=prestigiousfinds,
                               BoxPlotData=BoxPlotData,
                               findAges=findAges, findBracketAges=findBracketAges,
                               preciousMetalfindsAgeValue=preciousMetalfindsAgeValue,
                               preciousMetalfindsAgeBracket=preciousMetalfindsAgeBracket,
                               prestigiousfindsValueAge=prestigiousfindsValueAge,
                               isodata=isodata,
                               isoboxplot=getMultiBoxPlotValues(23, 118183, 'Delta15N vs. Sex'),
                               isoage=isoAge,
                               prestigiousfindsBracketAge=prestigiousfindsBracketAge, knn=knn, place_id=place_id,
                               bodyheightAvg=getAvgValuesPerTypeParent(118155, 'avg body height in cm.'))

    if api_ == 'api':
        if type_ == 'JSON-LD':
            print('JSON-LD')
        if type_ == 'JSON':
            return json.dumps(data)

    return render_template('entity/view.html', place_id=place_id, object_id=object_id,
                           mysitejson=data, openatlas_class_name=openatlas_class_name, jsonld_url=url)  # , jsonld=output)
