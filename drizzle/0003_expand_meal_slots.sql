-- Migrate existing "snack" entries to "afternoon_snack"
UPDATE food_entries SET meal_slot = 'afternoon_snack' WHERE meal_slot = 'snack';
