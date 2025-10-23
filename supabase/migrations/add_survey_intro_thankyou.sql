-- Добавление полей для intro screen и thank you screen в таблицу surveys
ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS intro_image_url TEXT,
ADD COLUMN IF NOT EXISTS intro_title TEXT,
ADD COLUMN IF NOT EXISTS intro_description TEXT,
ADD COLUMN IF NOT EXISTS thank_you_text TEXT,
ADD COLUMN IF NOT EXISTS thank_you_link TEXT,
ADD COLUMN IF NOT EXISTS thank_you_promo_code TEXT;

-- Комментарии для документации
COMMENT ON COLUMN surveys.intro_image_url IS 'URL изображения для вступительного экрана';
COMMENT ON COLUMN surveys.intro_title IS 'Заголовок вступительного экрана';
COMMENT ON COLUMN surveys.intro_description IS 'Описание вступительного экрана';
COMMENT ON COLUMN surveys.thank_you_text IS 'Текст благодарности на последнем экране';
COMMENT ON COLUMN surveys.thank_you_link IS 'Опциональная ссылка на экране благодарности';
COMMENT ON COLUMN surveys.thank_you_promo_code IS 'Опциональный промокод на экране благодарности';
