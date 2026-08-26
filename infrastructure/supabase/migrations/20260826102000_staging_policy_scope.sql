-- Winlerr Phase 5 staging policy scope
-- Explicitly scope foundation data policies to authenticated users.
-- No product tables or data are created.

alter policy organizations_select_member on public.organizations
  to authenticated;
alter policy organizations_insert_authenticated on public.organizations
  to authenticated;
alter policy organizations_update_member on public.organizations
  to authenticated;
alter policy memberships_select_own on public.memberships
  to authenticated;
alter policy memberships_insert_self_or_admin on public.memberships
  to authenticated;
alter policy audit_log_select_member on public.audit_log
  to authenticated;
