from flask import render_template, g
from flask_login import login_required

from thanados import app
from thanados.models.entity import Data


@app.route('/charts')
#@login_required#
def charts():
    depth = Data.get_depth()
    constr = Data.get_typedata('grave', 'Grave Constr%')
    gravetypes = Data.get_typedata('grave', 'Feature%')
    graveshape = Data.get_typedata('grave', 'Grave Shape%')
    burialtype = Data.get_typedata('burial', 'Stratigraphic Unit%')
    sex = Data.get_sex()
    orientation = Data.get_orientation()
    sql_thunau = """
                SELECT age FROM thanados.ageatdeath WHERE sitename = 'Gars Thunau Obere Holzwiese';
                """
    g.cursor.execute(sql_thunau)
    thunau = g.cursor.fetchall()
    sql_kourim = """
                    SELECT age FROM thanados.ageatdeath WHERE sitename = 'Stará Kouřim';
                    """
    g.cursor.execute(sql_kourim)
    kourim = g.cursor.fetchall()
    sql_pohansko = """
                        SELECT age FROM thanados.ageatdeath WHERE sitename = 'Břeslav Pohansko Herrenhof';
                        """
    g.cursor.execute(sql_pohansko)
    pohansko = g.cursor.fetchall()

    sql_finds = """
                SELECT mydata::jsonb FROM (

SELECT '{"types": [' || string_agg (jsonstring, ', ') || ']}' AS mydata FROM
(SELECT  '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Weapon", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path LIKE '%Weapons%') || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Riding Equipment", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path LIKE '%Rider%') || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Knife", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path LIKE '%Knife%') || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Other Equipment", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path LIKE '% Equipment %' AND t.path NOT LIKE '%Firem%' AND t.path NOT LIKE '%Knife%') || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Other Finds", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path NOT LIKE '%Accessories%' AND t.path NOT LIKE '%Pottery%' AND t.path NOT LIKE '%Weapons%' AND t.path NOT LIKE '%Equipment%') || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Firemaking Equ.", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path LIKE '%Firem%') || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Belt Accessories", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path LIKE '%Belt Accessories%') || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Other Accessories", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path NOT LIKE '%Jewellery%' AND t.path NOT LIKE '%Belt Accessories%') || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Pottery", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path LIKE '%Pottery%') || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Other Jewelry", "count": ' ||	
		count(t.sitename) FILTER (WHERE t.path LIKE '%Jewellery%' AND t.path NOT LIKE '%Earring%' ) || '}, ' ||
	 '{"id": ' || t.id || ', "site": "' || t.sitename || '", "type": "Temple Ring", "count": ' ||	
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
            		        WHERE t.path LIKE 'Find%'
            		        --GROUP BY m.id, sitename, type, t.path
            		        ORDER BY 1, 4) t GROUP BY t.sitename, t.id) j)j
                """
    g.cursor.execute(sql_finds)
    finds = g.cursor.fetchall()


    return render_template('charts/charts.html', depth_data=depth[0].depth, thunau_age=thunau[0], kourim_age=kourim[0],
                           pohansko_age=pohansko[0], gravetypes_json=gravetypes[0], construction=constr[0],
                           burial_types=burialtype[0], find_types=finds[0].mydata,
                           orientation_data=orientation[0].orientation, sex_data=sex[0].sex, grave_shape=graveshape[0],)
