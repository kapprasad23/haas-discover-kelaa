================================================================================
HAAS PRESENTS – DISCOVER KELAA
An Extraordinary Journey Through the Hidden Treasures of the Maldives
Location: Kelaa Island, Haa Alifu Atoll, Republic of Maldives
================================================================================

PROJECT DIRECTORY STRUCTURE
---------------------------
KELAA_HAAS_WEBSITE/
├── index.html                  (Main website entry file)
├── README.txt                  (This instruction manual)
├── css/
│   └── style.css               (Master responsive stylesheet & dark/light themes)
├── js/
│   ├── main.js                 (11-tab navigation, map, audio, gallery & search)
│   ├── quiz.js                 (Fisher-Yates 30-mark interactive quiz engine)
│   └── questions.js            (120 verified questions: 60 MCQs + 60 True/False)
└── assets/
    ├── images/                 (Local high-resolution visuals & SVG diagrams)
    ├── icons/                  (HAAS crest logo & vector icons)
    └── backgrounds/            (Ocean wave SVG background assets)

1. HOW TO EXTRACT THE ZIP FILE
------------------------------
- On Windows: Right-click "KELAA_HAAS_WEBSITE.zip" and select "Extract All...", then click "Extract".
- On macOS: Double-click "KELAA_HAAS_WEBSITE.zip" in Finder to automatically extract the folder.
- On Linux: Run `unzip KELAA_HAAS_WEBSITE.zip` in your terminal.

2. HOW TO OPEN THE WEBSITE (WHICH FILE TO OPEN)
-----------------------------------------------
- Open the extracted `KELAA_HAAS_WEBSITE/` folder.
- Double-click `index.html` to launch the website directly in any modern web browser (Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge).
- No server, Node.js, database, or internet installation is required. All interactive features, sound effects, maps, galleries, and the 120-question randomized quiz run 100% locally.
- Note: A standalone single-file edition (`HAAS_Discover_Kelaa.html`) with all CSS, JavaScript, and images embedded is also provided for instant single-file sharing.

3. HOW TO ADD NEW PHOTOGRAPHS TO THE GALLERY
--------------------------------------------
1. Copy your new image file (`.jpg`, `.png`, or `.webp`) into the `assets/images/` folder.
2. Open `js/main.js` in any text editor (such as VS Code, Notepad, or TextEdit).
3. Locate the `GALLERY_ITEMS` array and append a new object:
   {
     id: 'gal_11',
     category: 'beaches', // Options: 'aerial', 'beaches', 'history', 'culture', 'people', 'food', 'nature', 'lifestyle'
     catLabel: 'Beaches & Lagoons',
     title: 'Your Photograph Title',
     src: 'assets/images/your_photo_filename.jpg',
     caption: 'Detailed description of the photograph in Kelaa.',
     credit: 'Photographer Name / Source Credit'
   }
4. Save `js/main.js` and refresh `index.html` in your browser.

4. HOW TO ADD NEW QUIZ QUESTIONS
--------------------------------
1. Open `js/questions.js` in any text editor.
2. To add a Multiple-Choice Question, append an entry to `window.KELAA_MCQ_BANK`:
   {
     "id": "mcq_61",
     "category": "History",
     "question": "Your new question text here?",
     "options": ["Correct Option", "Distractor 1", "Distractor 2", "Distractor 3"],
     "answer": "Correct Option",
     "explanation": "Explanation shown on the quiz review screen."
   }
3. To add a True/False Question, append an entry to `window.KELAA_TF_BANK`:
   {
     "id": "tf_61",
     "category": "Nature",
     "question": "Your True or False statement here.",
     "answer": true, // or false
     "explanation": "Explanation shown on the quiz review screen."
   }
4. The Fisher-Yates shuffle engine in `js/quiz.js` automatically detects the expanded question bank and randomly draws 15 MCQs and 15 True/False questions on every attempt.

5. HOW TO UPDATE WEBSITE CONTENT
--------------------------------
- Text sections for all 11 tabs are cleanly organized inside `index.html` under `<section id="tab-home">`, `<section id="tab-overview">`, `<section id="tab-history">`, `<section id="tab-culture">`, `<section id="tab-people">`, `<section id="tab-nature">`, `<section id="tab-food">`, `<section id="tab-treasures">`, `<section id="tab-gallery">`, `<section id="tab-quiz">`, and `<section id="tab-references">`.
- Interactive map pin descriptions and "Did You Know?" cards can be edited in `js/main.js` under `MAP_LANDMARKS` and `HIDDEN_TREASURES`.
================================================================================
