insert into public.badge_images (level, image_uri, image_filename, description)
values
  (1, 'placeholder://badge-images/level-1.png', 'level-1.png', 'Level 1 badge placeholder'),
  (2, 'placeholder://badge-images/level-2.png', 'level-2.png', 'Level 2 badge placeholder'),
  (3, 'placeholder://badge-images/level-3.png', 'level-3.png', 'Level 3 badge placeholder'),
  (4, 'placeholder://badge-images/level-4.png', 'level-4.png', 'Level 4 badge placeholder'),
  (5, 'placeholder://badge-images/level-5.png', 'level-5.png', 'Level 5 badge placeholder'),
  (6, 'placeholder://badge-images/level-6.png', 'level-6.png', 'Level 6 badge placeholder'),
  (7, 'placeholder://badge-images/level-7.png', 'level-7.png', 'Level 7 badge placeholder'),
  (8, 'placeholder://badge-images/level-8.png', 'level-8.png', 'Level 8 badge placeholder'),
  (9, 'placeholder://badge-images/level-9.png', 'level-9.png', 'Level 9 badge placeholder'),
  (10, 'placeholder://badge-images/level-10.png', 'level-10.png', 'Level 10 badge placeholder')
on conflict (level) do update
set
  image_uri = excluded.image_uri,
  image_filename = excluded.image_filename,
  description = excluded.description,
  updated_at = now();
