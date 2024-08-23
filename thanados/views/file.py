from flask import request, render_template, session, g
from bs4 import BeautifulSoup

from thanados import app


def getManifest(img_id):
    import urllib, json, requests, re
    filetypeJson = app.config['API_URL'] + app.config[
        'FILETYPE_API'] + '?file_id=' + str(img_id)

    locale = 'en'

    with urllib.request.urlopen(
            filetypeJson) as url:
        filedata = json.loads(url.read().decode())
        for file_id, data in filedata.items():
            extension = data['extension']
            if extension:
                license = data['license']

    from iiif_prezi3 import Manifest, KeyValueString, config

    sql = """
        SELECT e.name AS image,
               e.description,
               l.property_code,
               CASE
                   WHEN l.range_id = e.id AND p.name_inverse IS NOT NULL THEN p.name_inverse
                   ELSE p.name
                   END property,
               l.description AS spec,
               e2.id,
               e2.name,
               e2.description AS info
        from devill.entity e
                 LEFT JOIN devill.link l ON e.id IN (l.domain_id, l.range_id)
                 LEFT JOIN devill.entity e2 ON e2.id IN (l.domain_id, l.range_id)
                 JOIN model.property p ON l.property_code = p.code
        WHERE e.id = %(id)s
          AND e2.id != e.id;
    """

    g.cursor.execute(sql, {'id': img_id})
    result = g.cursor.fetchall()

    g.cursor.execute(
        f'SELECT description FROM devill.entity WHERE id = {img_id}')
    filedescription = g.cursor.fetchone()

    image_name = result[0].image
    if license:
        attribution = ''
        source = ''
        sourceThere = False
        for row in result:
            if row.property == 'is referred to by':
                sourceThere = True
                source += row.name
                if row.info:
                    source += ': ' + row.info
                if row.spec:
                    source += ' ' + row.spec
                source += '<br>'
            if row.name == license and row.property_code == 'P2':
                try:
                    license_uri = (re.search(
                        '##licenseUrl_##(.*)##_licenseUrl##',
                        row.info).group(1)).replace('https', 'http')
                except Exception:
                    license_uri = None
                if license_uri:
                    try:
                        apiUrl = 'https://api.creativecommons.org/rest/1.5/details?license-uri=' + license_uri + '&locale=' + locale
                        document = requests.get(apiUrl)
                        soup = BeautifulSoup(document.content, "lxml-xml")
                        attribution = str(soup.find("html"))
                        if attribution == 'None':
                            attribution = row.name
                            if row.info:
                                attribution += ': ' + row.info
                            if row.spec:
                                attribution += ' ' + row.spec
                    except Exception:
                        pass
                else:
                    attribution = row.name
                    if row.info:
                        attribution += ': ' + row.info
                    if row.spec:
                        attribution += ' ' + row.spec
        if sourceThere:
            source = '<br> Source(s):<br>' + source
        attribution += str('<p>' + source + '</p>')
        if filedescription.description:
            attribution += str('<p>' + filedescription.description + '</p>')

    manifest = Manifest(
        id=request.base_url,
        label=image_name,
        rights=license_uri,
        metadata=[KeyValueString(label=img_id + extension, value={"none": [
            "<span><a href='" + app.config[
                'API_FILE_DISPLAY'] + img_id + extension + "'>Download</a></span>"]})],
        requiredStatement=KeyValueString(label="Attribution",
                                         value=attribution),

    )

    sql = f"""
        SELECT child_id AS id, child_name || ' (' || typename || ')' AS ents FROM devill.entities WHERE child_id IN (SELECT range_id FROM devill.link WHERE domain_id = {img_id} AND property_code = 'P67')     
    """
    g.cursor.execute(sql)
    linkedEnts = g.cursor.fetchall()

    if extension in ('.png', '.bmp', '.jpg', '.jpeg'):
        canvas = manifest.make_canvas_from_iiif(
            url=app.config['IIIF_URL'] + str(img_id) + extension)
        for row in linkedEnts:
            url = "<a href=" + request.url_root + 'entity/' + str(
                row.id) + ">" + row.ents + "</a>"
            anno = canvas.make_annotation(
                motivation="commenting",
                body={"type": "TextualBody",
                      "format": "text/html",
                      "value": url},
                target=canvas.id)
        manifest_json = json.loads(manifest.json())
        return manifest_json
    else:
        manifest_json = json.loads(manifest.json())
        manifest_json['entities'] = []
        for row in linkedEnts:
            url = "<a href=" + request.url_root + 'entity/' + str(
                row.id) + ">" + row.ents + "</a>"
            manifest_json['entities'].append(url)

    return manifest_json


@app.route('/file/<file_>')
def file(file_=None):
    filename = file_
    extension = filename.split(".")[-1]
    id = filename.split(".")[0]

    if extension in ['bmp', 'png', 'jpg', 'jpeg']:
        mimetype = "img"

    if extension in ['pdf']:
        mimetype = "pdf"

    if extension in ['svg']:
        mimetype = "vector"

    if extension in ['glb', 'webp']:
        mimetype = "threedee"

    if extension == 'json':
        return getManifest(id)

    manifest = request.url_root + 'file/' + id + '.json'

    downloadUrl = app.config['API_FILE_DISPLAY'] + filename

    return render_template('file/file.html', id=id, mimetype=mimetype,
                           filename=filename, manifest=manifest,
                           downloadUrl=downloadUrl)


@app.route('/edm/<img_id>')
@app.route('/edm/<img_id>/<direct>')
def edm(img_id=None, direct=False):
    from flask import Response, abort
    import xml.etree.ElementTree as ET
    import urllib, json, re

    if not direct:
        try:
            g.cursor.execute(f'SELECT edm FROM devill_meta.xml_data WHERE id = {img_id}')
            existing_edm = g.cursor.fetchone().edm
            if existing_edm:
                print('...')
                print('...')
                print('...')
                print('existing_edm')
                print('...')
                print('...')
                print('...')
                return Response(existing_edm, mimetype='application/xml')
            else:
                direct = True
        except Exception:
            print('not found')
            direct = True

    if direct:
        print('...')
        print('...')
        print('...')
        print('direct_edm')
        print('...')
        print('...')
        print('...')
        filetypeJson = app.config['API_URL'] + app.config[
            'FILETYPE_API'] + '?file_id=' + str(img_id)

        iiif = False

        with urllib.request.urlopen(
                filetypeJson) as url:
            filedata = json.loads(url.read().decode())
            for file_id, dataset in filedata.items():
                if not dataset['publicShareable']:
                    abort(403)
                else:
                    extension = dataset['extension'],
                    if extension:
                        identifier = app.config[
                                         'META_RESOLVE_URL'] + '/file/' + str(
                            file_id) + extension[0]
                        license = dataset['license']

                        if extension[0] in ('.jpg', '.jpeg', '.png', '.bmp'):
                            iiif = True



        def get_lan_text(id):

            g.cursor.execute(
                f'SELECT description FROM devill.entity WHERE id = {id}')
            result = g.cursor.fetchone().description
            if result:
                if '##_' in result:
                    # Adjust the regex pattern to correctly capture content with possible leading/trailing newlines
                    pattern = r"##([a-z]{2})_##\s*(.*?)\s*##_[a-z]{2}##"
                    matches = re.findall(pattern, result, re.DOTALL)

                    # Convert the matches to the desired format
                    description = [{lang: content.strip()} for lang, content in
                                   matches]
                    return description
                else:
                    description = [{'none': result}]
                    return description
            return get_lan_labels(id)

        def get_lan_labels(id):
            sql = """
                SELECT ab.description AS label, c.description AS lan
                FROM devill.entity a 
                JOIN devill.link ab ON a.id = ab.range_id JOIN devill.entity c ON c.id = ab.domain_id 
                WHERE ab.domain_id IN (197088,197086) AND a.id =%(id)s ORDER BY ab.description"""
            g.cursor.execute(sql, {'id': id})
            result = g.cursor.fetchall()
            labels = []
            for row in result:
                labels.append({row.lan: row.label})
            g.cursor.execute(f'SELECT name FROM devill.entity WHERE id={id}')
            label = g.cursor.fetchone()
            labels.append({'none': label.name})
            return (labels)


        def get_edm_type(id):
            g.cursor.execute(f'SELECT name FROM devill.entity WHERE id = {id}')
            name = g.cursor.fetchone().name
            types_ = {
                'IMAGE': ['fot', 'gla', 'kap', 'ker', 'kno', 'met', 'sch', 'skz',
                          'bmp', '.jpg', '.png', '.webp', '.jpeg', '.svg'],
                'TEXT': ['anm', 'hon', 'lit', 'man', 'son', 'squ', '.pdf'],
                '3D': ['.glb']
            }

            for type_, keywords in types_.items():
                for keyword in keywords:
                    if f'_{keyword}_' in name:
                        return type_

            for type_, keywords in types_.items():
                for keyword in keywords:
                    if keyword in extension[0]:
                        return type_

            return None  # Return None if no match is found

        def get_dc_type(id):
            dc_types_ = {
                '300046300': ['fot'],  # Photographs (jpg)
                '300191086': ['.jpg', '.bmp', '.png', '.webp', '.jpeg', '.svg'],
                # Images (general, including drawings, photos)
                '300010898': ['gla'],  # Glassware (svg)
                '300028094': ['kap'],  # Cadastral maps
                '300010666': ['ker'],  # Ceramics (svg)
                '300011798': ['kno'],  # Bones (svg)
                '300263751': ['lit', '.pdf'],  # Text (general)
                '300028094': ['.glb'],  # Topographical relief map
                '300263751': ['man'],  # Manuscripts
                '300015336': ['met'],  # Metalwork (svg)
                '300011790': ['sch'],  # Slag (svg)
                '300033973': ['skz'],  # Sketches (jpg)
                '300027200': ['anm', 'son'],  # Notes (TEXT)
                '300263751': ['squ'],  # Written documents (pdf)
            }

            g.cursor.execute(f'SELECT name FROM devill.entity WHERE id = {id}')
            name = g.cursor.fetchone().name

            for aat_id, keywords in dc_types_.items():
                for keyword in keywords:
                    if f'_{keyword}_' in name:
                        return 'http://vocab.getty.edu/page/aat/' + aat_id

            for aat_id, keywords in dc_types_.items():


                for keyword in keywords:

                    if keyword == extension[0]:
                        return 'http://vocab.getty.edu/page/aat/' + aat_id
            return None  # Return None if no match is found


        def get_subject_rdf(ids):
            #print(ids)
            urls = []
            for id in ids:
                g.cursor.execute(f"""
                    SELECT r.resolver_url || l.description AS url, l.range_id AS type_id 
                    FROM web.reference_system r JOIN devill.link l 
                    ON r.entity_id = l.domain_id 
                    WHERE r.resolver_url != '' AND l.range_id = {id}
                """)

                result = g.cursor.fetchall()
                #print(result)
                if result:
                    for row in result:
                        if row.url.startswith('http'):
                            urls.append(row.url)
                return urls



        def get_date(id, what):
            g.cursor.execute(
                f"SELECT TO_CHAR({what}, 'YYYY-MM-DD') as date FROM devill.entity WHERE id={id}")
            result = g.cursor.fetchone().date
            return result

        subjecttypes = []
        timeids = []

        def get_subjects(id):
            returndata = {
                'subjects_str': [],
                'place_part_of': [],
                'place':[],
                'dcterms_spatial': [],
                'dcterms_spatial_strings': [],
                'timespan': [],
                'timestrings': [],
            }

            sql = """
            SELECT
                s.type_id AS type_id,
                s.type,
                s.path,
                s.min,
                s.max,
                s.lon, 
                s.lat, 
                e.child_id
            FROM devill.entities e
                     JOIN devill.link l ON e.child_id = l.range_id
                     JOIN devill.entity e1 ON e1.id = l.domain_id
            JOIN devill.searchdata s ON s.child_id = e.child_id
            WHERE l.property_code = 'P67'
              AND e1.openatlas_class_name = 'file' AND e1.id = %(id)s
            """

            g.cursor.execute(sql, {'id': id})
            subjects = g.cursor.fetchall()
            ids = []
            for row in subjects:
                if row.child_id not in ids:
                    returndata['dcterms_spatial'].append(
                        'https:/devill.oegmn.or.at/entity/' + str(row.child_id))
                    intermed = get_lan_labels(row.child_id)
                    for name in intermed:
                        returndata['dcterms_spatial_strings'].append(name)
                    ids.append(row.child_id)
                if row.type_id != 0 and not row.min and not row.max and not row.path.startswith(
                        'Dimensions >') and not row.path.startswith(
                    'Administrative unit >') and not row.path.startswith(
                    'Country >') and not row.path.startswith(
                    'Case Study >') :
                    subjectstrings = get_lan_labels(row.type_id)
                    subjecttypes.append(row.type_id)
                    for string in subjectstrings:
                        if string not in returndata['subjects_str']:
                            returndata['subjects_str'].append(string)
                if row.path:
                    if row.type_id != 0 and row.path.startswith('Historical place >') or row.path.startswith('Administrative unit >'):
                        intermed = get_lan_labels(row.type_id)
                        for name in intermed:
                            if name not in returndata['dcterms_spatial_strings']:
                                returndata['dcterms_spatial_strings'].append(name)
                if row.type_id == 0 and (row.min and row.max):
                    returndata['timespan'].append(
                        str(int(row.min)) + '-' + str(int(row.max)))
                if row.type_id == 0 and (row.min and not row.max):
                    returndata['timespan'].append(str(int(row.min)))
                if row.type_id == 0 and (row.max and not row.min):
                    returndata['timespan'].append(str((row.max)))
                if row.path:
                    if row.path.startswith('Chron'):
                        intermed = get_lan_labels(row.type_id)
                        timeids.append(row.type_id)
                        #print(row)
                        for name in intermed:
                            if name not in returndata['timestrings']:
                                returndata['timestrings'].append(name)

            return returndata

        data = {
            'identifier': identifier,
            'description': get_lan_text(img_id),
            'type': get_dc_type(img_id),
            'title': get_lan_labels(img_id),
            'language': ['de'],
            'created': get_date(img_id, 'created'),
            'subject_str': get_subjects(img_id)['subjects_str'],
            'subject_rdf': get_subject_rdf(subjecttypes),
            'spatial': get_subjects(img_id)['dcterms_spatial'],
            'spatial_str': get_subjects(img_id)['dcterms_spatial_strings'],
            'place': get_subjects(img_id)['place'],
            'temporal': get_subjects(img_id)['timespan'],
            'temporal_str': get_subjects(img_id)['timestrings'],
            'temporal_rdf': get_subject_rdf(timeids),
            'edm_type': get_edm_type(img_id),
            'dataProvider': app.config['META_ORGANISATION'],
            'provider': 'Kulturpool',
            'isShownAt': identifier + '#object',
            'isShownBy': app.config['API_FILE_DISPLAY'] + img_id,
            'rights': None
        }



        data['description'] = get_lan_text(img_id)

        sql = """
               SELECT e.name AS image,
                      e.description,
                      l.property_code,
                      CASE
                          WHEN l.range_id = e.id AND p.name_inverse IS NOT NULL THEN p.name_inverse
                          ELSE p.name
                          END property,
                      l.description AS spec,
                      e2.id,
                      e2.name,
                      e2.description AS info
               from devill.entity e
                        LEFT JOIN devill.link l ON e.id IN (l.domain_id, l.range_id)
                        LEFT JOIN devill.entity e2 ON e2.id IN (l.domain_id, l.range_id)
                        JOIN model.property p ON l.property_code = p.code
               WHERE e.id = %(id)s
                 AND e2.id != e.id;
           """

        g.cursor.execute(sql, {'id': img_id})
        result = g.cursor.fetchall()

        g.cursor.execute(
            f'SELECT description FROM devill.entity WHERE id = {img_id}')
        filedescription = g.cursor.fetchone()

        if license:
            attribution = ''
            source = ''
            sourceThere = False
            for row in result:
                if row.property == 'is referred to by':
                    sourceThere = True
                    source += row.name
                    if row.info:
                        source += ': ' + row.info
                    if row.spec:
                        source += ' ' + row.spec
                if row.name == license and row.property_code == 'P2':
                    try:
                        license_uri = (re.search(
                            '##licenseUrl_##(.*)##_licenseUrl##',
                            row.info).group(1)).replace('https', 'http')
                    except Exception:
                        license_uri = None
                    if license_uri:
                        try:
                            data['rights'] = license_uri
                        except Exception:
                            pass
                    else:
                        data['rights'] = app.config["META_RESOLVE_URL"] + '/vocabulary/' + str(row.id)
                        attribution = row.name
                        if row.info:
                            attribution += ': ' + row.info
                        if row.spec:
                            attribution += ' ' + row.spec
            if sourceThere:
                attribution += str(' - ' + source)
            if filedescription.description:
                attribution += str(' - ' + filedescription.description)
            if attribution.startswith(' - '):
                attribution = attribution[3:]

            data['source'] = attribution

        #print(data)

        def create_subelement(parent, tag, text=None, lang=None, attrib=None):
            """
            Create a subelement with optional text, language attributes, and additional attributes.

            Args:
            - parent: The parent XML element to which the new element will be added.
            - tag: The tag name for the new element.
            - text: The text content for the new element (default is None).
            - lang: The language attribute value for the new element (default is None).
            - attrib: A dictionary of additional attributes (default is None).

            Returns:
            - The newly created XML element.
            """
            # Create the attribute dictionary
            if attrib is None:
                attrib = {}

            if lang and lang != 'none':
                attrib['xml:lang'] = lang.lower()

            # Create the new subelement with attributes
            el = ET.SubElement(parent, tag, attrib=attrib)

            # Set the text content if provided
            if text:
                el.text = text

            return el

        # Create EDM XML structure
        root = ET.Element('rdf:RDF', {
            'xmlns:rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'xmlns:edm': 'http://www.europeana.eu/schemas/edm/',
            'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
            'xmlns:dcterms': 'http://purl.org/dc/terms/',
            'xmlns:ore': 'http://www.openarchives.org/ore/terms/',
            'xmlns:cc': 'http://creativecommons.org/ns#',
            'xmlns:odrl': 'http://www.w3.org/ns/odrl/2/',
            'xmlns:svcs' : 'http://rdfs.org/sioc/services#'
        })

        # edm_ProvidedCHO
        provided_cho = ET.SubElement(root, 'edm:ProvidedCHO', {
            'rdf:about': f'{identifier}#'
        })

        if iiif:
            web_resource = ET.SubElement(root, 'edm:WebResource', {
                'rdf:about': f'{identifier}#iiif'
            })

            create_subelement(web_resource, 'dcterms:isReferencedBy',
                              attrib={'rdf:resource': app.config["META_RESOLVE_URL"] + '/file/' + str(img_id) + '.json' })

            create_subelement(web_resource, 'svcs:has_service',
                              attrib={'rdf:resource': app.config[
                                                          "IIIF_URL"] + str(img_id) + extension[0]})

        # - dc:title
        for row in sorted(data['title'], key=lambda x: (next(iter(x)), next(iter(x.values())))):
            for key, item in sorted(row.items()):
                tag = 'dc:title'
                create_subelement(provided_cho, tag, item, key)

        # - dc:description
        for row in sorted(data['description'], key=lambda x: (next(iter(x)), next(iter(x.values())))):
            for key, item in sorted(row.items()):
                tag = 'dc:description'
                create_subelement(provided_cho, tag, item, key)

        # - dc:subject
        if data['subject_str']:
            for row in sorted(data['subject_str'], key=lambda x: (next(iter(x)), next(iter(x.values())))):
                for key, item in sorted(row.items()):
                    tag = 'dc:subject'
                    create_subelement(provided_cho, tag, item, key)

        if data['subject_rdf']:
            for url in sorted(data.get('subject_rdf', [])):
                create_subelement(provided_cho, 'dc:subject',
                                  attrib={'rdf:resource': url})

        # - dc:language
        for lang in sorted(data.get('language', [])):
            create_subelement(provided_cho, 'dc:language', lang)

        if data['spatial_str']:
            for row in sorted(data['spatial_str'], key=lambda x: (next(iter(x)), next(iter(x.values())))):
                for key, item in sorted(row.items()):
                    tag = 'dcterms:spatial'
                    create_subelement(provided_cho, tag, item, key)

        if data['spatial']:
            for spatial_entry in sorted(data.get('spatial', [])):
                create_subelement(provided_cho, 'dcterms:spatial',
                                  attrib={'rdf:resource': spatial_entry})

        # - dc:type
        dc_type_value = data.get('type')
        if dc_type_value:
            create_subelement(provided_cho, 'dc:type',
                              attrib={'rdf:resource': dc_type_value})

        # - dcterms:temporal
        if data['temporal']:
            for entry in sorted(data.get('temporal', [])):
                create_subelement(provided_cho, 'dcterms:temporal', entry)

        # - dcterms:temporal_str
        if data['temporal_str']:
            for row in sorted(data['temporal_str'], key=lambda x: (next(iter(x)), next(iter(x.values())))):
                for key, item in sorted(row.items()):
                    tag = 'dcterms:temporal'
                    create_subelement(provided_cho, tag, item, key)

        if data['temporal_rdf']:
            for url in sorted(data.get('temporal_rdf', [])):
                create_subelement(provided_cho, 'dcterms:temporal',
                                  attrib={'rdf:resource': url})

        # - dcterms:created
        if data['created']:
            create_subelement(provided_cho, 'dcterms:created', data.get('created'))

        # - dc:source
        if data['source']:
            create_subelement(provided_cho, 'dc:source', data.get('source'))

        # - edm:type
        if data['edm_type']:
            create_subelement(provided_cho, 'edm:type', data.get('edm_type'))

        # ore_Aggregation
        aggregation = ET.SubElement(root, 'ore:Aggregation')

        # - edm:aggregatedCHO
        create_subelement(aggregation, 'edm:aggregatedCHO', attrib={'rdf:resource': data.get('identifier')})

        # - edm:dataProvider
        create_subelement(aggregation, 'edm:dataProvider', data.get('dataProvider'))

        # - edm:isShownAt
        if data['isShownAt']:
            create_subelement(aggregation, 'edm:isShownAt', attrib={'rdf:resource': data.get('isShownAt')})

        # - edm:isShownBy
        if data['isShownBy']:
            create_subelement(aggregation, 'edm:isShownBy', attrib={'rdf:resource': data.get('isShownBy')})

        # - edm:provider
        create_subelement(aggregation, 'edm:provider', data.get('provider'))

        # - edm:rights
        if data['rights']:
            create_subelement(aggregation, 'edm:rights', attrib={'rdf:resource': data.get('rights')})

        # Generate the XML string
        xml_str = ET.tostring(root, encoding='unicode')
        return Response(xml_str, mimetype='application/xml')
