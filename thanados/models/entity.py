import glob
import os

from flask import g
from thanados import app


class Data:

    @staticmethod
    def get_list():
        # noinspection SqlIdentifier
        sql_sites = """
        DROP TABLE IF EXISTS thanados.tmpsites;
CREATE TABLE thanados.tmpsites AS (
    SELECT s.child_name                                           AS name,
           REPLACE(split_part(s.description, '##', 1), '"', '``') AS description,
           s.begin_from                                           AS begin,
           s.end_to                                               AS end,
           s.child_id                                             AS id,
           s.typename                                             AS type,
           s.path,
           s.lat,
           s.lon,
           COUNT(s.child_id)::TEXT                                AS graves           

    FROM thanados.entities s
             LEFT JOIN thanados.graves g ON s.child_id = g.parent_id             
    WHERE s.openatlas_class_name = 'place'
      AND s.lat IS NOT NULL
      AND s.child_id IN  %(sites)s
                     GROUP BY s.child_name, s.description, s.begin_from, s.end_to, s.child_id, s.typename, s.path, s.lat, s.lon
                     ORDER BY s.child_name);"""

        sql_sites2 = """
        UPDATE thanados.tmpsites SET (graves) = (SELECT graves FROM ( 
            SELECT              
                    s.name,
                    s.description,
                    s.begin,
                    s.end,
                    s.id,
                    s.type,
                    s.path,
                    s.lat,
                    s.lon,
                    COUNT(mt.path) FILTER (WHERE mt.path LIKE '%> Grave%')::TEXT AS graves
                                             

                     FROM thanados.tmpsites s LEFT JOIN thanados.graves g ON s.id = g.parent_id LEFT JOIN thanados.maintype mt ON g.child_id = mt.entity_id 
                     GROUP BY s.name, s.description, s.begin, s.end, s.id, s.type, s.path, s.lat, s.lon) a WHERE id = thanados.tmpsites.id);
                     UPDATE thanados.tmpsites SET graves = NULL WHERE graves = '0';     
                     
            SELECT jsonb_agg(a) as sitelist FROM thanados.tmpsites a;"""
        g.cursor.execute(sql_sites, {"sites": tuple(g.site_list),
                                     "domains": app.config["DOMAIN_TYPES"]})
        g.cursor.execute(sql_sites2)
        return g.cursor.fetchall()

    @staticmethod
    def get_ext_type_data():
        sql = """
                SELECT id FROM thanados.types_all 
                    WHERE id NOT IN 
                        (SELECT DISTINCT type_id FROM thanados.ext_types) 
                """
        g.cursor.execute(sql)
        result = g.cursor.fetchall()

        g.cursor.execute('SELECT entity_id from web.reference_system')
        refsys = g.cursor.fetchall()





        def getBroadMatch(type_id, refId):
            g.cursor.execute(
                'SELECT parent_id FROM thanados.types_all WHERE id = %(type_id)s',
                {'type_id': type_id})
            parent = g.cursor.fetchone()

            broadsql = """
                            SELECT 
                                type_id, 
                                url,
                                website,
                                name,
                                description,
                                id,
                                identifier,
                                skos
                            FROM thanados.ext_types WHERE type_id = %(parent_id)s AND id = %(refId)s
                        """

            if parent.parent_id:
                g.cursor.execute(broadsql, {'parent_id': parent.parent_id,
                                            'refId': refId})
                broadresult = g.cursor.fetchone()
                print(broadresult)
                if broadresult:
                    insertbroad = """
                                        INSERT INTO thanados.ext_types (
                                        type_id, 
                                        url,
                                        website,
                                        name,
                                        description,
                                        id,
                                        identifier,
                                        skos)
                                        VALUES (
                                        %(type_id)s,
                                        %(url)s,
                                        %(website)s,
                                        %(name)s,
                                        %(description)s,
                                        %(id)s,
                                        %(identifier)s,
                                        'broad match'
                                        )
                                """
                    g.cursor.execute(insertbroad, {'type_id': type_id,
                                                   'url': broadresult.url,
                                                   'website': broadresult.website,
                                                   'name': broadresult.name,
                                                   'description': broadresult.description,
                                                   'id': broadresult.id,
                                                   'identifier': broadresult.identifier})
                else:
                    print('next try')
                    getBroadMatch(parent.parent_id, refId)
            else:
                pass

        for row in refsys:
            refId = row.entity_id
            print('refId')
            print(refId)
            for ent in result:
                type_id = ent.id
                getBroadMatch(type_id, refId)




    @staticmethod
    def get_file_path(id_: int):
        if app.config['USE_JPGS']:
            path = glob.glob(
                os.path.join((app.config['UPLOAD_JPG_FOLDER_PATH']),
                             str(id_) + '.*'))
        else:
            path = glob.glob(
                os.path.join(app.config['UPLOAD_FOLDER_PATH'], str(id_) + '.*'))
        if path:
            filename, file_extension = os.path.splitext(path[0])
            return str(id_) + file_extension
        return ''

    @staticmethod
    def get_data(place_id):
        sql = 'SELECT data FROM thanados.tbl_thanados_data WHERE id = %(place_id)s AND id IN %(sites)s;'
        g.cursor.execute(sql,
                         {'place_id': place_id, 'sites': tuple(g.site_list)})
        return g.cursor.fetchall()

    @staticmethod
    def get_wordcloud(place_id):
        sql = """
                SELECT types FROM
                    (SELECT jsonb_agg(jsonb_build_object(
                     'weight', t.weight,
                     'text', t.type)) AS types FROM
                        (SELECT type, COUNT(type) AS weight 
                            FROM thanados.searchdata 
                            WHERE site_id = %(place_id)s AND site_id IN %(sites)s 
                            GROUP BY type order by weight desc) t) w
                """
        g.cursor.execute(sql,
                         {'place_id': place_id, 'sites': tuple(g.site_list)})
        result = g.cursor.fetchone()
        return result[0]

    @staticmethod
    def get_typedata(object_id):
        sql = 'SELECT * FROM model.entity WHERE id = %(object_id)s;'
        g.cursor.execute(sql, {'object_id': object_id})
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
    def get_azimuth():
        sql = 'SELECT azimuth FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_sex():
        sql = 'SELECT sex FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_gender():
        sql = 'SELECT gender FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_bodyheight():
        sql = 'SELECT bodyheight FROM thanados.chart_data;'
        g.cursor.execute(sql)
        return g.cursor.fetchall()

    @staticmethod
    def get_openatlas_class_name(id_):
        sql = "SELECT openatlas_class_name FROM model.entity WHERE id = %(object_id)s;"
        g.cursor.execute(sql, {"object_id": id_})
        return g.cursor.fetchone()[0]

    @staticmethod
    def get_parent_place_id(id_):
        openatlas_class_name = Data.get_openatlas_class_name(id_)
        if openatlas_class_name == 'place':
            place_id = id_
        elif openatlas_class_name == 'feature':
            sql = """
                 SELECT p.id
                 FROM model.entity p
                 JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                 WHERE lf.range_id = %(object_id)s;"""
            g.cursor.execute(sql, {"object_id": id_})
            place_id = g.cursor.fetchone()[0]
        elif openatlas_class_name == 'stratigraphic_unit':
            sql = """
                  SELECT p.id
                  FROM model.entity p
                  JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                  JOIN model.link ls on lf.range_id = ls.domain_id AND ls.property_code = 'P46'
                  WHERE ls.range_id = %(object_id)s;"""
            g.cursor.execute(sql, {"object_id": id_})
            place_id = g.cursor.fetchone()[0]
        elif openatlas_class_name == 'human_remains':
            sql = """
                  SELECT p.id
                  FROM model.entity p
                  JOIN model.link lf on p.id = lf.domain_id AND lf.property_code = 'P46'
                  JOIN model.link ls on lf.range_id = ls.domain_id AND ls.property_code = 'P46'
                  JOIN model.link lfi on ls.range_id = lfi.domain_id AND lfi.property_code = 'P46'
                  WHERE lfi.range_id = %(object_id)s;"""
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
    def get_type_data(level, searchterm, site_id):
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
		        WHERE t.path LIKE %(term)s AND m.id IN %(site_ids)s
		        GROUP BY m.id, sitename, type
		        ORDER BY 1) as t;"""
            g.cursor.execute(sql, {"term": searchterm, "site_ids": site_id})
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
            		        WHERE t.path LIKE %(term)s AND m.id IN %(site_ids)s
            		        GROUP BY m.id, sitename, type
            		        ORDER BY 1) as t;"""
            g.cursor.execute(sql, {"term": searchterm, "site_ids": site_id})
            return g.cursor.fetchall()

    @staticmethod
    def getNetwork(id):
        edges = []
        nodes = []
        entities = []
        types = []
        sql = """
                        WITH RECURSIVE subunits AS (
            	SELECT
            		domain_id,
            		range_id,
            		property_code
            	FROM
            		model.link
            	WHERE
            		domain_id = %(id)s
            	UNION
            		SELECT
            		l.domain_id,
            		l.range_id,
            		l.property_code
            	FROM
            		model.link l INNER JOIN subunits s ON s.range_id = l.domain_id WHERE l.property_code = 'P46'
            ) SELECT
            	*
            FROM
            	subunits
            	
            UNION ALL 
            SELECT * FROM (
            WITH RECURSIVE superunits AS (
            	SELECT
            		domain_id,
            		range_id,
            		property_code
            	FROM
            		model.link
            	WHERE
            		range_id = %(id)s
            	UNION
            		SELECT
            		l.domain_id,
            		l.range_id,
            		l.property_code
            	FROM
            		model.link l INNER JOIN superunits s ON s.domain_id = l.range_id WHERE l.property_code = 'P46'
            ) SELECT
            	*
            FROM
            	superunits) su
        """

        g.cursor.execute(sql, {"id": id})
        result = g.cursor.fetchall()

        for row in result:
            if row.property_code == 'P2':
                types.append(row.range_id)
            edges.append({'from': row.domain_id, 'to': row.range_id})
            entities.append(row.domain_id)
            entities.append(row.range_id)

        entities = list(dict.fromkeys(entities))
        entities = tuple(entities)

        sqltypes = """
                WITH RECURSIVE supertypes AS (
                    	SELECT
                    		id,
                    		parent_id
                    	FROM
                    		thanados.types_all
                    	WHERE
                    		id IN %(id)s
                    	UNION
                    		SELECT
                    		l.id,
                    		l.parent_id
                    	FROM
                    		thanados.types_all l INNER JOIN supertypes s ON s.parent_id = l.id
                    ) SELECT
                    	*
                    FROM
                    	supertypes;
                """

        g.cursor.execute(sqltypes, {"id": tuple(types)})
        resulttypes = g.cursor.fetchall()

        for row in resulttypes:
            if row.parent_id:
                edges.append({'from': row.id, 'to': row.parent_id})
                types.append(row.id)
                types.append(row.parent_id)

        sql2 = """
                    SELECT id, name, openatlas_class_name FROM model.entity WHERE id IN %(entities)s OR id IN %(types)s
                        """
        g.cursor.execute(sql2, {"entities": entities, "types": tuple(types)})
        result2 = g.cursor.fetchall()

        for row in result2:
            if row.id != id:
                if row.openatlas_class_name:
                    group = row.openatlas_class_name
                else:
                    group = 'classification'
                nodes.append({'label': row.name, 'id': row.id, 'group': group,
                              'title': group})
            else:
                nodes.append(
                    {'label': row.name, 'id': row.id,
                     'group': row.openatlas_class_name,
                     'title': row.openatlas_class_name, 'size': 30})

        network = {}
        network['nodes'] = nodes
        network['edges'] = edges

        return network

    @staticmethod
    def getWikidataimage(id):
        import urllib, json, hashlib, requests

        with urllib.request.urlopen(
                "https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P18&entity=" + id) as url:
            wdata = json.loads(url.read().decode())

        if wdata['claims']:
            wfilename = (
            wdata['claims']['P18'][0]['mainsnak']['datavalue']['value'])
            newfile = (wfilename.replace(' ', '_'))
            # print(newfile)
            md5 = (hashlib.md5(newfile.encode('utf-8')).hexdigest())
            # print(md5)
            print(newfile)

            def extract_image_license(image_name):

                start_of_end_point_str = 'https://commons.wikimedia.org' \
                                         '/w/api.php?action=query&titles=File:'
                end_of_end_point_str = '&prop=imageinfo&iiprop=extmetadata&format=json'
                result = requests.get(
                    start_of_end_point_str + image_name + end_of_end_point_str)
                result = result.json()
                page_id = next(iter(result['query']['pages']))
                image_info = result['query']['pages'][page_id]['imageinfo']

                return image_info

            metadata = extract_image_license(newfile)

            image = {
                'url': 'https://upload.wikimedia.org/wikipedia/commons/' + md5[
                                                                           0:1] + '/' + md5[
                                                                                        0:2] + '/' + newfile,
                'urlthumb': 'https://upload.wikimedia.org/wikipedia/commons/thumb/' + md5[
                                                                                      0:1] + '/' + md5[
                                                                                                   0:2] + '/' + newfile + '/200px-' + newfile,
                'metadata': metadata[0]['extmetadata'],
                'origin': 'https://commons.wikimedia.org/wiki/File:' + newfile
            }

            return image
        else:
            return None

    @staticmethod
    def getWikidata(id):
        import urllib, json

        with urllib.request.urlopen(
                "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&search=" + id + "&language=en") as url:
            wdata = json.loads(url.read().decode())

        try:
            description = wdata['search'][0]['description']
        except KeyError:
            description = None
        try:
            label = wdata['search'][0]['label']
        except KeyError:
            label = None

        return {'description': description, 'label': label}

    @staticmethod
    def getGettyData(id):
        import requests
        from bs4 import BeautifulSoup

        url = "http://vocabsservices.getty.edu/AATService.asmx/AATGetSubject?subjectID=" + id
        GettyData = {}
        wdata = requests.get(url)
        soup = BeautifulSoup(wdata.content, "lxml-xml")

        try:
            GettyData['label'] = soup.find('Preferred_Term').Term_Text.string
        except:
            GettyData['label'] = 'no preferred term found'

        try:
            GettyData['qualifier'] = soup.find('Qualifier').string
        except: GettyData['qualifier'] = ''

        try:
            GettyData['description'] = soup.find(
                'Descriptive_Note').Note_Text.string
        except:
            GettyData['description'] = ''

        return GettyData

    @staticmethod
    def get_type_data(level, searchterm, site_id):
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
    		        WHERE t.path LIKE %(term)s AND m.id IN %(site_ids)s
    		        GROUP BY m.id, sitename, type
    		        ORDER BY 1) as t;"""
            g.cursor.execute(sql, {"term": searchterm, "site_ids": site_id})
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
                		        WHERE t.path LIKE %(term)s AND m.id IN %(site_ids)s
                		        GROUP BY m.id, sitename, type
                		        ORDER BY 1) as t;"""
            g.cursor.execute(sql, {"term": searchterm, "site_ids": site_id})
            return g.cursor.fetchall()


class RCData:

    @staticmethod
    def radiocarbon(entid, d, s, bp, rid, curve, childsample):
        import matplotlib
        matplotlib.use('Agg')
        from matplotlib import pyplot
        from io import BytesIO
        from thanados.models.iosacal import core, plot
        import pkg_resources
        curvefile = curve
        curve_data_bytes = pkg_resources.resource_string(
            "thanados.models.iosacal", "data/%s" % curve)
        curve_data_string = curve_data_bytes.decode('latin1')
        curve = core.CalibrationCurve(curve_data_string, curvefile)
        if childsample:
            rid = "Subunit sample: " + rid
            entid = "sub_" + str(entid)
        rs = core.RadiocarbonDetermination(d, s, rid)
        ca = rs.calibrate(curve)
        rc_output = {}
        # rc_output['intervals'] = ca.intervals
        # rc_output['calibration'] = (str(ca.calibration_curve).replace('CalibrationCurve( ', ''))[:-2]
        rc_output['sample'] = (str(ca.radiocarbon_sample).replace(
            'RadiocarbonSample( ', ''))[:-2]

        try:
            buf = BytesIO()
        except:
            app.logger.error('Error instantiating BytesIO')
            # abort(400)
        else:
            try:
                plot.single_plot(ca, oxcal=True, output=buf, BP=bp)
            except ValueError:
                app.logger.error('Error plotting')
                # abort(400)
            else:
                buf.seek(0)
                filename = app.root_path + "/static/images/rc_dates/rc_" + entid + ".png"
                print(filename)
                os.makedirs(os.path.dirname(filename), exist_ok=True)

                with open(filename, "wb") as f:
                    f.write(buf.getbuffer())
                matplotlib.pyplot.close(fig='all')

        return rc_output

    @staticmethod
    def radiocarbonmulti():
        import matplotlib
        matplotlib.use('Agg')
        from matplotlib import pyplot
        from io import BytesIO
        from thanados.models.iosacal import core, plot
        import pkg_resources

        sql = """
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
            """

        g.cursor.execute(sql)
        result = g.cursor.fetchall()

        g.cursor.execute(
            'SELECT jsonb_agg(entity_id) AS ids FROM thanados.radiocarbon')
        idlist = g.cursor.fetchone()

        for row in result:
            entId = row.entity_id
            g.cursor.execute(
                'SELECT name FROM model.entity WHERE id = %(entid)s',
                {'entid': entId})
            entName = g.cursor.fetchone().name
            count = len(row.sample)

            Calages = []
            for spec in row.sample:
                # print(spec
                lab = spec.split(' : ', 1)[0]
                date = int((spec.split(' ± ', 1)[0]).replace((lab + ' : '), ''))
                range = int(spec.split(' ± ', 1)[1])
                curvefile = "intcal20.14c"
                curve_data_bytes = pkg_resources.resource_string(
                    "thanados.models.iosacal",
                    "data/%s" % curvefile)
                curve_data_string = curve_data_bytes.decode('latin1')

                if count > 1:
                    lab = lab + ': ' + str(date) + ' +- ' + str(range)
                    curve = core.CalibrationCurve(curve_data_string, curvefile)
                    rs = core.RadiocarbonDetermination(date, range, lab)
                    ca = rs.calibrate(curve)
                    Calages.append(ca)
            if (len(Calages) > 1):
                try:
                    buf = BytesIO()
                except:
                    app.logger.error('Error instantiating BytesIO')
                    # abort(400)
                else:
                    try:
                        plot.stacked_plot(Calages, entName, oxcal=False,
                                          output=buf, BP='ad')
                    except ValueError:
                        app.logger.error('Error plotting')
                        # abort(400)
                    else:
                        buf.seek(0)

                        with open(
                                app.root_path + "/static/images/rc_dates/rc_stacked_" + str(
                                        entId) + ".png", "wb") as f:
                            f.write(buf.getbuffer())
                        matplotlib.pyplot.close(fig='all')

            if count == 1:
                if int(entId) not in idlist.ids:
                    RCData.radiocarbon(entId, date, range, 'ad', lab,
                                       "intcal20.14c", True)
