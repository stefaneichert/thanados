import glob
import os

from flask import g

from thanados import app

list_of_sites = app.config["SITE_LIST"]


class Data:


    @staticmethod
    def get_site_ids():
        list_of_sites = app.config["SITE_LIST"]
        if list_of_sites == 0:
            g.cursor.execute('SELECT child_id FROM thanados.sites')
            result = g.cursor.fetchall()
            mylist = []
            for row in result:
                mylist.append(row.child_id)
            mylist = (tuple(mylist))
            return (tuple(mylist))
        else:
            mylist = list_of_sites
            return (mylist)

    @staticmethod
    def get_list():
        sql_sites = """
            SELECT jsonb_agg(a) as sitelist
            FROM (
                     SELECT s.child_name     AS name,
                            s.description    AS description,
                            s.begin_from     AS begin,
                            s.end_to         AS end,
                            s.child_id       AS id,
                            s.typename       AS type,
                            s.path,
                            s.lat,
                            s.lon,
                            COUNT(s.child_id) AS graves

                     FROM thanados.entities s LEFT JOIN thanados.graves g ON s.child_id = g.parent_id
                     WHERE s.system_type = 'place' AND s.lat IS NOT NULL AND g.child_id != 0 AND s.child_id IN  %(sites)s 
                     GROUP BY s.child_name, s.description, s.begin_from, s.end_to, s.child_id, s.typename, s.path, s.lat, s.lon
                     ORDER BY s.child_name) a;"""
        g.cursor.execute(sql_sites, {"sites": Data.get_site_ids()})
        return g.cursor.fetchall()

    @staticmethod
    def get_file_path(id_: int):
        path = glob.glob(os.path.join(app.config['UPLOAD_FOLDER_PATH'], str(id_) + '.*'))
        if path:
            filename, file_extension = os.path.splitext(path[0])
            return app.config['WEB_FOLDER_PATH'] + '/' + str(id_) + file_extension
        return ''

    @staticmethod
    def get_data(place_id):
        sql = 'SELECT data FROM thanados.tbl_thanados_data WHERE id = %(place_id)s AND id IN %(sites)s;'
        g.cursor.execute(sql, {'place_id': place_id, 'sites': Data.get_site_ids()})
        return g.cursor.fetchall()

    @staticmethod
    def get_depth():
        g.cursor.execute('SELECT depth FROM thanados.chart_data;')
        return g.cursor.fetchall()

    @staticmethod
    def get_orientation():
        sql = 'SELECT orientation FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_sex():
        sql = 'SELECT sex FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_system_type(id_):
        sql = "SELECT system_type FROM model.entity WHERE id = %(object_id)s;"
        g.cursor.execute(sql, {"object_id": id_})
        return g.cursor.fetchone()[0]

    @staticmethod
    def get_sitelist():
        if list_of_sites == 0:
            sql = 'SELECT child_id FROM thanados.sites;'
            g.cursor.execute(sql)
            return g.cursor.fetchall()
        else:
            return list_of_sites

    @staticmethod
    def get_parent_place_id(id_):
        system_type = Data.get_system_type(id_)
        if system_type == 'place':
            place_id = id_
        elif system_type == 'feature':
            sql = """
                 SELECT p.id
                 FROM model.entity p
                 JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                 WHERE lf.range_id = %(object_id)s;"""
            g.cursor.execute(sql, {"object_id": id_})
            place_id = g.cursor.fetchone()[0]
        elif system_type == 'stratigraphic unit':
            sql = """
                  SELECT p.id
                  FROM model.entity p
                  JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                  JOIN model.link ls on lf.range_id = ls.domain_id AND ls.property_code = 'P46'
                  WHERE ls.range_id = %(object_id)s;"""
            g.cursor.execute(sql, {"object_id": id_})
            place_id = g.cursor.fetchone()[0]
        else:  # has to be a find
            sql = """
                  SELECT p.id
                  FROM model.entity p
                  JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                  JOIN model.link ls on lf.range_id = ls.domain_id AND ls.property_code = 'P46'
                  JOIN model.link lfi on ls.range_id = lfi.domain_id AND lfi.property_code = 'P46'
                  WHERE lfi.range_id = %(object_id)s;"""
            g.cursor.execute(sql, {"object_id": id_})
            place_id = g.cursor.fetchone()[0]
        return place_id

    @staticmethod
    def get_type_data(level, searchterm):
        if level == 'grave':
            sql = """
                SELECT jsonb_agg(jsonb_build_object (
	            'site_id', t.id,
	            'site', t.sitename,
	            'type', t.type,
	            'count', t.count
	            )) as types FROM
		        (SELECT 
		        m.id,
		        m.name AS sitename,
		        t.name AS type,
		        count(t.name) 
		        FROM model.entity m 
		        JOIN thanados.entities e ON e.parent_id = m.id 
		        JOIN thanados.types_main t ON e.child_id = t.entity_id
		        WHERE t.path LIKE %(term)s
		        GROUP BY m.id, sitename, type
		        ORDER BY 1) as t;"""
            g.cursor.execute(sql, {"term": searchterm})
            return g.cursor.fetchall()
        if level == 'burial':
            sql = """
                            SELECT jsonb_agg(jsonb_build_object (
            	            'site_id', t.id,
            	            'site', t.sitename,
            	            'type', t.type,
            	            'count', t.count
            	            )) as types FROM
            		        (SELECT 
            		        m.id,
            		        m.name AS sitename,
            		        t.name AS type,
            		        count(t.name) 
            		        FROM model.entity m 
            		        JOIN thanados.entities e ON e.parent_id = m.id
            		        JOIN thanados.entities e1 ON e1.parent_id = e.child_id
            		        JOIN thanados.types_main t ON e1.child_id = t.entity_id
            		        WHERE t.path LIKE %(term)s
            		        GROUP BY m.id, sitename, type
            		        ORDER BY 1) as t;"""
            g.cursor.execute(sql, {"term": searchterm})
            return g.cursor.fetchall()
