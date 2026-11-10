/**
 * HAAS PRESENTS – DISCOVER KELAA
 * Main Application Controller (js/main.js)
 * Powers 11 exploration tabs, interactive island map, timeline filter, gallery lightbox,
 * favourite facts drawer, global site search, random fact generator, theme switcher,
 * and Web Audio API ambient tropical ocean & marimba soundtrack.
 */

(function() {
  const APP_STATE = {
    activeTab: 'home',
    theme: 'dark',
    audioPlaying: false,
    audioCtx: null,
    audioTimer: null,
    noiseNode: null,
    favourites: [],
    galleryCategory: 'all',
    lightboxIndex: 0,
    filteredGallery: [],
    activeMapPin: 'mosque',
    timelineFilter: 'all'
  };

  // Load saved favourites & theme safely
  try {
    const savedFavs = localStorage.getItem('haas_kelaa_favs');
    if (savedFavs) {
      APP_STATE.favourites = JSON.parse(savedFavs);
    }
    const savedTheme = localStorage.getItem('haas_kelaa_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      APP_STATE.theme = savedTheme;
    }
  } catch (err) {
    // Ignore storage errors in sandboxed iframes
  }

  // 8 Verified Interactive Map Landmarks on Kelaa Island
  const MAP_LANDMARKS = {
    mosque: {
      title: 'Kelaa Old Friday Mosque (Aasaaree Hukuru Miskiy – 1701 AD)',
      category: 'Heritage & Religion',
      coords: 'Central-West Settlement • Built 1111 AH (1692–1701 AD)',
      summary: 'Constructed during the reign of Sultan Mohamed Ibn Haji Ali Thukkalaa (Dhevvadhoo Rasgefaanu), this active coral stone mosque features interlocking hirigaa masonry without mortar, timber sliding doors, lacquered calligraphy panels, two ancient coral wells, a ruined minaret base, and a historic cemetery with Arabic-engraved tombstones.',
      fact: 'Capacity: 176 worshippers (600 sq ft). Nominated on the tentative list for UNESCO Coral Stone Mosques of the Maldives.',
      sourceUrl: 'https://coralstonemosques.com/kelaa-old-friday-mosque/',
      sourceLabel: 'Coral Stone Mosques of Maldives'
    },
    kandoofaa: {
      title: 'H.A. Kelaa Kandoofaa & Kelavaki Mangrove Park',
      category: 'Nature & Protected Area',
      coords: 'North-Eastern & Inland Wetland • 112 Hectares Protected Area',
      summary: 'Designated a Protected Area on 16 June 2019 (WDPA ID 555697565), Kelaa Kandoofaa encompasses 22–26 hectares of lush inland mangrove forest and surrounding marine habitat. In 2020, four critically endangered Bruguiera hainesii trees—named "Kelavaki" in honour of Kelaa—were discovered here alongside a 50+ year-old Kulhlhavah tree.',
      fact: 'During the 1940s wartime food shortages (Bodu Thadhu), abundant Kan\'doo (Bruguiera cylindrica) propagules from this wetland sustained Kelaa and neighbouring islands.',
      sourceUrl: 'https://protectedareas.environment.gov.mv/en/protected-areas/h-a-kelaa-kandoofaa',
      sourceLabel: 'Ministry of Climate Change, Environment & Energy'
    },
    lilyhouse: {
      title: 'The Historic Lily House (Maaloodhu Ge)',
      category: 'Heritage & Education',
      coords: 'Central Settlement • Late 1940s – Early 1950s',
      summary: 'An 80+ year-old architectural gem spanning 1,700 sq ft, built with traditional lime mortar (uva) during the tenure of Chief (Katheeb) Kasim. Featuring twin main entrances and symmetrical columns, it originally hosted island-wide Maulood recitations before serving as Madhrasathul Sheikh Ibrahim and Lily Pre-School.',
      fact: 'Restored as a protected cultural monument with technical collaboration from the National Centre for Cultural Heritage and Kyoto University.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Lily_House',
      sourceLabel: 'Wikipedia – Kelaa Landmarks'
    },
    thundi: {
      title: 'Kelaa Thun\'di & WWII British RAF Armoury (Badige)',
      category: 'History & Leisure',
      coords: 'Southern Spit (Thun\'di) • 1934–1945 RAF Outpost',
      summary: 'Located approx. 3 km south of the main village, Thun\'di hosted the British Royal Air Force (RAF) staging post during World War II. The intact exterior walls of the British Armoury (locally called Badige) still stand near the scenic southern beach where families gather for Eid picnics.',
      fact: 'Constructed between 1941 and 1943 with vital local labour to refuel Allied warplanes and shipping across the Indian Ocean.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#British_Armory',
      sourceLabel: 'Wikipedia – British Armory'
    },
    gaamuli: {
      title: 'Gaamuli Lagoon & Traditional Stilt Fishing (Kani Masverikan)',
      category: 'Culture & Marine Biodiversity',
      coords: 'Southern Tip Lagoon • Shallow Reef Flats',
      summary: 'A biodiversity hotspot teeming with juvenile reef sharks, stingrays, Samoan silversides (thaavalha), and pipefish. During the rough southwest monsoon (Hulhangu moosun), Kelaa fishermen plant stilts made of corkwood (Dhun\'buri) or sea randa (Uni) in Gaamuli to fish for uniya and kalhu oh.',
      fact: 'Kelaa is one of the very few places in the Maldives where the ancient art of stilt fishing (Kani Masverikan) is preserved.',
      sourceUrl: 'https://ideasmv.com/tag/kelaa/',
      sourceLabel: 'IDEAS Kelaa – Wonders of Gaa Muli'
    },
    athiri: {
      title: 'Western White Sand Beach (Athiri) & 2,423 ha Turquoise Lagoon',
      category: 'Beaches & Watersports',
      coords: 'Western Coastline • 2.5 km Powdery Sand Stretch',
      summary: 'Kelaa\'s western face (Athiri) boasts a 2.5 km ribbon of soft white coral sand bordering a 2,423-hectare turquoise lagoon—12 times larger than the island itself. At night, waves along the beach frequently glow electric-blue with bioluminescent plankton (Redhan).',
      fact: 'The lagoon is enclosed by a 7.28 km house reef with shallow flats (5–6 m) and a deep inner vilu basin (10–20 m).',
      sourceUrl: 'https://summerhomekelaa.com/thingstodo',
      sourceLabel: 'Summer Home Kelaa – Things to Do'
    },
    qufran: {
      title: 'Masjid-al Qufran & Rare Golden Shower Tree (An\'malthaas)',
      category: 'Botany & Civic Centre',
      coords: 'Civic Quarter • Opposite Kelaa Council Secretariat',
      summary: 'Within the compound of Masjid-al Qufran (capacity 184 worshippers), directly in front of the Secretariat of the Kelaa Council Office, stands Kelaa\'s famous Golden Shower Tree (Cassia fistula, locally called An\'malthaas)—a rare botanical sight in the Maldives.',
      fact: 'Nearby stands Masjid-al Ansar (5,380 sq ft, capacity 670), the largest of Kelaa\'s 7 mosques.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Golden_shower_tree',
      sourceLabel: 'Wikipedia – Ecosystem & Biodiversity'
    },
    school: {
      title: 'Sheikh Ibrahim School (SIS) & Historic Dandoora Tree',
      category: 'Education & Scholars',
      coords: 'Academic District • Founded 21 January 1945',
      summary: 'Named in honour of Kelaa-born Al-Azhar scholar Al-Sheikh Ibrahim Rushdhee (1897–1961), formal schooling began on 21 January 1945 (6 Safar 1364 AH). Early students assembled beneath a shade-giving Kin\'bi Gas (Fish Poison Tree) where a suspended metal sheet called the Dandoora was struck with a gong.',
      fact: 'Renamed Sheikh Ibrahim School (SIS) in 2018, preparing students through Grade 10 Cambridge O-Level examinations.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Education',
      sourceLabel: 'Wikipedia – Education in Kelaa'
    }
  };

  // 15 Verified "Did You Know?" Hidden Treasures
  const HIDDEN_TREASURES = [
    {
      id: 'fact_1',
      category: 'Etymology',
      title: 'The Island of Fragrant Sandalwood',
      shortText: 'In the Dhivehi language, "Kelaa" translates directly to the sandalwood tree.',
      detail: 'Oral tradition recounts that ancient mariners were guided to the island by the sweet fragrance of a sandalwood tree carried on the breeze. The spot where foreigners later uprooted the tree is still known locally as "Kelaa gas negi adi gan\'du".',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Origin_of_Name',
      sourceName: 'Wikipedia – Origin of Name'
    },
    {
      id: 'fact_2',
      category: 'Geography',
      title: 'Closest Maldivian Point to India (440 km)',
      shortText: 'Situated on the North-North-East tip of the Maldives, Kelaa lies roughly 440 km from Trivandrum, India.',
      detail: 'Because of its strategic location as the northern gateway to the archipelago, linguists also connect its name to the Hindi/Urdu word "kholaa" or "kholar", meaning an open space or entrance.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Origin_of_Name',
      sourceName: 'Wikipedia – Origin of Name'
    },
    {
      id: 'fact_3',
      category: 'Biodiversity',
      title: 'Home of the Critically Endangered "Kelavaki" Mangrove',
      shortText: 'In 2020, four Bruguiera hainesii trees—fewer than ~200 left globally—were discovered in Kelaa.',
      detail: 'Identified by the IUCN Mangrove Specialist Group and Dr. Jean Yong in Kelaa\'s wetland, this critically endangered species was officially named "Kelavaki" by the Dhivehi Bahuge Academy in honour of Kelaa.',
      sourceUrl: 'https://timesofaddu.com/2020/10/24/name-given-for-the-newly-found-mangrove-species/',
      sourceName: 'Times of Addu (Oct 2020)'
    },
    {
      id: 'fact_4',
      category: 'Culture',
      title: 'Exclusive Guardian of the Maliku Dhandi Stick Dance',
      shortText: 'Kelaa is the only island in the Maldives where the traditional Maliku Dhandi stick dance is performed.',
      detail: 'Performed in two styles—Mulhifoa Dhandi and Maali Dhandi—dancers strike sticks made of Kuredhi (ironwood) and Kudhi Lunboa (lime berry) decorated with cloth flowers (Maa) and metal caps (Fulus) to the beat of the Thaara drum.',
      sourceUrl: 'https://ideaskelaa.wordpress.com/2017/03/15/featured-content/',
      sourceName: 'IDEAS – Maliku Dhandi'
    },
    {
      id: 'fact_5',
      category: 'Lagoon',
      title: 'A Turquoise Lagoon 12 Times Larger Than the Island',
      shortText: 'While Kelaa\'s land area is 203.37 hectares, its crystal-clear lagoon spans a massive 2,423 hectares.',
      detail: 'Enclosed by a 7.28 km house reef, the lagoon features calm 5–6 m sandy flats ideal for watersports and a deeper 10–20 m inner basin (vilu).',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Geography',
      sourceName: 'Wikipedia – Geography'
    },
    {
      id: 'fact_6',
      category: 'Architecture',
      title: 'A 1701 Coral Stone Mosque Built Without Mortar',
      shortText: 'Kelaa\'s Old Friday Mosque was built in Hijri Year 1111 (1692–1701 AD) from interlocking coral blocks.',
      detail: 'Commissioned during the reign of Sultan Mohamed of Dhevvadhoo, the mosque still serves worshippers today and preserves lacquered calligraphy panels, timber sliding doors, two coral wells, and ancient carved gravestones.',
      sourceUrl: 'https://coralstonemosques.com/kelaa-old-friday-mosque/',
      sourceName: 'Coral Stone Mosques of Maldives'
    },
    {
      id: 'fact_7',
      category: 'Resilience',
      title: 'How Mangrove Fruit Saved Kelaa During WWII Shortages',
      shortText: 'During the 1940s "Bodu Thadhu" famine, Kelaa\'s Kan\'doo mangroves fed both Kelaa and nearby islands.',
      detail: 'When wartime shipping disruptions rationed rice to 0.5 Laahi (~120 ml) per meal, Kelaa\'s 26-hectare wetland yielded abundant Small-Leaved Orange Mangrove (Bruguiera cylindrica) propagules, ensuring food security.',
      sourceUrl: 'https://protectedareas.environment.gov.mv/en/protected-areas/h-a-kelaa-kandoofaa',
      sourceName: 'Maldives Protected Areas'
    },
    {
      id: 'fact_8',
      category: 'Tradition',
      title: 'Ancient Stilt Fishing (Kani Masverikan) at Gaamuli',
      shortText: 'Kelaa fishermen balance on wooden stilts in the southern lagoon during rough monsoon seas.',
      detail: 'Using stilts crafted from corkwood (Dhun\'buri) or sea randa (Uni) planted in Gaamuli lagoon, fishermen catch uniya and kalhu oh for hours when open-ocean tuna fishing is too turbulent.',
      sourceUrl: 'https://ideasmv.com/tag/kelaa/',
      sourceName: 'IDEAS Kelaa'
    },
    {
      id: 'fact_9',
      category: 'Scholarship',
      title: 'Birthplace of the First Maldivian Graduate of Al-Azhar',
      shortText: 'Al-Sheikh Ibrahim Rushdhee (1897–1961) studied in Cairo for 13+ years and wrote "Sullamal Areeb".',
      detail: 'Returning to the Maldives in 1927, he became a founding teacher of Madhrasathul Saniyya (Aminiya School), served as Attorney General and MP, and published his landmark Dhivehi grammar book on 5 November 1936.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Al-Sheikh_Ibrahim_Rushdhee',
      sourceName: 'Wikipedia – Notable Figures'
    },
    {
      id: 'fact_10',
      category: 'Education',
      title: 'The "Dandoora" Metal Gong Beneath the Kin\'bi Tree',
      shortText: 'Before electric bells, a suspended metal sheet under a Fish Poison Tree called students to class.',
      detail: 'When formal education began in Kelaa on 21 January 1945, students gathered under the shade of a Kin\'bi Gas (Barringtonia asiatica) whenever the metal Dandoora was struck with a gong.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Fish_Poison_Tree',
      sourceName: 'Wikipedia – Fish Poison Tree'
    },
    {
      id: 'fact_11',
      category: 'Surfing',
      title: 'Surfing on Breadfruit-Wood Planks Called "Malhu"',
      shortText: 'Generations of Kelaa youth rode eastern reef waves on hand-shaped wooden breadfruit boards.',
      detail: 'Long before imported fiberglass surfboards reached the northern atolls, Kelaa youth carved buoyant wooden pieces from breadfruit trees—locally called Malhu—to surf the eastern Futtaru breaks.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Surfing',
      sourceName: 'Wikipedia – Surfing in Kelaa'
    },
    {
      id: 'fact_12',
      category: 'Heritage',
      title: 'The Mathematical Symmetry of Lily House',
      shortText: 'Built with lime mortar in the late 1940s/early 1950s, Lily House spans 1,700 sq ft with twin entrances.',
      detail: 'Originally constructed as a Maaloodhu Ge under Katheeb Kasim for community devotional recitations, it later housed Kelaa\'s school and kindergarten before being restored as a heritage monument.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Lily_House',
      sourceName: 'Wikipedia – Lily House'
    },
    {
      id: 'fact_13',
      category: 'Community',
      title: '2004 Tsunami Sanctuary for Neighbouring Filladhoo',
      shortText: 'Protected by its outer reef and lagoon, Kelaa immediately sheltered displaced families from Filladhoo.',
      detail: 'During the December 2004 Indian Ocean Tsunami, Kelaa\'s reef barrier and settlement layout minimized inundation, allowing the community to open their homes to neighbours from hard-hit Filladhoo.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kelaa_(Haa_Alif_Atoll)#Tsunami:_2004',
      sourceName: 'Wikipedia – Tsunami 2004'
    },
    {
      id: 'fact_14',
      category: 'Cuisine',
      title: 'Bimbi Bondi & Eid Bon\'di Sweet Traditions',
      shortText: 'Kelaa preserves ancient finger millet (bimbi) sweets wrapped and shared during festive occasions.',
      detail: 'Bimbi Bondi combines finger millet (black malt) with coconut sugar, while Kelaa Eid Bon\'di blends tender young coconut and sugar—signature flavours of Kelaa hospitality.',
      sourceUrl: 'https://emzaz.com/holiday-home-kelaa/',
      sourceName: 'Holiday Home Kelaa'
    },
    {
      id: 'fact_15',
      category: 'Nature',
      title: 'A 50+ Year-Old Mangrove Apple Giant & Glowing Night Seas',
      shortText: 'Kelaa\'s wetland shelters a half-century-old Kulhlhavah tree, while its beach glows electric blue at night.',
      detail: 'By day, visitors can spot Grey Herons (Maakanaa) around the ancient Sonneratia caseolaris tree; by night, bioluminescent plankton illuminate the 2.5 km western beach.',
      sourceUrl: 'https://protectedareas.environment.gov.mv/en/protected-areas/h-a-kelaa-kandoofaa',
      sourceName: 'Maldives Protected Areas'
    }
  ];

  // Gallery Items (Authentic Kelaa aerial/map diagrams + clearly labelled illustrative graphics)
  const GALLERY_ITEMS = [
    {
      id: 'gal_1',
      category: 'aerial',
      catLabel: 'Aerial Views',
      title: 'Crescent Lagoon & Island Horizon (Illustrative Aerial Panorama)',
      src: 'assets/images/kelaa_aerial_hero.jpg',
      caption: 'Illustrative aerial visualization inspired by Kelaa Island\'s 203.37-hectare crescent landmass, inland Kandoofaa wetland lake, 2.5 km western sandy beach (Athiri), and 2,423-hectare turquoise lagoon.',
      credit: 'HAAS Digital Museum Illustrative Visualization • Grounded in OneMap Maldives & Wikipedia Geography Data'
    },
    {
      id: 'gal_2',
      category: 'aerial',
      catLabel: 'Aerial Views',
      title: 'Topographic & Lagoon Zones Diagram of HA. Kelaa',
      src: 'assets/images/kelaa_map_illustration.svg',
      caption: 'Cartographic diagram illustrating Kelaa\'s western sandy shore (Athiri), eastern coral shore (Futtaru), 112-hectare protected Kandoofaa wetland, and southern Thun\'di & Gaamuli tip.',
      credit: 'HAAS Cartographic Diagram • Data: Maldives Protected Areas & OneMap Maldives'
    },
    {
      id: 'gal_3',
      category: 'beaches',
      catLabel: 'Beaches & Lagoons',
      title: 'Bioluminescent Plankton (Redhan) on Kelaa\'s Western Shore (Illustrative Graphic)',
      src: 'assets/images/bioluminescent_beach.jpg',
      caption: 'Illustrative nighttime depiction of glowing blue bioluminescent plankton washing ashore along Kelaa\'s 2.5 km western beach under the northern Maldivian night sky.',
      credit: 'HAAS Digital Museum Illustrative Graphic • Documented by Summer Home Kelaa & Local Guides'
    },
    {
      id: 'gal_4',
      category: 'history',
      catLabel: 'Historical Places',
      title: 'Kelaa Old Friday Mosque – Built 1692–1701 AD (Architectural Illustration)',
      src: 'assets/images/old_friday_mosque.jpg',
      caption: 'Architectural illustration of Aasaaree Hukuru Miskiy (1111 AH / 1701 AD), showcasing interlocking coral stone (hirigaa) plinths, stepped entrance (dhaala), timber sliding doors, tiered roof, and historic coral well.',
      credit: 'HAAS Architectural Illustration • Grounded in Coral Stone Mosques of Maldives (M. Mauroof Jameel)'
    },
    {
      id: 'gal_5',
      category: 'history',
      catLabel: 'Historical Places',
      title: 'The Historic Lily House – Maaloodhu Ge & Early School (Heritage Illustration)',
      src: 'assets/images/lily_house_heritage.jpg',
      caption: 'Architectural illustration of Kelaa\'s 80+ year-old Lily House (1,700 sq ft lime-mortar structure with twin entrances and symmetrical columns) and the blooming Golden Shower Tree (An\'malthaas).',
      credit: 'HAAS Heritage Illustration • Grounded in Wikipedia & National Centre for Cultural Heritage Records'
    },
    {
      id: 'gal_6',
      category: 'culture',
      catLabel: 'Culture & Traditions',
      title: 'Maliku Dhandi Sticks & Thaara Hand Drum (Cultural Illustration)',
      src: 'assets/images/maliku_dhandi_culture.jpg',
      caption: 'Illustrative close-up of Kelaa\'s exclusive Maliku Dhandi performance instruments: Kuredhi (ironwood) sticks adorned with colourful cloth tassels (Maa) and metal caps (Fulus) beside a traditional Thaara drum.',
      credit: 'HAAS Cultural Illustration • Grounded in IDEAS Kelaa & Kelaa Dhandi Group Documentation'
    },
    {
      id: 'gal_7',
      category: 'people',
      catLabel: 'People & Community',
      title: 'Kani Masverikan – Stilt Fishermen of Gaamuli Lagoon (Cultural Illustration)',
      src: 'assets/images/stilt_fishing_gaamuli.jpg',
      caption: 'Illustrative depiction of Kelaa\'s traditional stilt fishing (Kani Masverikan) in the shallow waters of Gaamuli using corkwood (Dhun\'buri) and sea randa (Uni) stilts during the southwest monsoon.',
      credit: 'HAAS Documentary Illustration • Grounded in IDEAS Kelaa & Wikipedia Ethnographic Records'
    },
    {
      id: 'gal_8',
      category: 'food',
      catLabel: 'Local Food',
      title: 'Bimbi Bondi, Eid Bon\'di & Traditional Island Feast (Culinary Illustration)',
      src: 'assets/images/bimbi_bondi_cuisine.jpg',
      caption: 'Illustrative culinary showcase of Kelaa\'s signature Bimbi Bondi (finger millet & coconut sweet rolls wrapped in banana leaves), fresh island-grown papaya and watermelon, Mashuni, and young coconut.',
      credit: 'HAAS Culinary Illustration • Grounded in Holiday Home Kelaa & Kelaa Island Profile'
    },
    {
      id: 'gal_9',
      category: 'nature',
      catLabel: 'Nature & Wildlife',
      title: 'H.A. Kelaa Kandoofaa Mangrove Sanctuary & Herons (Ecological Illustration)',
      src: 'assets/images/kandoofaa_mangroves.jpg',
      caption: 'Illustrative ecological view of Kelaa\'s protected mangrove wetland (WDPA ID 555697565), home to Kan\'doo (Bruguiera cylindrica), critically endangered Kelavaki (Bruguiera hainesii), Grey Herons (Maakanaa), and Cattle Egrets (Iruvaahudhu).',
      credit: 'HAAS Ecological Illustration • Grounded in Ministry of Climate Change, Environment & Energy Data'
    },
    {
      id: 'gal_10',
      category: 'lifestyle',
      catLabel: 'Everyday Island Life',
      title: 'Sunset over Kelaa\'s 2,423-Hectare Lagoon & Guesthouse Coastline (Illustrative View)',
      src: 'assets/images/kelaa_aerial_hero.jpg',
      caption: 'Illustrative view of tranquil island life along Kelaa\'s western lagoon, where visitors enjoy bicycle rides, dhoani sailing, catamaran excursions, and warm community hospitality.',
      credit: 'HAAS Lifestyle Visualization • Grounded in Summer Home Kelaa & Kelaa Council Tourism Guide'
    }
  ];

  // Cultural Spotlight Items
  const CULTURE_SPOTLIGHTS = {
    mulhifoa: {
      title: 'Mulhifoa Dhandi & Maali Dhandi (Two Signature Styles)',
      badge: 'Exclusive Performing Art',
      body: 'Maliku Dhandi is performed in two distinct choreographic styles: Mulhifoa Dhandi and Maali Dhandi. Performers move in synchronized lines and circles, striking handcrafted wooden sticks in intricate polyrhythms that echo across the island during Eid and national festivities.',
      specs: ['Origin: Believed to have been introduced by visitors from Maliku (Minicoy), now preserved solely in Kelaa', 'Performers: Intergenerational groups led by elders and the Kelaa Dhandi Group', 'Occasions: Eid-ul-Fitr, Eid-ul-Adha, National Day, and welcoming ceremonies']
    },
    sticks: {
      title: 'Kuredhi & Kudhi Lunboa Sticks with Maa & Fulus',
      badge: 'Traditional Craftsmanship',
      body: 'Every pair of Maliku Dhandi sticks is an object of island artistry. Master craftsmen select dense Ironwood (Kuredhi) or Lime Berry wood (Kudhi Lunboa / Triphasia trifolia) and adorn them with vibrant floral cloth tassels called "Maa" and metallic end-caps called "Fulus" that ring crisply on impact.',
      specs: ['Primary Woods: Kuredhi (Ironwood) & Kudhi Lunboa (Lime berry)', 'Ornamentation: Woven floral cloth tassels (Maa)', 'Acoustic Caps: Resonant metal end-caps (Fulus)']
    },
    thaara: {
      title: 'The Thaara Drum & Rhythmic Chants',
      badge: 'Percussion & Vocal Heritage',
      body: 'Providing the heartbeat of Maliku Dhandi is the Thaara (ތާރަ), a traditional frame/hand drum crafted with taut goat skin or stingray skin. As the percussionists build tempo, dancers chant traditional poetic verses celebrating unity, seafaring, and island pride.',
      specs: ['Drumhead Material: Treated goat skin or stingray skin', 'Accompaniment: Call-and-response poetic chants', 'Preservation: Actively taught to youth in Kelaa and Malé']
    },
    malhu: {
      title: 'Malhu Breadfruit-Wood Surfing & Eid Water Festivities',
      badge: 'Coastal & Festive Customs',
      body: 'Beyond dance, Kelaa\'s youth historically rode the eastern Futtaru surf breaks on hand-carved breadfruit-wood planks known as "Malhu". During Eid, the entire island joins in joyful water-splashing games (Fen Kulhun), house-to-house morning feasts, and Day-4 family picnics at Kelaa Thun\'di.',
      specs: ['Traditional Surfboard: Malhu (carved breadfruit timber)', 'Eid Custom: Island-wide water splashing & open-house breakfasts', 'Finale: Community picnic and lagoon watersports at Thun\'di']
    }
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Switches between the 11 main exploration tabs
   */
  function switchTab(tabId) {
    const panels = document.querySelectorAll('.tab-panel');
    const buttons = document.querySelectorAll('.nav-tab-btn');

    let found = false;
    for (let i = 0; i < panels.length; i++) {
      const isMatch = panels[i].id === 'tab-' + tabId;
      panels[i].classList.toggle('active', isMatch);
      if (isMatch) found = true;
    }
    if (!found) return;

    for (let i = 0; i < buttons.length; i++) {
      const btnTab = buttons[i].getAttribute('data-tab');
      buttons[i].classList.toggle('active', btnTab === tabId);
    }

    const prevTab = APP_STATE.activeTab;
    APP_STATE.activeTab = tabId;

    // Close mobile menu if open
    const mainNav = document.getElementById('main-nav-links');
    if (mainNav) mainNav.classList.remove('mobile-open');

    // CRITICAL REQUIREMENT: When visitor opens the quiz tab after leaving it, generate a fresh question set
    if (tabId === 'quiz' && prevTab !== 'quiz' && typeof window.generateNewQuiz === 'function') {
      window.generateNewQuiz(false);
    }

    // Scroll smoothly to top of content area
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateReadingProgress();
  }

  function startJourneyScroll() {
    switchTab('home');
    const introSection = document.getElementById('home-intro-anchor');
    if (introSection) {
      introSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function toggleMobileMenu() {
    const mainNav = document.getElementById('main-nav-links');
    if (mainNav) {
      mainNav.classList.toggle('mobile-open');
    }
  }

  /**
   * Dark / Light Theme Toggle
   */
  function applyTheme(theme) {
    APP_STATE.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️ <span class="util-label">Light</span>' : '🌙 <span class="util-label">Dark</span>';
    }
    try {
      localStorage.setItem('haas_kelaa_theme', theme);
    } catch (e) {}
  }

  function toggleTheme() {
    const next = APP_STATE.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    showHaasToast('Switched to ' + (next === 'dark' ? 'Deep Ocean Dark' : 'Tropical Daylight') + ' theme');
  }

  /**
   * Web Audio API Ambient Tropical Soundscape (Ocean Surf + Gentle Pentatonic Marimba Chimes)
   * Strictly user-initiated via Mute/Unmute button; never autoplays without user interaction.
   */
  function toggleAmbientAudio() {
    if (APP_STATE.audioPlaying) {
      stopAmbientAudio();
      showHaasToast('Island ambient soundtrack muted');
    } else {
      startAmbientAudio();
      showHaasToast('Playing gentle Kelaa lagoon waves & tropical marimba chimes');
    }
  }

  function startAmbientAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!APP_STATE.audioCtx) {
        APP_STATE.audioCtx = new AudioContext();
      }
      const ctx = APP_STATE.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create gentle ocean wave pink-ish noise with LFO filter
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.012;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 380;

      const waveGain = ctx.createGain();
      waveGain.gain.value = 0.22;

      whiteNoise.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(ctx.destination);
      whiteNoise.start(0);
      APP_STATE.noiseNode = whiteNoise;

      // Gentle pentatonic marimba notes
      const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
      if (APP_STATE.audioTimer) clearInterval(APP_STATE.audioTimer);
      APP_STATE.audioTimer = setInterval(function() {
        if (!APP_STATE.audioPlaying || !APP_STATE.audioCtx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const freq = notes[Math.floor(Math.random() * notes.length)];
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.95);
      }, 2200);

      APP_STATE.audioPlaying = true;
      updateAudioButtons();
    } catch (e) {
      APP_STATE.audioPlaying = false;
    }
  }

  function stopAmbientAudio() {
    if (APP_STATE.audioTimer) {
      clearInterval(APP_STATE.audioTimer);
      APP_STATE.audioTimer = null;
    }
    if (APP_STATE.noiseNode) {
      try { APP_STATE.noiseNode.stop(); } catch (e) {}
      APP_STATE.noiseNode = null;
    }
    APP_STATE.audioPlaying = false;
    updateAudioButtons();
  }

  function updateAudioButtons() {
    const navBtn = document.getElementById('audio-toggle-btn');
    const heroBtn = document.getElementById('hero-audio-btn');
    const label = APP_STATE.audioPlaying ? '🔊 Sound: ON (Mute)' : '🔇 Sound: OFF (Play Ambience)';
    const shortLabel = APP_STATE.audioPlaying ? '🔊 <span class="util-label">Audio On</span>' : '🔇 <span class="util-label">Audio Off</span>';
    if (navBtn) {
      navBtn.innerHTML = shortLabel;
      navBtn.classList.toggle('active-util', APP_STATE.audioPlaying);
    }
    if (heroBtn) {
      heroBtn.innerHTML = label;
      heroBtn.classList.toggle('active-audio', APP_STATE.audioPlaying);
    }
  }

  /**
   * Interactive Island Map Inspector
   */
  function selectMapPin(pinKey) {
    const info = MAP_LANDMARKS[pinKey];
    if (!info) return;
    APP_STATE.activeMapPin = pinKey;

    const pins = document.querySelectorAll('.island-map-pin');
    for (let i = 0; i < pins.length; i++) {
      pins[i].classList.toggle('active', pins[i].getAttribute('data-pin') === pinKey);
    }

    const detailBox = document.getElementById('map-landmark-detail');
    if (detailBox) {
      detailBox.innerHTML =
        '<span class="landmark-cat-badge">' + escapeHtml(info.category) + '</span>' +
        '<h3 class="landmark-title">' + escapeHtml(info.title) + '</h3>' +
        '<p class="landmark-coords">📍 ' + escapeHtml(info.coords) + '</p>' +
        '<p class="landmark-desc">' + escapeHtml(info.summary) + '</p>' +
        '<div class="landmark-fact-callout"><strong>Key Verification:</strong> ' + escapeHtml(info.fact) + '</div>' +
        '<a href="' + escapeHtml(info.sourceUrl) + '" target="_blank" rel="noopener noreferrer" class="landmark-source-link">🔗 Verified Source: ' + escapeHtml(info.sourceLabel) + ' ↗</a>';
    }
  }

  /**
   * Interactive Timeline Filter & Accordion Toggles
   */
  function filterTimeline(era) {
    APP_STATE.timelineFilter = era;
    const btns = document.querySelectorAll('.timeline-filter-btn');
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-era') === era);
    }
    const items = document.querySelectorAll('.timeline-node');
    for (let i = 0; i < items.length; i++) {
      const itemEra = items[i].getAttribute('data-era');
      const show = (era === 'all' || itemEra === era);
      items[i].style.display = show ? 'flex' : 'none';
    }
  }

  function toggleAccordion(panelId) {
    const el = document.getElementById(panelId);
    if (!el) return;
    el.classList.toggle('open');
  }

  /**
   * Cultural Spotlight Selector
   */
  function selectCultureSpotlight(key) {
    const data = CULTURE_SPOTLIGHTS[key];
    if (!data) return;
    const btns = document.querySelectorAll('.culture-spot-btn');
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-spot') === key);
    }
    const panel = document.getElementById('culture-spotlight-panel');
    if (panel) {
      panel.innerHTML =
        '<span class="spot-badge">' + escapeHtml(data.badge) + '</span>' +
        '<h4>' + escapeHtml(data.title) + '</h4>' +
        '<p>' + escapeHtml(data.body) + '</p>' +
        '<ul class="spot-spec-list">' +
          data.specs.map(function(s) { return '<li>✦ ' + escapeHtml(s) + '</li>'; }).join('') +
        '</ul>';
    }
  }

  /**
   * Hidden Treasures & Favourite Facts System
   */
  function renderHiddenTreasures() {
    const grid = document.getElementById('treasures-cards-grid');
    if (!grid) return;

    let html = '';
    for (let i = 0; i < HIDDEN_TREASURES.length; i++) {
      const item = HIDDEN_TREASURES[i];
      const isFav = APP_STATE.favourites.indexOf(item.id) !== -1;
      html +=
        '<article class="treasure-card glass-card" id="treasure-' + item.id + '">' +
          '<div class="treasure-card-top">' +
            '<span class="did-you-know-tag">DID YOU KNOW? #' + (i + 1) + '</span>' +
            '<span class="treasure-cat-pill">' + escapeHtml(item.category) + '</span>' +
            '<button type="button" class="fav-heart-btn ' + (isFav ? 'active' : '') + '" onclick="toggleFavouriteFact(\'' + item.id + '\')" title="Save to Favourite Facts">' +
              (isFav ? '♥ Saved' : '♡ Save') +
            '</button>' +
          '</div>' +
          '<h3 class="treasure-title">' + escapeHtml(item.title) + '</h3>' +
          '<p class="treasure-short">' + escapeHtml(item.shortText) + '</p>' +
          '<p class="treasure-detail">' + escapeHtml(item.detail) + '</p>' +
          '<div class="treasure-footer">' +
            '<a href="' + escapeHtml(item.sourceUrl) + '" target="_blank" rel="noopener noreferrer" class="source-inline-link">Source: ' + escapeHtml(item.sourceName) + ' ↗</a>' +
          '</div>' +
        '</article>';
    }
    grid.innerHTML = html;
    updateFavouritesBadge();
  }

  function toggleFavouriteFact(factId) {
    const idx = APP_STATE.favourites.indexOf(factId);
    if (idx === -1) {
      APP_STATE.favourites.push(factId);
      showHaasToast('Added to your Saved Kelaa Facts!');
    } else {
      APP_STATE.favourites.splice(idx, 1);
      showHaasToast('Removed from Saved Facts');
    }
    try {
      localStorage.setItem('haas_kelaa_favs', JSON.stringify(APP_STATE.favourites));
    } catch (e) {}
    renderHiddenTreasures();
    renderFavouritesModalList();
  }

  function updateFavouritesBadge() {
    const countEl = document.getElementById('fav-count-badge');
    if (countEl) {
      countEl.textContent = String(APP_STATE.favourites.length);
    }
  }

  function openFavouritesModal() {
    renderFavouritesModalList();
    const modal = document.getElementById('favourites-modal');
    if (modal) modal.classList.add('active');
  }

  function closeFavouritesModal() {
    const modal = document.getElementById('favourites-modal');
    if (modal) modal.classList.remove('active');
  }

  function renderFavouritesModalList() {
    const listEl = document.getElementById('favourites-modal-list');
    if (!listEl) return;
    if (APP_STATE.favourites.length === 0) {
      listEl.innerHTML = '<p class="empty-fav-msg">You have not bookmarked any facts yet. Visit the <strong>Hidden Treasures</strong> tab and click "♡ Save" on any discovery card!</p>';
      return;
    }
    const items = HIDDEN_TREASURES.filter(function(f) {
      return APP_STATE.favourites.indexOf(f.id) !== -1;
    });
    listEl.innerHTML = items.map(function(item) {
      return (
        '<div class="fav-saved-item">' +
          '<div>' +
            '<strong>' + escapeHtml(item.title) + '</strong>' +
            '<p>' + escapeHtml(item.shortText) + '</p>' +
          '</div>' +
          '<button type="button" class="btn-remove-fav" onclick="toggleFavouriteFact(\'' + item.id + '\')">Remove ✕</button>' +
        '</div>'
      );
    }).join('');
  }

  /**
   * Random Interesting Fact Generator
   */
  function triggerRandomFact() {
    const randomItem = HIDDEN_TREASURES[Math.floor(Math.random() * HIDDEN_TREASURES.length)];
    const box = document.getElementById('random-fact-spotlight');
    if (box) {
      box.innerHTML =
        '<div class="random-spotlight-inner">' +
          '<span class="did-you-know-tag">✨ RANDOM KELAA DISCOVERY</span>' +
          '<h4>' + escapeHtml(randomItem.title) + '</h4>' +
          '<p><strong>' + escapeHtml(randomItem.shortText) + '</strong> ' + escapeHtml(randomItem.detail) + '</p>' +
          '<a href="' + escapeHtml(randomItem.sourceUrl) + '" target="_blank" rel="noopener noreferrer" class="source-inline-link">Verified Source: ' + escapeHtml(randomItem.sourceName) + ' ↗</a>' +
        '</div>';
      box.classList.remove('pulse-anim');
      void box.offsetWidth;
      box.classList.add('pulse-anim');
    }
  }

  /**
   * Photo Gallery Filtering & Full-Screen Lightbox
   */
  function filterGallery(category) {
    APP_STATE.galleryCategory = category;
    const btns = document.querySelectorAll('.gallery-filter-btn');
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-cat') === category);
    }

    APP_STATE.filteredGallery = GALLERY_ITEMS.filter(function(item) {
      return category === 'all' || item.category === category;
    });

    const grid = document.getElementById('photo-gallery-grid');
    if (!grid) return;

    grid.innerHTML = APP_STATE.filteredGallery.map(function(item, idx) {
      return (
        '<figure class="gallery-card glass-card" onclick="openLightbox(' + idx + ')">' +
          '<div class="gallery-img-wrap">' +
            '<img src="' + item.src + '" alt="' + escapeHtml(item.title) + '" loading="lazy" />' +
            '<span class="gallery-cat-badge">' + escapeHtml(item.catLabel) + '</span>' +
            '<span class="gallery-zoom-hint">🔍 View Fullscreen</span>' +
          '</div>' +
          '<figcaption class="gallery-caption-box">' +
            '<h4>' + escapeHtml(item.title) + '</h4>' +
            '<p>' + escapeHtml(item.caption) + '</p>' +
            '<small class="gallery-credit">' + escapeHtml(item.credit) + '</small>' +
          '</figcaption>' +
        '</figure>'
      );
    }).join('');
  }

  function openLightbox(index) {
    if (!APP_STATE.filteredGallery.length) {
      APP_STATE.filteredGallery = GALLERY_ITEMS.slice();
    }
    if (index < 0) index = APP_STATE.filteredGallery.length - 1;
    if (index >= APP_STATE.filteredGallery.length) index = 0;
    APP_STATE.lightboxIndex = index;

    const item = APP_STATE.filteredGallery[index];
    const modal = document.getElementById('lightbox-modal');
    const imgEl = document.getElementById('lightbox-img');
    const titleEl = document.getElementById('lightbox-title');
    const capEl = document.getElementById('lightbox-caption');
    const credEl = document.getElementById('lightbox-credit');
    const countEl = document.getElementById('lightbox-counter');

    if (imgEl) {
      imgEl.src = item.src;
      imgEl.alt = item.title;
    }
    if (titleEl) titleEl.textContent = item.title;
    if (capEl) capEl.textContent = item.caption;
    if (credEl) credEl.textContent = item.credit;
    if (countEl) countEl.textContent = (index + 1) + ' / ' + APP_STATE.filteredGallery.length + ' • ' + item.catLabel;
    if (modal) modal.classList.add('active');
  }

  function stepLightbox(delta) {
    openLightbox(APP_STATE.lightboxIndex + delta);
  }

  function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.remove('active');
  }

  /**
   * Global Website Content Search
   */
  const SEARCH_INDEX = [
    { tab: 'overview', title: 'Geography, Coordinates & 2,423 ha Lagoon', keywords: 'location haa alifu thiladhunmathi 203.37 hectares 8.6 km coastline athiri futtaru lagoon trivandrum india' },
    { tab: 'overview', title: 'Census 2022 Demographics & Population Statistics', keywords: 'population 1115 2444 locals foreigners census density migration male' },
    { tab: 'overview', title: 'Interactive Map of Kelaa Landmarks', keywords: 'map pins mosque kandoofaa lily house thundi gaamuli qufran school' },
    { tab: 'history', title: 'Origin of Name: Sandalwood (Kelaa), Kholaa & Keyla Mas', keywords: 'etymology sandalwood kelaa gas negi adi gandu kholaa keyla mas yellowthread threadfin' },
    { tab: 'history', title: 'Kelaa Old Friday Mosque (1701 AD / 1111 AH)', keywords: 'mosque aasaaree hukuru miskiy coral stone hirigaa sultan mohamed dhevvadhoo rasgefaanu calligraphy wells' },
    { tab: 'history', title: 'World War II British RAF Staging Post & Armoury (Badige)', keywords: 'wwii world war 2 british royal air force raf thundi badige armoury seaplane kandoo bodu thadhu' },
    { tab: 'history', title: 'Lily House (Maaloodhu Ge) & 1985 Radar Station', keywords: 'lily house maaloodhu ge katheeb kasim lime mortar 1985 japanese radar station 2004 tsunami filladhoo' },
    { tab: 'culture', title: 'Maliku Dhandi Stick Dance & Thaara Drum', keywords: 'maliku dhandi mulhifoa maali dhandi kuredhi ironwood kudhi lunboa maa fulus thaara drum stick dance' },
    { tab: 'culture', title: 'Eid Celebrations, Fen Kulhun & Malhu Surfing', keywords: 'eid water festival fen kulhun boduberu malhu breadfruit surfboard thundi picnic' },
    { tab: 'people', title: 'Al-Sheikh Ibrahim Rushdhee Al-Azharee (1897–1961)', keywords: 'sheikh ibrahim rushdhee al-azhar cairo sullamal areeb attorney general school sis dandoora' },
    { tab: 'people', title: 'Ali Ibrahim Manik – "Kelaa Alibe" (1945–2021)', keywords: 'kelaa alibe ali ibrahim manik parliament lawyer poet generator house indian teachers mihen noonthoa kan huree' },
    { tab: 'people', title: '7 Mosques of Kelaa (Masjid-al Ansar, Qufran, Zahra)', keywords: 'mosques islamic affairs masjid ansar qufran zahra women mosque eid mosque' },
    { tab: 'nature', title: 'H.A. Kelaa Kandoofaa Protected Wetland & Kelavaki (Bruguiera hainesii)', keywords: 'kandoofaa wetland mangrove kelavaki bruguiera hainesii kandoo kulhlhavah bodavaki burevi randoo' },
    { tab: 'nature', title: 'Golden Shower Tree (An\'malthaas), Protected Birds & Bioluminescence', keywords: 'golden shower tree cassia fistula anmalthaas kinbi gas grey heron maakanaa iruvaahudhu kanbili bioluminescent plankton redhan' },
    { tab: 'food', title: 'Bimbi Bondi, Eid Bon\'di & Stilt Fishing (Kani Masverikan)', keywords: 'food bimbi bondi finger millet eid bondi coconut kani masverikan stilt fishing gaamuli dhunburi uni agriculture guesthouses' },
    { tab: 'treasures', title: '15 Hidden Treasures & "Did You Know?" Cards', keywords: 'surprising facts did you know hidden treasures random fact generator' },
    { tab: 'quiz', title: 'Interactive 30-Mark Quiz ("How Well Do You Know Kelaa?")', keywords: 'quiz test questions mcq true false 120 question bank score' },
    { tab: 'references', title: 'Official References, Academic Sources & Credits', keywords: 'references sources bibliography citations government wikipedia environment' }
  ];

  function openSearchModal() {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('site-search-input');
    if (modal) modal.classList.add('active');
    runSiteSearch(input ? input.value : '');
    if (input) setTimeout(function() { input.focus(); }, 60);
  }

  function closeSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) modal.classList.remove('active');
  }

  function runSiteSearch(query) {
    const q = String(query || '').trim().toLowerCase();
    const resContainer = document.getElementById('site-search-results');
    if (!resContainer) return;

    const matches = SEARCH_INDEX.filter(function(item) {
      if (!q) return true;
      return item.title.toLowerCase().indexOf(q) !== -1 || item.keywords.indexOf(q) !== -1;
    });

    if (matches.length === 0) {
      resContainer.innerHTML = '<p class="empty-fav-msg">No matching topics found for "' + escapeHtml(query) + '". Try searching for <em>Kelavaki</em>, <em>Maliku Dhandi</em>, <em>Mosque</em>, <em>Lagoon</em>, or <em>Bimbi Bondi</em>.</p>';
      return;
    }

    resContainer.innerHTML = matches.map(function(m) {
      return (
        '<button type="button" class="search-result-item" onclick="jumpToSearchResult(\'' + m.tab + '\')">' +
          '<span class="search-res-tab">' + escapeHtml(m.tab.toUpperCase()) + ' TAB</span>' +
          '<strong>' + escapeHtml(m.title) + '</strong>' +
        '</button>'
      );
    }).join('');
  }

  function jumpToSearchResult(tabId) {
    closeSearchModal();
    switchTab(tabId);
  }

  /**
   * Toast Notification Helper (Replaces alert())
   */
  let toastTimeout = null;
  function showHaasToast(message) {
    const toast = document.getElementById('haas-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function() {
      toast.classList.remove('visible');
    }, 3200);
  }

  /**
   * Reading Progress & Back-to-Top
   */
  function updateReadingProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const docHeight = Math.max(document.documentElement.scrollHeight - document.documentElement.clientHeight, 1);
    const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
    const bar = document.getElementById('reading-progress-bar');
    if (bar) bar.style.width = pct + '%';

    const topBtn = document.getElementById('back-to-top-btn');
    if (topBtn) {
      topBtn.classList.toggle('visible', scrollTop > 320);
    }
  }

  function scrollToTopPage() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Initialize App on DOMContentLoaded
   */
  function initHaasKelaaApp() {
    applyTheme(APP_STATE.theme);
    updateAudioButtons();
    selectMapPin('mosque');
    selectCultureSpotlight('mulhifoa');
    renderHiddenTreasures();
    triggerRandomFact();
    filterGallery('all');
    if (typeof window.generateNewQuiz === 'function') {
      window.generateNewQuiz(false);
    }

    window.addEventListener('scroll', updateReadingProgress);
    window.addEventListener('keydown', function(e) {
      const lb = document.getElementById('lightbox-modal');
      if (lb && lb.classList.contains('active')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') stepLightbox(1);
        if (e.key === 'ArrowLeft') stepLightbox(-1);
      }
      const sm = document.getElementById('search-modal');
      if (sm && sm.classList.contains('active') && e.key === 'Escape') {
        closeSearchModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHaasKelaaApp);
  } else {
    initHaasKelaaApp();
  }

  // Expose functions globally
  window.switchTab = switchTab;
  window.startJourneyScroll = startJourneyScroll;
  window.toggleMobileMenu = toggleMobileMenu;
  window.toggleTheme = toggleTheme;
  window.toggleAmbientAudio = toggleAmbientAudio;
  window.selectMapPin = selectMapPin;
  window.filterTimeline = filterTimeline;
  window.toggleAccordion = toggleAccordion;
  window.selectCultureSpotlight = selectCultureSpotlight;
  window.toggleFavouriteFact = toggleFavouriteFact;
  window.openFavouritesModal = openFavouritesModal;
  window.closeFavouritesModal = closeFavouritesModal;
  window.triggerRandomFact = triggerRandomFact;
  window.filterGallery = filterGallery;
  window.openLightbox = openLightbox;
  window.stepLightbox = stepLightbox;
  window.closeLightbox = closeLightbox;
  window.openSearchModal = openSearchModal;
  window.closeSearchModal = closeSearchModal;
  window.runSiteSearch = runSiteSearch;
  window.jumpToSearchResult = jumpToSearchResult;
  window.showHaasToast = showHaasToast;
  window.scrollToTopPage = scrollToTopPage;
})();
