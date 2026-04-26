# Configuration Supabase pour le login email + création de comptes depuis l'app

À exécuter une seule fois dans le SQL Editor de Supabase. Idempotent : tu peux relancer sans risque.

## 1. Vérifier la structure de la table `profiles`

```sql
-- Crée la table si elle n'existe pas, ajoute les colonnes manquantes sinon
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  username    TEXT UNIQUE,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'user',
  photo_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS username    TEXT,
  ADD COLUMN IF NOT EXISTS email       TEXT,
  ADD COLUMN IF NOT EXISTS role        TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS photo_url   TEXT,
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

-- Unicité du pseudo (insensible à la casse)
DROP INDEX IF EXISTS profiles_username_unique_idx;
CREATE UNIQUE INDEX profiles_username_unique_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Contrainte sur les rôles autorisés
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'boss', 'kitchen'));
```

## 1.bis. Fonction RPC pour résoudre pseudo → email avant le login

```sql
-- Permet à l'app de résoudre un pseudo en email pour ensuite faire signIn,
-- SANS exposer la table profiles complète aux utilisateurs anonymes.
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT email FROM public.profiles
  WHERE lower(username) = lower(p_username)
    AND email IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;
```

## 2. Politiques RLS

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper : retourne true si l'utilisateur courant a un rôle admin ou boss
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'boss')
  );
$$;

DROP POLICY IF EXISTS profiles_select_all_authenticated ON public.profiles;
CREATE POLICY profiles_select_all_authenticated
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS profiles_insert_self_or_admin ON public.profiles;
CREATE POLICY profiles_insert_self_or_admin
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
CREATE POLICY profiles_update_self_or_admin
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
CREATE POLICY profiles_delete_admin
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
```

## 3. Désactiver la confirmation d'email (sinon les nouveaux comptes ne peuvent pas se connecter avant de cliquer sur le lien)

Dashboard Supabase → **Authentication → Providers → Email** → décoche **Confirm email**, puis **Save**.

> Si tu préfères garder la confirmation activée, l'app affichera un message du type *« Le compte est créé. L'utilisateur doit cliquer sur le lien envoyé par email avant de pouvoir se connecter. »*

## 4. Créer le tout premier compte Boss

Tant qu'il n'y a aucun Boss, le helper `is_admin()` retourne `false` pour tout le monde et personne ne pourra créer le 1er admin/boss depuis l'app. Il faut donc créer ce 1er compte directement dans Supabase :

```sql
-- 1. Créer l'utilisateur via Auth
-- Va dans Authentication → Users → Add user → "Create new user"
-- Renseigne email + mot de passe + coche "Auto Confirm User"
-- Copie l'UUID généré (colonne ID).

-- 2. Insérer le profil Boss avec cet UUID, l'email choisi et un pseudo
INSERT INTO public.profiles (id, name, username, email, role)
VALUES ('UUID_COPIÉ_DEPUIS_AUTH', 'Boss', 'boss', 'boss@exemple.com', 'boss');
```

Ensuite tu te connectes dans l'app **avec ton email OU ton pseudo `boss`** + mot de passe → tu atterris sur le Cockpit Boss → onglet Utilisateurs → tu peux créer tous les autres comptes (Manager, Team BTB, Cuisine) depuis l'interface en renseignant nom + pseudo + email + mot de passe + rôle. Chaque utilisateur pourra ensuite se connecter avec son pseudo OU son email.
