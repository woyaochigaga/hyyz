ALTER TABLE offline_exhibitions
  DROP COLUMN IF EXISTS amap_poi_id,
  DROP COLUMN IF EXISTS amap_adcode,
  DROP COLUMN IF EXISTS amap_latitude,
  DROP COLUMN IF EXISTS amap_longitude;
