import ast
import json

from flask import jsonify, request, g, redirect, url_for

from thanados import app
from thanados.models.entity import Data


@app.route('/ajax/test', methods=['POST'])
def ajax_test() -> str:
    criteria = request.form['criteria']
    min = request.form['min']
    max = request.form['max']
    system_class = request.form['system_class']
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
           'system_class', d.system_class,
           'burial_id', d.burial_id,
           'grave_id', d.grave_id,
           'site_id', d.site_id,
           'context', d.context,
           'file', d.filename
           )) AS result FROM 
           (SELECT * FROM thanados.searchData WHERE site_id IN %(site_ids)s AND system_class = %(system_class)s AND type_id IN %(type_ids)s) d
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
           'system_class', d.system_class,
           'burial_id', d.burial_id,
           'grave_id', d.grave_id,
           'site_id', d.site_id,
           'context', d.context,
           'file', d.filename
           )) AS result FROM 
           (SELECT * FROM thanados.searchData WHERE site_id IN %(site_ids)s AND system_class = %(system_class)s AND type_id = 0 AND min >= %(min)s AND max <= %(max)s) d
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
               'system_class', d.system_class,
               'burial_id', d.burial_id,
               'grave_id', d.grave_id,
               'site_id', d.site_id,
               'context', d.context,
               'file', d.filename
               )) AS result FROM 
               (SELECT * FROM thanados.searchData WHERE site_id IN %(site_ids)s AND  system_class = %(system_class)s AND type_id IN %(type_ids)s AND min >= %(min)s AND max <= %(max)s) d
           """

    g.cursor.execute(sql, {'site_ids': tuple(g.site_list),
                           'system_class': system_class,
                           'type_ids': type_ids,
                           'min': min,
                           'max': max})
    return jsonify(g.cursor.fetchone()[0])

@app.route('/ajax/featureCollection', methods=['POST'])
def ajax_featureCollection() -> str:
    ids = tuple(ast.literal_eval('[' + request.form['ids'] + ']'))
    sql = """
        SELECT g.parent_id AS site_id, e.name as site_name, g.grave FROM thanados.tbl_gravescomplete g JOIN model.entity e ON g.parent_id = e.id WHERE g.id IN %(ids)s
    """

    geojson = {
            'type': 'FeatureCollection',
            'features': []
    }

    g.cursor.execute(sql, {'ids': ids})
    graves = g.cursor.fetchall()
    for row in graves:
        row.grave['site'] = {'name': row.site_name, 'id': row.site_id}
        geojson['features'].append(row.grave)
    return jsonify(geojson)


@app.route('/ajax/allgraves', methods=['POST'])
def ajax_getAllGraves() -> str:

    sql = """
    SELECT g.parent_id AS site_id, e.name as site_name, g.grave 
    FROM thanados.tbl_gravescomplete g JOIN model.entity e ON g.parent_id = e.id
    WHERE g.parent_id IN %(site_ids)s
    """

    geojson = {
        'type': 'FeatureCollection',
        'features': []
    }

    g.cursor.execute(sql, {'site_ids': tuple(g.site_list)})
    graves = g.cursor.fetchall()
    for row in graves:
        row.grave['site'] = {'name': row.site_name, 'id': row.site_id}
        geojson['features'].append(row.grave)
    return jsonify(geojson)