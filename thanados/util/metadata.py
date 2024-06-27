import json
from datetime import datetime

from flask import g

from thanados import app


def get_metadata(id):
    metadata = {
        "@context": {
            "@vocab": "https://schema.org/",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "dev": "https://devill.oegmn.or.at/entity/",
            "loud": "https://linked.art/ns/v1/linked-art.json",
            "dct": "http://purl.org/dc/terms/",
            "aat": "http://vocab.getty.edu/aat/",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "lawd": "http://lawd.info/ontology/",
            "gvp": "http://vocab.getty.edu/ontology#",
            "tgn": "http://vocab.getty.edu/tgn/",
            "crm": "http://erlangen-crm.org/current/",
        },
        "@id": 'dev:' + str(id),
        "url": app.config["META_RESOLVE_URL"] + '/entity/' + str(id),
        "@type": "Dataset",
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "distribution": {
            "@type": "DataDownload",
            "contentUrl": app.config["META_RESOLVE_URL"] + '/entity/' + str(
                id) + '/json',
            "encodingFormat": ["text/javascript", "text/html"],
            "license": "https://creativecommons.org/licenses/by/4.0/"
        },
        "isAccessibleForFree": "true",
        "accessMode": ["textual", "visual"],
        "creator": {
            "@type": "ResearchProject",
            "name": app.config["META_PUBLISHER"],
            "sameAs": app.config["META_RESOLVE_URL"],
            "parentOrganization": {
                "@type": "Organization",
                "name": app.config["META_ORGANISATION"],
                "sameAs": [app.config["META_ORG_URL"],
                           app.config["META_ORG_WD"]]
            }
        }
    }

    g.cursor.execute("SELECT name, cidoc_class_code, " \
                     "split_part(description, '##', 1) AS desc, created, " \
                     "modified FROM model.entity WHERE id = %(id)s", {"id": id})
    result1 = g.cursor.fetchone()

    created = result1.created.strftime('%Y-%m-%d')

    if result1.modified:
        modified = result1.modified.strftime('%Y-%m-%d')
    else:
        modified = created

    metadata.update({"Name": result1.name})
    #metadata.update({"dct:title": result1.name})
    #metadata.update({"dct:abstract": result1.desc})
    metadata.update({"Description": result1.desc})
    metadata.update({"dateCreated": created})
    metadata.update({"dateModified": modified})

    g.cursor.execute("SELECT name FROM model.cidoc_class WHERE code = %(crm)s",
                     {"crm": result1.cidoc_class_code})

    crm = g.cursor.fetchone()

    g.cursor.execute("SELECT name,id, description FROM devill.maintype " \
                     "WHERE entity_id = %(id)s", {"id": id})
    result = g.cursor.fetchone()

    keyword1 = result.name

    about = {
        "@id": app.config["META_RESOLVE_URL"] + '/entity/' + str(id) + '#',
        "@type": "Thing",
        "loud:type": (crm.name).replace(' ', ''),
        "@additionalType": {
            "@type": "DefinedTerm",
            "@id": app.config["META_RESOLVE_URL"] + '/vocabulary/' + str(
                result.id),
            "name": keyword1
        }

    }

    g.cursor.execute("SELECT url, skos, prefterm FROM devill.ext_types " \
                     "WHERE type_id = %(type_id)s", {"type_id": result.id})

    resultExtTypes = g.cursor.fetchall()

    keywords = [keyword1]

    if resultExtTypes:

        matches = []
        matchentries = []

        for row in resultExtTypes:
            if row.prefterm not in keywords:
                keywords.append(row.prefterm)
            match = 'skos:' + (row.skos).replace(' match', 'Match')
            matchEntry = (row.url).replace('http://vocab.getty.edu/page/aat/', 'http://vocab.getty.edu/aat/')
            matchentries.append({match:matchEntry})
            if match not in matches:
                about['@additionalType'].update({match: []})

        for row in resultExtTypes:
            match = 'skos:' + (row.skos).replace(' match', 'Match')
            matchEntry = (row.url).replace('http://vocab.getty.edu/page/aat/', 'http://vocab.getty.edu/aat/')
            about['@additionalType'][match].append(matchEntry)





        #about['@additionalType'].update([matches])

    metadata.update({"about": about})
    metadata.update({"keywords": keywords})

    g.cursor.execute("SELECT lon, lat FROM devill.searchdata " \
                     "WHERE child_id = %(id)s LIMIT 1",
                     {"id": id})
    result = g.cursor.fetchone()


    sql_geo = """
            SELECT g.*, l.domain_id
            FROM (SELECT t.id, t.name, e.url, e.skos
                    FROM devill.types_all t
                    JOIN devill.ext_types e ON t.id = e.type_id
            WHERE t.id IN %(places)s) g JOIN model.link l 
            ON g.id = l.range_id WHERE l.domain_id = %(id)s LIMIT 1
        """

    g.cursor.execute(sql_geo,
                     {"id": id, "places": app.config['COUNTRY_TYPES']})
    resultGeo = g.cursor.fetchone()

    spatial = {}

    if resultGeo:
        spatial = {"containedInPlace": {
            "@type": "Place",
            "name": resultGeo.name,
            "sameAs": resultGeo.url
        }}

    if result:
        if result.lat:
            spatial.update({
                "@type": "Place",
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": float(result.lat),
                    "longitude": float(result.lon)
                }
            })

    g.cursor.execute("SELECT url FROM devill.extrefs WHERE parent_id = " \
                     "%(id)s AND name = 'GeoNames' LIMIT 1", {"id": id})
    resultGN = g.cursor.fetchone()

    if resultGN:
        spatial.update({"skos:closeMatch": resultGN.url})

    metadata.update({"spatialCoverage": spatial})

    g.cursor.execute("SELECT min::INT, max::INT FROM devill.searchdata " \
                     "WHERE child_id = %(id)s AND type = 'timespan'",
                     {"id": id})
    result = g.cursor.fetchone()
    print (result)
    if result and result.min and result.max:
        metadata.update(
            {"temporalCoverage": str(result.min) + '/' + str(result.max)})

    sql_contr = """
        SELECT name, 'http'|| split_part(description, 'http', 2) 
        as url FROM devill.types 
        WHERE id IN %(domainIds)s 
        AND entity_id = %(id)s 
    """

    g.cursor.execute(sql_contr, {
        "domainIds": app.config['DOMAIN_TYPES'],
        "id": id})
    resultContr = g.cursor.fetchall()
    if resultContr:
        contributors =[]
        for row in resultContr:
            contributors.append(
                {"@type": "ResearchProject", "name": row.name, "sameAs": row.url}
            )
        metadata.update({"contributor": contributors})


    sqlCits = """
        SELECT DISTINCT title FROM  
        (SELECT title FROM devill.reference WHERE parent_id = %(id)s
        UNION ALL
        SELECT title FROM devill.reference WHERE parent_id = %(place_id)s) g
    """

    from thanados.models.entity import Data
    place_id = Data.get_parent_place_id(id)

    g.cursor.execute(sqlCits, {"id": id, "place_id": place_id})
    resultCits = g.cursor.fetchall()

    if resultCits:
        citation = []
        for row in resultCits:
            citation.append({"@type":"CreativeWork",
            "citation": row.title})
        metadata.update({"citation": citation})





    return (metadata)

    # print(metadata)
