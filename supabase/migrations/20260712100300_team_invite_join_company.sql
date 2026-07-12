-- Eingeladene Nutzer einem bestehenden Unternehmen zuordnen (statt neues anzulegen)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_name TEXT;
  new_company_id UUID;
  invited_company_raw TEXT;
  invited_company_id UUID;
  invited_role TEXT;
  profile_role TEXT;
  user_role_value TEXT;
BEGIN
  invited_company_raw := NULLIF(
    trim(COALESCE(NEW.raw_user_meta_data ->> 'invited_company_id', '')),
    ''
  );

  IF invited_company_raw IS NOT NULL
     AND invited_company_raw ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  THEN
    invited_company_id := invited_company_raw::uuid;
    invited_role := COALESCE(
      NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'invited_role', '')), ''),
      'member'
    );
    profile_role := CASE
      WHEN invited_role IN ('admin', 'owner', 'super_admin') THEN 'admin'
      ELSE 'member'
    END;
    user_role_value := CASE
      WHEN invited_role IN ('admin', 'owner', 'super_admin') THEN 'admin'
      ELSE 'member'
    END;

    SELECT name INTO company_name
    FROM public.companies
    WHERE id = invited_company_id;

    IF company_name IS NULL THEN
      company_name := COALESCE(
        NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'firma', '')), ''),
        'Unternehmen'
      );
    END IF;

    INSERT INTO public.profiles (id, vorname, nachname, sprache, firma, company_id, role)
    VALUES (
      NEW.id,
      NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'vorname', '')), ''),
      NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'nachname', '')), ''),
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'sprache'), ''), 'de'),
      company_name,
      invited_company_id,
      profile_role
    );

    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (NEW.id, invited_company_id, user_role_value)
    ON CONFLICT (user_id, company_id) DO UPDATE
      SET role = EXCLUDED.role;

    RETURN NEW;
  END IF;

  company_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'firma', '')), '');
  IF company_name IS NULL THEN
    company_name := COALESCE(
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 2), ''),
      'Neues Unternehmen'
    );
  END IF;

  INSERT INTO public.companies (name)
  VALUES (company_name)
  RETURNING id INTO new_company_id;

  INSERT INTO public.profiles (id, vorname, nachname, sprache, firma, company_id, role)
  VALUES (
    NEW.id,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'vorname', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'nachname', '')), ''),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'sprache'), ''), 'de'),
    company_name,
    new_company_id,
    'owner'
  );

  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (NEW.id, new_company_id, 'admin')
  ON CONFLICT (user_id, company_id) DO NOTHING;

  RETURN NEW;
END;
$$;
