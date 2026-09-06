Default per-gift images for the Spin the Wheel game.

Each wheel segment shows a default image in the win/no-win popup, resolved by the
segment's position on the wheel (top = first). Drop PNG files here using this
naming, matching the segment order shown in the admin "Wheel Segments" list:

  gift-1.png   -> 1st segment
  gift-2.png   -> 2nd segment
  gift-3.png   -> 3rd segment
  gift-4.png   -> 4th segment
  gift-5.png   -> 5th segment
  gift-6.png   -> 6th segment
  ... (gift-N.png for the Nth segment)

Rules:
  - An image uploaded per-segment in the admin panel OVERRIDES the default here.
  - If no file exists for a segment and nothing is uploaded, no image is shown.
  - Reordering segments in admin changes which default file each one uses
    (defaults follow position, not name).

Recommended: square images (e.g. 512x512) with a transparent or solid
background; they are displayed at 224x224, cover-cropped, with rounded corners.
