/*
# Seed Data — 40 Liverpool Home-Service Providers

Inserts 40 fictional but realistic service providers across Liverpool:
- 15 plumbers, 13 electricians, 12 cleaners.
- Coordinates scattered around central Liverpool (lat 53.37–53.45, lng -3.02 to -2.90).
- Diverse names, distinct descriptions with concrete specialities for semantic search.
- Prices £25–£95, ratings 3.6–5.0, varying emergency/availability flags.
- Language spread: mostly English; 5 with Ukrainian, 3 with Polish, 3 with Spanish.
- photo_url uses https://i.pravatar.cc/150?u={deterministic string} placeholders.
- Embeddings are left NULL — the embed-providers edge function populates them.
*/

INSERT INTO providers (name, category, description, photo_url, lat, lng, price_from, languages, rating, review_count, emergency, available)
VALUES

-- PLUMBERS (15)
('Mersey Flow Plumbing',         'plumber',      'Emergency leak repair, burst pipes, radiators and boiler pressure issues. Same-day callouts across south Liverpool.',
 'https://i.pravatar.cc/150?u=mersey-flow',       53.3850, -2.9650, 55, '{English}', 4.8, 143, true,  true),

('Aintree Pipe Specialists',     'plumber',      'Blocked drains, CCTV drain surveys and unblocking specialists serving north Liverpool and Bootle.',
 'https://i.pravatar.cc/150?u=aintree-pipe',      53.4410, -2.9600, 45, '{English}', 4.5,  87, false, true),

('Kowalski Plumbing & Heating',  'plumber',      'Boiler installations, system flushes and full central heating installations. Accredited Gas Safe engineer.',
 'https://i.pravatar.cc/150?u=kowalski-plumbing', 53.4020, -2.9710, 65, '{English,Polish}', 4.9, 210, true,  true),

('Delta Leak Solutions',         'plumber',      'Washing machine, dishwasher and appliance installation plus kitchen plumbing for new-fit kitchens.',
 'https://i.pravatar.cc/150?u=delta-leak',        53.3950, -2.9540, 40, '{English}', 4.2,  62, false, true),

('Toxteth Tap & Drain',          'plumber',      'Bathroom renovations, tap replacement, toilet installation and shower tray fitting across Toxteth and Dingle.',
 'https://i.pravatar.cc/150?u=toxteth-tap',       53.3820, -2.9760, 35, '{English}', 4.0,  34, false, true),

('Anfield Plumbing Co',          'plumber',      'Fast response to burst pipes and emergency water shutoffs. Serving Anfield, Everton and Kirkdale 24/7.',
 'https://i.pravatar.cc/150?u=anfield-plumbing',  53.4380, -2.9600, 60, '{English}', 4.7, 119, true,  true),

('Wavertree Heating Solutions',  'plumber',      'Central heating power flushes, radiator bleeding, TRV replacement and annual boiler servicing.',
 'https://i.pravatar.cc/150?u=wavertree-heating', 53.3990, -2.9310, 50, '{English}', 4.3,  55, false, true),

('Shevchenko Home Plumbing',     'plumber',      'Hot-water cylinder upgrades, immersion heaters and unvented system repairs. Fluent Ukrainian and English speaker.',
 'https://i.pravatar.cc/150?u=shevchenko-plumb',  53.4100, -2.9520, 58, '{English,Ukrainian}', 4.6,  98, true,  true),

('Aigburth Waterworks',          'plumber',      'New bathroom installations, wet room conversions and luxury shower enclosures in south Liverpool.',
 'https://i.pravatar.cc/150?u=aigburth-water',    53.3710, -2.9550, 70, '{English}', 4.9,  76, false, true),

('Bold Street Plumbing',         'plumber',      'City-centre specialist for flats and apartments — overflow pipes, isolation valves and leaking radiators.',
 'https://i.pravatar.cc/150?u=bold-street-plumb', 53.3990, -2.9770, 45, '{English}', 4.4,  49, false, true),

('Liverpool Leak Busters',       'plumber',      'Trace and repair hidden leaks using thermal imaging. Specialists in insurance-claim leak detection.',
 'https://i.pravatar.cc/150?u=leak-busters',      53.4070, -2.9880, 75, '{English}', 4.7,  88, true,  true),

('Everton Park Plumbing',        'plumber',      'Pipe relining, sewer repair and outside tap installation for residential properties in north Liverpool.',
 'https://i.pravatar.cc/150?u=everton-park-plumb',53.4280, -2.9700, 50, '{English}', 3.9,  22, false, true),

('Garcia Plumbing Services',     'plumber',      'Kitchen and bathroom plumbing fitting service. Habla español — serving the Spanish community across Liverpool.',
 'https://i.pravatar.cc/150?u=garcia-plumbing',   53.3880, -2.9810, 42, '{English,Spanish}', 4.5,  67, false, true),

('Merseyside Boiler Pros',       'plumber',      'Boiler breakdowns, no-hot-water callouts and pressure loss diagnosis. Worcester Bosch and Ideal accredited.',
 'https://i.pravatar.cc/150?u=merseyside-boiler', 53.4160, -2.9450, 80, '{English}', 4.8, 154, true,  true),

('Kovalenko Pipe & Heat',        'plumber',      'Underfloor heating installation and repair, thermal paste application and manifold servicing. Ukrainian and English.',
 'https://i.pravatar.cc/150?u=kovalenko-pipe',    53.3930, -2.9630, 68, '{English,Ukrainian}', 4.6,  41, false, true),

-- ELECTRICIANS (13)
('Bright Spark Liverpool',       'electrician',  'Full rewires, consumer unit upgrades and EICR landlord safety certificates. NICEIC approved contractor.',
 'https://i.pravatar.cc/150?u=bright-spark',      53.4050, -2.9800, 60, '{English}', 4.9, 188, false, true),

('Mersey Electrics',             'electrician',  'EV charger installation for home and business, load calculations and DNO applications. Tesla-certified installer.',
 'https://i.pravatar.cc/150?u=mersey-electrics',  53.3980, -2.9550, 75, '{English}', 4.7, 102, false, true),

('Kowalski Electrical',          'electrician',  'Commercial and domestic rewiring, fuse board replacement and fault finding. Polish and English spoken.',
 'https://i.pravatar.cc/150?u=kowalski-elec',     53.4090, -2.9640, 55, '{English,Polish}', 4.8, 134, true,  true),

('Anfield Power Services',       'electrician',  'Emergency power failures, tripping breakers and complete loss of supply. Available for same-day callouts.',
 'https://i.pravatar.cc/150?u=anfield-power',     53.4400, -2.9580, 65, '{English}', 4.5,  73, true,  true),

('Toxteth Electrical Co',        'electrician',  'Outdoor lighting, security camera wiring and garden socket installation for homes across south Liverpool.',
 'https://i.pravatar.cc/150?u=toxteth-elec',      53.3840, -2.9730, 45, '{English}', 4.1,  28, false, true),

('Wavertree Wiring Solutions',   'electrician',  'Smart home wiring, Hive and Nest thermostat installation, multi-room audio cabling.',
 'https://i.pravatar.cc/150?u=wavertree-wiring',  53.4010, -2.9350, 55, '{English}', 4.3,  51, false, true),

('Shevchenko Electric',          'electrician',  'Rewiring older properties, loft conversions and extension electrics. Ukrainian-English bilingual service.',
 'https://i.pravatar.cc/150?u=shevchenko-elec',   53.4130, -2.9500, 58, '{English,Ukrainian}', 4.6,  89, true,  true),

('Aigburth Electrical Services', 'electrician',  'New build wiring, kitchen and bathroom circuits, underfloor heating controls for south-Liverpool properties.',
 'https://i.pravatar.cc/150?u=aigburth-elec',     53.3720, -2.9580, 50, '{English}', 4.4,  47, false, false),

('Bootle Electrical Ltd',        'electrician',  'Industrial and commercial switchgear, 3-phase supply and PAT testing for Bootle-area businesses.',
 'https://i.pravatar.cc/150?u=bootle-elec',       53.4450, -3.0010, 70, '{English}', 4.2,  33, false, true),

('City Centre Sparks',           'electrician',  'Apartment and flat specialist — socket additions, lighting circuits and landlord EICR reports in the city centre.',
 'https://i.pravatar.cc/150?u=city-sparks',       53.4030, -2.9840, 48, '{English}', 4.6,  115, false, true),

('Rodriguez Electrical',         'electrician',  'Domestic installations, consumer unit upgrades and fault diagnosis. Hablamos español — Spanish community specialist.',
 'https://i.pravatar.cc/150?u=rodriguez-elec',    53.3900, -2.9780, 52, '{English,Spanish}', 4.5,  62, false, true),

('Mersey Safety Electrical',     'electrician',  'Fire alarm installation, emergency lighting testing and smoke detector circuits for rental properties.',
 'https://i.pravatar.cc/150?u=mersey-safety-elec',53.4200, -2.9600, 60, '{English}', 4.7,  79, true,  true),

('Everton Heights Electrical',   'electrician',  'Rewiring, shower circuit installation and electric hob connections for period terraces in Everton and Kirkdale.',
 'https://i.pravatar.cc/150?u=everton-heights-e', 53.4310, -2.9660, 55, '{English}', 3.8,   9, false, true),

-- CLEANERS (12)
('Mersey Sparkle Cleaning',      'cleaner',      'End-of-tenancy deep cleans including oven, fridge and carpet steam cleaning. Guaranteed deposit-back service.',
 'https://i.pravatar.cc/150?u=mersey-sparkle',    53.4060, -2.9820, 35, '{English}', 4.8, 167, false, true),

('Toxteth Tidy Team',            'cleaner',      'Regular weekly and fortnightly domestic cleaning for houses and flats across Toxteth, Dingle and Wavertree.',
 'https://i.pravatar.cc/150?u=toxteth-tidy',      53.3870, -2.9690, 28, '{English}', 4.5,  93, false, true),

('Kovalchuk Home Services',      'cleaner',      'Deep cleans, spring cleans and one-off heavy-duty cleaning. Ukrainian and English speaking team.',
 'https://i.pravatar.cc/150?u=kovalchuk-clean',   53.4120, -2.9550, 30, '{English,Ukrainian}', 4.7, 121, false, true),

('Aigburth Oven Specialists',    'cleaner',      'Professional oven, hob and extractor fan cleaning using bio-degradable products. Specialist oven cleaning only.',
 'https://i.pravatar.cc/150?u=aigburth-oven',     53.3730, -2.9560, 45, '{English}', 4.9,  58, false, true),

('Bootle Blitz Cleaning',        'cleaner',      'Commercial office cleaning, post-construction site cleans and builders-clean services for Bootle businesses.',
 'https://i.pravatar.cc/150?u=bootle-blitz',      53.4460, -2.9990, 40, '{English}', 4.2,  37, false, true),

('Anfield Fresh Cleans',         'cleaner',      'Student accommodation and HMO cleaning, end-of-term cleans and move-out deep cleans with reference letters.',
 'https://i.pravatar.cc/150?u=anfield-fresh',     53.4360, -2.9620, 32, '{English}', 4.4,  74, false, true),

('City Shine Cleaning',          'cleaner',      'City-centre apartment cleaning, Airbnb turnaround cleans and same-day bookings for short-term lets.',
 'https://i.pravatar.cc/150?u=city-shine',        53.4000, -2.9860, 38, '{English}', 4.6,  108, true,  true),

('Gonzalez Limpiezas',           'cleaner',      'Domestic and commercial cleaning with a Spanish-speaking team. Especialistas en limpieza profunda en Liverpool.',
 'https://i.pravatar.cc/150?u=gonzalez-clean',    53.3920, -2.9800, 30, '{English,Spanish}', 4.3,  45, false, true),

('Wavertree Eco Clean',          'cleaner',      'Eco-friendly cleaning using only non-toxic, allergy-safe products. Ideal for families with young children and pets.',
 'https://i.pravatar.cc/150?u=wavertree-eco',     53.4000, -2.9300, 32, '{English}', 4.7,  82, false, true),

('Tkachenko Cleaning Services',  'cleaner',      'After-builders clean, renovation dust removal and new-home cleaning. Ukrainian-English team based in Wavertree.',
 'https://i.pravatar.cc/150?u=tkachenko-clean',   53.4020, -2.9400, 50, '{English,Ukrainian}', 4.5,  53, false, true),

('Everton Deep Clean Co',        'cleaner',      'Mould treatment, damp cleaning and bathroom re-grouting clean-up for terraces and period homes in north Liverpool.',
 'https://i.pravatar.cc/150?u=everton-deep',      53.4290, -2.9680, 55, '{English}', 4.0,  19, false, true),

('Renew Restoration Cleaning',   'cleaner',      'Carpet cleaning, upholstery steam cleaning and mattress sanitisation using professional-grade extraction equipment.',
 'https://i.pravatar.cc/150?u=renew-restore',     53.3960, -2.9620, 60, '{English,Polish}', 4.6,  66, false, true);
