-- Step 1: Tambah kolom baru sebagai nullable
ALTER TABLE cities ADD COLUMN province_code VARCHAR(10) NULL;
ALTER TABLE subdistricts ADD COLUMN city_code VARCHAR(10) NULL;
ALTER TABLE villages ADD COLUMN subdistrict_code VARCHAR(10) NULL;

-- Step 2: Isi kolom baru dari data FK lama
UPDATE cities c
  JOIN provinces p ON c.province_id = p.id
  SET c.province_code = p.code;

UPDATE subdistricts s
  JOIN cities c ON s.city_id = c.id
  SET s.city_code = c.code;

UPDATE villages v
  JOIN subdistricts s ON v.subdistrict_id = s.id
  SET v.subdistrict_code = s.code;

-- Step 3: Hapus FK constraint dan kolom lama
ALTER TABLE cities DROP FOREIGN KEY fk_cities_province_id;
ALTER TABLE cities DROP INDEX idx_cities_province_id;
ALTER TABLE cities DROP COLUMN province_id;

ALTER TABLE subdistricts DROP FOREIGN KEY fk_subdistricts_city_id;
ALTER TABLE subdistricts DROP INDEX idx_subdistricts_city_id;
ALTER TABLE subdistricts DROP COLUMN city_id;

ALTER TABLE villages DROP FOREIGN KEY fk_villages_subdistrict_id;
ALTER TABLE villages DROP INDEX idx_villages_subdistrict_id;
ALTER TABLE villages DROP COLUMN subdistrict_id;

-- Step 4: Set kolom baru jadi NOT NULL
ALTER TABLE cities MODIFY COLUMN province_code VARCHAR(10) NOT NULL;
ALTER TABLE subdistricts MODIFY COLUMN city_code VARCHAR(10) NOT NULL;
ALTER TABLE villages MODIFY COLUMN subdistrict_code VARCHAR(10) NOT NULL;
