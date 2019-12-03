
-- cleanup for geometries
-- remove point geom if it is the same as parent entity
DROP TABLE IF EXISTS thanados.giscleanup;
CREATE TABLE thanados.giscleanup AS
 (
SELECT 	e.system_type,
	e.child_name,
	e.parent_id,
	e.child_id,
	l.property_code,
	l.range_id,
	g.id,
	g.geom
	FROM thanados.entities e JOIN model.link l ON e.child_id = l.domain_id JOIN gis.point g ON l.range_id = g.entity_id WHERE l.property_code = 'P53');

DELETE FROM gis.point g WHERE g.id in (
SELECT g2.id FROM thanados.giscleanup g1 JOIN thanados.giscleanup g2 ON g1.child_id = g2.parent_id WHERE g1.geom = g2.geom  AND g1.system_type = 'stratigraphic unit' ORDER BY g1.system_type, g1.child_id, g2.child_name);

DELETE FROM gis.point g WHERE g.id in (
SELECT g2.id FROM thanados.giscleanup g1 JOIN thanados.giscleanup g2 ON g1.child_id = g2.parent_id WHERE g1.geom = g2.geom  AND g1.system_type = 'feature' ORDER BY g1.system_type, g1.child_id, g2.child_name);

DELETE FROM gis.point g WHERE g.id in (
SELECT g2.id FROM thanados.giscleanup g1 JOIN thanados.giscleanup g2 ON g1.child_id = g2.parent_id WHERE g1.geom = g2.geom  AND g1.system_type = 'place' ORDER BY g1.system_type, g1.child_id, g2.child_name);

DROP TABLE IF EXISTS thanados.giscleanup;

--remove point geom if polygon geom exists
DROP TABLE IF EXISTS thanados.giscleanup;
CREATE TABLE thanados.giscleanup AS
 (
SELECT 	e.system_type,
	e.child_name,
	e.parent_id,
	e.child_id,
	l.property_code,
	l.range_id,
	g.id,
	g.geom AS poly_id,
	g2.id AS point_id,
	g2.geom
	FROM thanados.entities e JOIN model.link l ON e.child_id = l.domain_id JOIN gis.polygon g ON l.range_id = g.entity_id JOIN gis.point g2 ON g.entity_id = g2.entity_id WHERE l.property_code = 'P53');

DELETE FROM gis.point WHERE id IN (SELECT point_id FROM thanados.giscleanup);
DROP TABLE IF EXISTS thanados.giscleanup;


--cleanup for timespans
UPDATE model.entity SET begin_to = begin_from WHERE begin_to IS NULL AND begin_from IS NOT NULL;
UPDATE model.entity SET end_to = end_from WHERE end_to IS NULL AND end_from IS NOT NULL;

DROP TABLE IF EXISTS thanados.idpath;
CREATE TABLE thanados.idpath AS
(SELECT
	s.child_id AS site_id,
	m1.begin_from AS site_begin_from,
	m1.begin_to AS site_begin_to,
	m1.end_from AS site_end_from,
	m1.end_to AS site_end_to,
	g.child_id AS grave_id,
	m2.begin_from AS grave_begin_from,
	m2.begin_to AS grave_begin_to,
	m2.end_from AS grave_end_from,
	m2.end_to AS grave_end_to,
	b.child_id AS burial_id,
	m3.begin_from AS burial_begin_from,
	m3.begin_to AS burial_begin_to,
	m3.end_from AS burial_end_from,
	m3.end_to AS burial_end_to,
	f.child_id AS find_id,
	m4.begin_from AS find_begin_from,
	m4.begin_to AS find_begin_to,
	m4.end_from AS find_end_from,
	m4.end_to AS find_end_to

FROM thanados.sites s LEFT JOIN model.entity m1 on s.child_id = m1.id
	LEFT JOIN thanados.graves g ON s.child_id = g.parent_id LEFT JOIN model.entity m2 on g.child_id = m2.id
	LEFT JOIN thanados.burials b ON g.child_id = b.parent_id LEFT JOIN model.entity m3 on b.child_id = m3.id
	LEFT JOIN thanados.finds f ON b.child_id = f.parent_id LEFT JOIN model.entity m4 on f.child_id = m4.id );


UPDATE thanados.idpath SET grave_begin_from = site_begin_from WHERE grave_begin_from < site_begin_from;
UPDATE thanados.idpath SET grave_begin_to = grave_begin_from WHERE grave_begin_to < grave_begin_from;
UPDATE thanados.idpath SET grave_end_to = site_end_to WHERE grave_end_to > site_end_to;
UPDATE thanados.idpath SET grave_end_from = grave_end_to WHERE grave_end_from > grave_end_to;
UPDATE thanados.idpath SET burial_begin_from = grave_begin_from WHERE burial_begin_from < grave_begin_from;
UPDATE thanados.idpath SET burial_begin_to = burial_begin_from WHERE burial_begin_to < burial_begin_from;
UPDATE thanados.idpath SET burial_end_to = grave_end_to WHERE burial_end_to > grave_end_to;
UPDATE thanados.idpath SET burial_end_from = burial_end_to WHERE burial_end_from > burial_end_to;

UPDATE model.entity SET begin_from = grave_begin_from FROM (SELECT id, grave_begin_from FROM model.entity e JOIN thanados.idpath i ON id = grave_id WHERE begin_from != grave_begin_from) a WHERE a.id = model.entity.id;
UPDATE model.entity SET begin_to = grave_begin_to FROM (SELECT id, grave_begin_to FROM model.entity e JOIN thanados.idpath i ON id = grave_id WHERE begin_to != grave_begin_to) a WHERE a.id = model.entity.id;

UPDATE model.entity SET end_from = grave_end_from FROM (SELECT id, grave_end_from FROM model.entity e JOIN thanados.idpath i ON id = grave_id WHERE end_from != grave_end_from) a WHERE a.id = model.entity.id;
UPDATE model.entity SET end_to = grave_end_to FROM (SELECT id, grave_end_to FROM model.entity e JOIN thanados.idpath i ON id = grave_id WHERE end_to != grave_end_to) a WHERE a.id = model.entity.id;

UPDATE model.entity SET begin_from = burial_begin_from FROM (SELECT id, burial_begin_from FROM model.entity e JOIN thanados.idpath i ON id = burial_id WHERE begin_from != burial_begin_from) a WHERE a.id = model.entity.id;
UPDATE model.entity SET begin_to = burial_begin_to FROM (SELECT id, burial_begin_to FROM model.entity e JOIN thanados.idpath i ON id = burial_id WHERE begin_to != burial_begin_to) a WHERE a.id = model.entity.id;

UPDATE model.entity SET end_from = burial_end_from FROM (SELECT id, burial_end_from FROM model.entity e JOIN thanados.idpath i ON id = burial_id WHERE end_from != burial_end_from) a WHERE a.id = model.entity.id;
UPDATE model.entity SET end_to = burial_end_to FROM (SELECT id, burial_end_to FROM model.entity e JOIN thanados.idpath i ON id = burial_id WHERE end_to != burial_end_to) a WHERE a.id = model.entity.id;







