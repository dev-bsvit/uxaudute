-- Добавляем колонку preferred_language в таблицу profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'ru';

-- Создаем индекс для быстрого поиска по языку
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON profiles(preferred_language);

-- Добавляем комментарий к колонке
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred interface language (ISO 639-1 code)';

-- Обновляем существующие записи, устанавливая русский язык по умолчанию
UPDATE profiles SET preferred_language = 'ru' WHERE preferred_language IS NULL;