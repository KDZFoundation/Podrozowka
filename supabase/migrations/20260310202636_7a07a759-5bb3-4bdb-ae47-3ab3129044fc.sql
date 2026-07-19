
-- Trigger: recalculate gamification when inventory_unit is assigned to a traveler
CREATE OR REPLACE TRIGGER trg_inventory_unit_recalc_gamification
  AFTER INSERT OR UPDATE ON public.inventory_units
  FOR EACH ROW
  EXECUTE FUNCTION public.on_inventory_unit_recalc_gamification();

-- Trigger: recalculate gamification when a new registration happens
CREATE OR REPLACE TRIGGER trg_registration_recalc_gamification
  AFTER INSERT ON public.recipient_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_registration_recalc_gamification();

-- Trigger: add kilometers on registration
CREATE OR REPLACE TRIGGER trg_registration_add_kilometers
  AFTER INSERT ON public.recipient_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_registration_add_kilometers();

-- Trigger: notify traveler on new registration
CREATE OR REPLACE TRIGGER trg_notify_on_new_registration
  AFTER INSERT ON public.recipient_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_registration();

-- Trigger: notify on rank change
CREATE OR REPLACE TRIGGER trg_notify_on_rank_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_rank_change();

-- Trigger: log inventory unit events
CREATE OR REPLACE TRIGGER trg_log_inventory_unit_event
  AFTER INSERT OR UPDATE ON public.inventory_units
  FOR EACH ROW
  EXECUTE FUNCTION public.log_inventory_unit_event();

-- Trigger: shipment status changes
CREATE OR REPLACE TRIGGER trg_on_shipment_shipped
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_shipment_shipped();

-- Trigger: update member count on new profile
CREATE OR REPLACE TRIGGER trg_update_member_count
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_member_count();

-- Trigger: update updated_at on profiles
CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update updated_at on inventory_units
CREATE OR REPLACE TRIGGER trg_inventory_units_updated_at
  BEFORE UPDATE ON public.inventory_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update updated_at on orders
CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: validate profile input
CREATE OR REPLACE TRIGGER trg_validate_profile_input
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_input();

-- Trigger: validate registration input
CREATE OR REPLACE TRIGGER trg_validate_registration_input
  BEFORE INSERT OR UPDATE ON public.recipient_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_registration_input();
