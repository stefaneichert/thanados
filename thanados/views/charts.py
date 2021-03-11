from flask import render_template, g

from thanados import app
from thanados.models.entity import Data


@app.route('/charts')
# @login_required
def charts():
    depth = Data.get_depth()
    site_ids = tuple(g.site_list)
    constr = Data.get_type_data('grave', 'Grave Constr%', site_ids)
    gravetypes = Data.get_type_data('grave', 'Feature%', site_ids)
    graveshape = Data.get_type_data('grave', 'Grave Shape%', site_ids)
    burialtype = Data.get_type_data('burial', 'Stratigraphic Unit%', site_ids)
    sex = Data.get_sex()
    site_list = Data.get_list()
    orientation = Data.get_orientation()
    azimuth = Data.get_azimuth()
    g.cursor.execute('select JSONB_agg(age) as age FROM thanados.ageatdeath as age;')
    age = g.cursor.fetchall()

    sql_finds = """
                SELECT mydata::jsonb FROM (

SELECT '{"types": [' || string_agg (jsonstring, ', ') || ']}' AS mydata FROM
(SELECT  '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Weapon", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path LIKE '%Weapons%') || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Riding Equipment", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path LIKE '%Rider%') || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Knife", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path LIKE '%Knife%') || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Other Equipment", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path LIKE '% Equipment %' AND t.path NOT LIKE '%Firem%' AND t.path NOT LIKE '%Knife%') || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Other Finds", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path NOT LIKE '%Accessories%' AND t.path NOT LIKE '%Pottery%' AND t.path NOT LIKE '%Weapons%' AND t.path NOT LIKE '%Equipment%') || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Firemaking Equ.", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path LIKE '%Firem%') || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Belt Accessories", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path LIKE '%Belt Accessories%') || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Other Accessories", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path NOT LIKE '%Jewellery%' AND t.path NOT LIKE '%Belt Accessories%') || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Pottery", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path LIKE '%Pottery%') || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Other Jewelry", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path LIKE '%Jewellery%' AND t.path NOT LIKE '%Earring%' ) || '}, ' ||
     '{"site_id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Temple Ring", "count": ' ||    
        count(t.sitename) FILTER (WHERE t.path LIKE '%Earring%') || '}' AS jsonstring
     FROM 
(SELECT 
    m.id,
    m.name AS sitename,
    t.name AS type,
    t.path
    FROM model.entity m 
    JOIN thanados.entities e ON e.parent_id = m.id
    JOIN thanados.entities e1 ON e1.parent_id = e.child_id
    JOIN thanados.entities e2 ON e2.parent_id = e1.child_id
    JOIN thanados.types_main t ON e2.child_id = t.entity_id
    WHERE t.path LIKE 'Artifact%'
    --GROUP BY m.id, sitename, type, t.path
    ORDER BY 1, 4) t GROUP BY t.sitename, t.id) j)j
    """
    g.cursor.execute(sql_finds)
    finds = g.cursor.fetchall()

    return render_template('charts/charts.html', depth_data=depth[0].depth, azimuth_data=azimuth[0].azimuth,
                           gravetypes_json=gravetypes[0], construction=constr[0],
                           burial_types=burialtype[0], find_types=finds[0].mydata, age=age[0],
                           orientation_data=orientation[0].orientation, sex_data=sex[0].sex,
                           grave_shape=graveshape[0], sitelist=site_list[0].sitelist)
