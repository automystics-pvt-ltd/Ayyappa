-- ============================================================
--  Ayyappan Temple — Production data import
--  Safe to run on an existing database.
--  All inserts use ON CONFLICT DO UPDATE / DO NOTHING.
-- ============================================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ── Site settings (overwrite with latest dev values) ────────
INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES
  ('temple_name',        'அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்', 1, NOW()),
  ('temple_location',    'வடமதுரை, திண்டுக்கல்', 1, NOW()),
  ('temple_address',     'வடமதுரை, திண்டுக்கல் மாவட்டம், தமிழ்நாடு', 1, NOW()),
  ('temple_timings',     'காலை 6:00 - 12:00 | மாலை 4:00 - 8:00', 1, NOW()),
  ('hero_title',         'ஸ்வாமியே சரணம் ஐயப்பா', 1, NOW()),
  ('hero_subtitle',      'அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்', 1, NOW()),
  ('hero_location',      'வடமதுரை, திண்டுக்கல் மாவட்டம்', 1, NOW()),
  ('hero_tagline',       'திருப்பணி மற்றும் மகா கும்பாபிஷேக நிதி திரட்டும் இணையதளம்', 1, NOW()),
  ('hero_quote',         '"ஒரு செங்கல் நீங்கள்... ஒரு கோவில் நமக்கு..."', 1, NOW()),
  ('about_history',      'வடமதுரை பகுதியில் அமைந்துள்ள அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில், ஆயிரக்கணக்கான பக்தர்களின் ஆன்மீக வழிபாட்டு தலமாக திகழ்கிறது. இத்திருக்கோவிலில் தினசரி பூஜைகள், சிறப்பு வழிபாடுகள், மண்டல பூஜை, மகரஜோதி பூஜை மற்றும் ஐயப்ப பக்தர்களுக்கான ஆன்மீக நிகழ்ச்சிகள் சிறப்பாக நடைபெற்று வருகின்றன.', 1, NOW()),
  ('about_years',        'பல ஆண்டுகள்', 1, NOW()),
  ('about_daily_pujas',  '3 வேளை', 1, NOW()),
  ('about_devotees',     'ஆயிரக்கணக்கானோர்', 1, NOW()),
  ('guru_description',   'இறையருளும், குருவருளும் ஒன்றிணைந்து பக்தர்களுக்கு ஆன்மீக வழிகாட்டுதலாக திகழும் நமது மதிப்பிற்குரிய குருநாதர்கள் அவர்களுக்கு எங்களின் பணிவான வணக்கங்களைத் தெரிவித்துக் கொள்கிறோம். அவர்களின் ஆன்மீக வழிகாட்டுதல், இறைப்பணி மீதான அர்ப்பணிப்பு மற்றும் பக்தர்களை ஒன்றிணைக்கும் சேவை மனப்பான்மையால், வடமதுரை அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவிலின் வளர்ச்சிக்கும், திருப்பணி மற்றும் மகா கும்பாபிஷேகப் பணிகளுக்கும் பெரும் ஊக்கமாக இருந்து வருகிறது.', 1, NOW()),
  ('guru_quote',         '"குருவருள் இருந்தால் திருவருள் நிச்சயம்."', 1, NOW()),
  ('bank_name',          'Indian Overseas Bank', 1, NOW()),
  ('bank_account_name',  'அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில் நிர்வாக குழு', 1, NOW()),
  ('bank_account_number','246101000019314', 1, NOW()),
  ('bank_ifsc',          'IOBA0002461', 1, NOW()),
  ('bank_branch',        'Vadamadurai Branch (2461)', 1, NOW()),
  ('bank_account_type',  'Savings Bank (SB)', 1, NOW()),
  ('bank_help_phone',    '9345127734', 1, NOW()),
  ('bank_upi_id',        '', 1, NOW()),
  ('gpay_number',        '9345127734', 1, NOW()),
  ('donation_goal',      '1000000', 1, NOW()),
  ('qr_code_url',        '', 1, NOW()),
  ('renovation_progress', '[{"title":"கருவறை","value":100},{"title":"மண்டபம்","value":70},{"title":"ராஜகோபுரம்","value":40},{"title":"சுற்றுச்சுவர்","value":60},{"title":"மின்வசதி","value":35}]', 1, NOW()),
  ('renovation_works',   '["கருவறை திருப்பணி","ராஜகோபுரம் சீர் அமைத்தல்","முன்மண்டபம் புதுப்பித்தல்","சுற்றுச்சுவர் கட்டுமானம்","கோவில் தரை அமைத்தல்","மின்வசதி மேம்பாடு","குடிநீர் வசதி","அன்னதான மண்டபம்","பக்தர்கள் அமரும் இட வசதி"]', 1, NOW()),
  ('special_pujas',      '["மாத முதல் சனி","பௌர்ணமி பூஜை","அமாவாசை பூஜை","மண்டல பூஜை","மகரஜோதி பூஜை"]', 1, NOW()),
  ('faqs',               '[{"q":"நன்கொடை வருமான வரி விலக்கு பெறுமா?","a":"தேவையான அனுமதி இருந்தால் விவரங்கள் வழங்கப்படும்."},{"q":"ஆன்லைனில் நன்கொடை வழங்கலாமா?","a":"ஆம். UPI, Net Banking, Debit Card, Credit Card ஆகியவற்றின் மூலம் வழங்கலாம்."},{"q":"ரசீது கிடைக்குமா?","a":"ஆம். உடனடியாக மின்னஞ்சல் மற்றும் WhatsApp மூலம் அனுப்பப்படும்."}]', 1, NOW()),
  ('support_phone',      '', 1, NOW()),
  ('temple_phone',       '', 1, NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at;

-- ── Donations (real donors only — skip test/rejected entries) ─
INSERT INTO donations (
  id, receipt_token, donor_name, mobile, place,
  amount, transaction_id, screenshot_url, anonymous, message,
  status, rejection_reason, reviewed_by, reviewed_at, created_at
) VALUES
  (3, '1ddbff7a-04d9-4a94-9533-bb9515e58774',
   'அனுராதா கோபு', '9878799890', 'வடமதுரை',
   5000.00, '23456789', NULL, false, NULL,
   'approved', NULL, 1, '2026-08-02 02:38:02.396+00', '2026-07-29 16:03:54.43+00'),
  (4, '4a1af341-cbfa-4774-ae10-572aedf527c3',
   'அனுராதா கோபு குடும்பத்தினர்', '9898789999', 'வடமதுரை',
   5001.00, 'Transfer to குருசாமி Account', NULL, false, 'Transfer to குருசாமி Account',
   'approved', NULL, 1, '2026-07-29 16:50:29.325+00', '2026-07-29 16:49:28.325+00')
ON CONFLICT (id) DO NOTHING;

-- Keep sequences ahead of inserted IDs
SELECT setval('donations_id_seq', GREATEST(nextval('donations_id_seq'), 20));

