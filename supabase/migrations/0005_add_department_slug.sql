-- ============================================================================
-- Bihar Hub support: stable department identifiers for reliable filtering.
-- Text matching on `jobs.department` is ambiguous (BSSC and TRE 4.0 share the
-- same department string), so we add a curated slug column instead.
-- ============================================================================

alter table public.jobs add column department_slug text;

update public.jobs set department_slug = 'ssc'            where slug in ('ssc-cgl-2026', 'ssc-chsl-2025', 'ssc-gd-2026');
update public.jobs set department_slug = 'ibps'           where slug = 'ibps-po-17';
update public.jobs set department_slug = 'rrb'            where slug = 'rrb-group-d-2026';
update public.jobs set department_slug = 'upsc'           where slug = 'upsc-cse-2027';
update public.jobs set department_slug = 'psu'            where slug = 'ntpc-executive-2026';
update public.jobs set department_slug = 'bpsc'           where slug = 'bpsc-70th-ccae';
update public.jobs set department_slug = 'bihar-police'   where slug = 'bihar-police-constable-2026';
update public.jobs set department_slug = 'bssc'           where slug = 'bssc-inter-level-2026';
update public.jobs set department_slug = 'bihar-tre'      where slug = 'bihar-tre-4';
update public.jobs set department_slug = 'bihar-health'   where slug = 'bihar-staff-nurse-2026';
update public.jobs set department_slug = 'bihar-panchayat' where slug = 'bihar-gram-kachahari-2026';
update public.jobs set department_slug = 'uppolice'      where slug = 'up-police-constable-2026';
update public.jobs set department_slug = 'delhi-police'  where slug = 'delhi-police-constable-2026';

create index jobs_department_slug_idx on public.jobs (department_slug, state);