
-- 1. Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Index for fast user lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- 3. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS: users can read own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. RLS: users can mark own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS: system (via security definer functions) inserts - no direct user inserts
-- Notifications are created only by triggers (SECURITY DEFINER), not by users directly.

-- 7. Admins can manage all notifications
CREATE POLICY "Admins can manage notifications"
  ON public.notifications
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 9. Trigger: notify on rank change
CREATE OR REPLACE FUNCTION public.notify_on_rank_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF OLD.current_rank IS DISTINCT FROM NEW.current_rank AND NEW.current_rank != 'Zwiadowca' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Awansowałeś!',
      'Gratulacje, Twoja nowa ranga to ' || NEW.current_rank || '!',
      'rank_up'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_rank_change
  AFTER UPDATE OF current_rank ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_rank_change();

-- 10. Trigger: notify traveler on new registration
CREATE OR REPLACE FUNCTION public.notify_on_new_registration()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  _traveler_id uuid;
BEGIN
  SELECT traveler_user_id INTO _traveler_id
  FROM public.inventory_units
  WHERE id = NEW.inventory_unit_id;

  IF _traveler_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      _traveler_id,
      'Nowa relacja!',
      'Ktoś właśnie zarejestrował Twoją Podróżówkę. Zdobywasz punkty Wpływu Kulturowego!',
      'new_registration'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_registration
  AFTER INSERT ON public.recipient_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_registration();
