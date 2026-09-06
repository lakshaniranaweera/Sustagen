Default background images for the kiosk games.

Replace these exact files to change the built-in default backgrounds (used when
no image is uploaded in the admin panel). Keep the same filenames.

  spin-wheel/background.png       -> the spin-wheel screen background
  spin-wheel/gift-background.png  -> the gift/prize popup background
  cognitive-test/background.png   -> the cognitive test screen background

Admin uploads (per game) override these at runtime. Removing an uploaded image
in admin reverts to the file here.

Per-gift default images for the spin wheel live in spin-wheel/gifts/ — see the
README in that folder for the gift-N.png naming convention.
