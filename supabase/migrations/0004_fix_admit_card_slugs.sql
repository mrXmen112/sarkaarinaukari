-- ============================================================================
-- Corrective migration: admit_card slugs were seeded with the parent job slug
-- (0003 bug). Fix them to the intended unique slugs so /admit-card/[slug]
-- routes resolve correctly.
-- ============================================================================

update public.admit_cards set slug = 'ssc-gd-2026-admit-card'             where slug = 'ssc-gd-2026';
update public.admit_cards set slug = 'ibps-po-17-admit-card'              where slug = 'ibps-po-17';
update public.admit_cards set slug = 'bihar-police-constable-2026-admit-card' where slug = 'bihar-police-constable-2026';
update public.admit_cards set slug = 'up-police-constable-2026-admit-card' where slug = 'up-police-constable-2026';
update public.admit_cards set slug = 'rrb-group-d-2026-admit-card'        where slug = 'rrb-group-d-2026';