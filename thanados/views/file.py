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
        from model.entity e
                 LEFT JOIN model.link l ON e.id IN (l.domain_id, l.range_id)
                 LEFT JOIN model.entity e2 ON e2.id IN (l.domain_id, l.range_id)
                 JOIN model.property p ON l.property_code = p.code
        WHERE e.id = %(id)s
          AND e2.id != e.id;
    """

    g.cursor.execute(sql, {'id': img_id})
    result = g.cursor.fetchall()

    g.cursor.execute(
        f'SELECT description FROM model.entity WHERE id = {img_id}')
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
            "<span><a href='"+ app.config['API_FILE_DISPLAY']+img_id + extension +"'>Download</a></span>"]})],
        requiredStatement=KeyValueString(label="Attribution",
                                         value=attribution),

    )

    sql = f"""
        SELECT child_id AS id, child_name || ' (' || typename || ')' AS ents FROM devill.entities WHERE child_id IN (SELECT range_id FROM model.link WHERE domain_id = {img_id} AND property_code = 'P67')     
    """
    g.cursor.execute(sql)
    linkedEnts = g.cursor.fetchall()

    if extension in ('.png', '.bmp', '.jpg', '.jpeg'):
        canvas = manifest.make_canvas_from_iiif(
            url=app.config['IIIF_URL'] + str(img_id) + extension)
        for row in linkedEnts:
            url = "<a href=" + request.url_root + 'entity/' + str(row.id) + ">" + row.ents + "</a>"
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

    print(extension)

    if extension in ['bmp', 'png', 'jpg', 'jpeg']:
        print('img: ' + filename)
        mimetype = "img"

    if extension in ['pdf']:
        print('doc: ' + filename)
        mimetype = "pdf"

    if extension in ['svg']:
        print('vector: ' + filename)
        mimetype = "vector"

    if extension in ['glb', 'webp']:
        print('3D: ' + filename)
        mimetype = "threedee"

    if extension == 'json':
        return getManifest(id)

    manifest = request.url_root + 'file/' + id + '.json'

    downloadUrl = app.config['API_FILE_DISPLAY']+ filename

    return render_template('file/file.html', id=id, mimetype=mimetype,
                           filename=filename, manifest=manifest, downloadUrl=downloadUrl)
