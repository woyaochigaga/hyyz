ALTER TABLE users
ADD COLUMN IF NOT EXISTS artisan_shop_platform VARCHAR(30) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artisan_shop_url VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artisan_shop_owner_name VARCHAR(120) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artisan_shop_contact_phone VARCHAR(30) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artisan_shop_verification_status VARCHAR(20) NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS artisan_shop_verification_note TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artisan_shop_verification_submitted_at timestamptz,
ADD COLUMN IF NOT EXISTS artisan_shop_verification_reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS artisan_shop_verification_reviewer VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artisan_shop_screenshot_url VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artisan_shop_owner_proof_url VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS artisan_shop_supporting_proof_url VARCHAR(500) NOT NULL DEFAULT '';
