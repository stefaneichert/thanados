import ast

from flask import jsonify, request, g

from thanados import app
from thanados.models.entity import Data


@app.route('/ajax/test', methods=['POST'])
def ajax_test() -> str:
    criteria = request.form['criteria']
    min = request.form['min']
    max = request.form['max']
    system_type = request.form['system_type']
    type_ids = tuple(ast.literal_eval('[' + request.form['types'] + ']'))

    if (criteria == 'maintype') or (criteria == 'type'):
        sql = """
           SELECT jsonb_agg(jsonb_build_object(
           'id', d.child_id,
           'name', d.child_name,
           'type', d.type,
           'type_id', d.type_id,
           'path', d.path,
           'maintype', d.maintype,
           'min', d.min,
           'max', d.max,
           'lon', d.lon,
           'lat', d.lat,
           'system_type', d.system_type,
           'burial_id', d.burial_id,
           'grave_id', d.grave_id,
           'site_id', d.site_id,
           'context', d.context
           )) AS result FROM 
           (SELECT * FROM thanados.searchData WHERE site_id IN %(site_ids)s AND system_type = %(system_type)s AND type_id IN %(type_ids)s) d
           """

    if (criteria == 'timespan'):
        sql = """
           SELECT jsonb_agg(jsonb_build_object(
           'id', d.child_id,
           'name', d.child_name,
           'type', d.type,
           'type_id', d.type_id,
           'path', d.path,
           'maintype', d.maintype,
           'min', d.min,
           'max', d.max,
           'lon', d.lon,
           'lat', d.lat,
           'system_type', d.system_type,
           'burial_id', d.burial_id,
           'grave_id', d.grave_id,
           'site_id', d.site_id,
           'context', d.context
           )) AS result FROM 
           (SELECT * FROM thanados.searchData WHERE site_id IN %(site_ids)s AND system_type = %(system_type)s AND type_id = 0 AND min >= %(min)s AND max <= %(max)s) d
           """

    if (criteria == 'dimension') or (criteria == 'material') or (criteria == 'value'):
        sql = """
           SELECT jsonb_agg(jsonb_build_object(
               'id', d.child_id,
               'name', d.child_name,
               'type', d.type,
               'type_id', d.type_id,
               'path', d.path,
               'maintype', d.maintype,
               'min', d.min,
               'max', d.max,
               'lon', d.lon,
               'lat', d.lat,
               'system_type', d.system_type,
               'burial_id', d.burial_id,
               'grave_id', d.grave_id,
               'site_id', d.site_id,
               'context', d.context
               )) AS result FROM 
               (SELECT * FROM thanados.searchData WHERE site_id IN %(site_ids)s AND  system_type = %(system_type)s AND type_id IN %(type_ids)s AND min >= %(min)s AND max <= %(max)s) d
           """

    g.cursor.execute(sql, {'site_ids': Data.get_site_ids(),
                           'system_type': system_type,
                           'type_ids': type_ids,
                           'min': min,
                           'max': max})
    # print(jsonify(g.cursor.fetchall()['result']))
    return jsonify(g.cursor.fetchone()[0])
