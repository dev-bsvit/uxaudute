-- =====================================================
-- МИГРАЦИЯ: Исправление регистрации пользователей
-- =====================================================
-- Версия: 1.2
-- Дата: 15.09.2025
-- Описание: Добавление автоматического начисления 5 кредитов новым пользователям

-- Обновляем функцию handle_new_user для создания начального баланса
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Создаем профиль пользователя
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Создаем начальный баланс с 5 кредитами
  INSERT INTO public.user_balances (user_id, balance, grace_limit_used)
  VALUES (NEW.id, 5, false);
  
  -- Создаем транзакцию для начального баланса
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_after,
    source,
    description
  ) VALUES (
    NEW.id,
    'credit',
    5,
    5,
    'welcome',
    'Добро пожаловать! Начальный баланс 5 кредитов'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Проверяем, что trigger существует и пересоздаем его
DO $$
BEGIN
  -- Удаляем старый trigger если существует
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Создаем новый trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    
  RAISE NOTICE 'Trigger on_auth_user_created updated successfully';
END $$;

-- Проверяем результат
SELECT 'User registration credits fix applied successfully' as status;
