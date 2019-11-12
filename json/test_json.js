{
    "type"
:
    "FeatureCollection",
        "@context"
:
    "https://thanados.openatlas.eu/api/v01/50505.jsonld",
        "features"
:
    [
        {
            "@id": "https://thanados.openatlas.eu/place/view/50505",
            "type": "Feature",
            "properties": {
                "title": "Thunau Obere Holzwiese",
                "ccodes": ["AT"]
            },
            "geometry": {
                "type": "GeometryCollection",
                "geometries": [
                    {
                        "type": "Point",
                        "coordinates": [15.643286705017092, 48.586735522177]
                    }
                ]
            },
            "when": {
                "timespans": [
                    {
                        "start": {
                            "earliest": "750-01-01",
                            "latest": "799-12-31"
                        },
                        "end": {
                            "earliest": "900-01-01",
                            "latest": "949-12-31"
                        }
                    }
                ]
            },
            "names": [
                {"toponym": "Thunau Obere Holzwiese", "lang": "de"},
                {"toponym": "Thunau Schanze", "lang": "de"}
            ],
            "types": [
                {
                    "identifier": "https://thanados.openatlas.eu/types/view/22378",
                    "label": "inhumation cemetery"
                }
            ],
            "links": [
                {
                    "type": "closeMatch",
                    "identifier": "https://www.geonames.org/2763660"
                }
            ],
            "relations": [
                {
                    "relationType": "crm:P2_has_type",
                    "relationTo": "https://thanados.openatlas.eu/types/view/5099",
                    "label": "Excavation"
                },
                {
                    "relationType": "crm:P67i_is_referred_to_by",
                    "relationTo": "https://thanados.openatlas.eu/reference/view/112759",
                    "label": "Nowotny 2018"
                },
                {
                    "relationType": "crm:P67i_is_referred_to_by",
                    "relationTo": "https://thanados.openatlas.eu/reference/view/116289",
                    "label": "https://doi.org/10.2307/j.ctv8xnfjn"
                }
            ]}
    ]
}