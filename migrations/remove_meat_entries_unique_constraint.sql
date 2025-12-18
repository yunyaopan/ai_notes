-- Remove unique constraint to allow multiple entries of the same meat type on the same date
ALTER TABLE meat_entries DROP CONSTRAINT meat_entries_user_id_date_meat_type_key;
