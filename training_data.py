"""
Curated Training & Knowledge Corpus for Veritas Fake News Detector.
Includes balanced datasets across:
- Verified National & International News (NDTV, Times of India, The Hindu, Reuters, BBC, PIB)
- Viral WhatsApp Forwards & Disinformation Hoaxes
- Health, Medical & Science Myths
- Sensational Clickbait & Fabricated Political Propaganda
"""

DATASET = [
    # --- REAL NEWS (Label 1 = REAL) ---
    {
        "text": "ISRO successfully launches Chandrayaan-3 mission from Sriharikota spaceport. The spacecraft entered the lunar transfer trajectory and achieved a soft landing on the south pole of the Moon.",
        "label": 1,
        "category": "science"
    },
    {
        "text": "Reserve Bank of India leaves repo rate unchanged at 6.5 percent in its monetary policy committee meeting, citing inflation risks and global economic uncertainty.",
        "label": 1,
        "category": "economy"
    },
    {
        "text": "The Times of India reports that Delhi Metro will expand phase 4 corridors to improve connectivity across outer ring road and national capital region.",
        "label": 1,
        "category": "infrastructure"
    },
    {
        "text": "NDTV reports Supreme Court upholds constitutional validity of amended provisions while directing regulatory safeguards for privacy and data protection.",
        "label": 1,
        "category": "judiciary"
    },
    {
        "text": "World Health Organization announces updated guidelines on sodium intake, advising adults to consume less than 2000 milligrams of sodium per day to lower cardiovascular risks.",
        "label": 1,
        "category": "health"
    },
    {
        "text": "Ministry of External Affairs confirms bilateral trade agreement signed between India and the United Arab Emirates to settle transactions in local currencies.",
        "label": 1,
        "category": "politics"
    },
    {
        "text": "Indian Railways introduces Vande Bharat Express sleeper version prototypes with advanced Kavach anti-collision safety systems, according to Railway Board officials.",
        "label": 1,
        "category": "infrastructure"
    },
    {
        "text": "NASA's James Webb Space Telescope discovers oldest known galaxy cluster in early universe, providing new insights into cosmic evolution 13 billion years ago.",
        "label": 1,
        "category": "science"
    },
    {
        "text": "Finance Minister presents Union Budget in Parliament, increasing capital expenditure allocation for national highways, green energy, and digital infrastructure.",
        "label": 1,
        "category": "economy"
    },
    {
        "text": "India cricket team defeats Australia in final match of Test series to retain the Border-Gavaskar Trophy, BCCI confirms in official statement.",
        "label": 1,
        "category": "sports"
    },
    {
        "text": "Election Commission of India announces schedule for legislative assembly elections across five states, enforcing the Model Code of Conduct with immediate effect.",
        "label": 1,
        "category": "politics"
    },
    {
        "text": "Scientists at Indian Institute of Science develop low-cost water purification membrane capable of removing heavy metals and microplastics from industrial effluents.",
        "label": 1,
        "category": "science"
    },
    {
        "text": "United Nations climate summit concludes with consensus agreement to transition away from fossil fuels in energy systems in a just, orderly and equitable manner.",
        "label": 1,
        "category": "environment"
    },
    {
        "text": "The Hindu reports that monsoon rainfall reached 102 percent of long period average across southern peninsula, improving reservoir storage levels.",
        "label": 1,
        "category": "environment"
    },
    {
        "text": "Central Board of Direct Taxes reports net direct tax collections grew by 18.2 percent during fiscal year driven by corporate tax and personal income tax filings.",
        "label": 1,
        "category": "economy"
    },
    {
        "text": "Indian Council of Medical Research ICMR issues clinical advisory on seasonal viral respiratory infections, advising adequate hydration and consultation with registered medical practitioners.",
        "label": 1,
        "category": "health"
    },
    {
        "text": "BBC News reports European Union enacts Artificial Intelligence Act, setting risk-based classifications and transparency requirements for high-risk generative AI models.",
        "label": 1,
        "category": "technology"
    },
    {
        "text": "Stock market indices Sensex and Nifty settle higher following heavy buying in IT and banking shares, amid positive global cues and foreign institutional inflows.",
        "label": 1,
        "category": "economy"
    },
    {
        "text": "National Highway Authority of India implements satellite-based toll collection system on pilot expressway corridors to eliminate physical toll plazas and traffic congestion.",
        "label": 1,
        "category": "infrastructure"
    },
    {
        "text": "Reuters reports crude oil benchmarks traded steadily following OPEC plus production quotas review, keeping supply tightened amidst projected seasonal demand.",
        "label": 1,
        "category": "economy"
    },
    {
        "text": "Press Information Bureau PIB issues clarification stating that rumors regarding nationwide demonetization of 500 rupee banknotes are baseless and false.",
        "label": 1,
        "category": "factcheck"
    },
    {
        "text": "Indian Space Research Organisation launches meteorological satellite INSAT-3DS aboard GSLV rocket to provide continuity of weather monitoring and oceanic observations.",
        "label": 1,
        "category": "science"
    },
    {
        "text": "Ministry of Education releases National Institutional Ranking Framework NIRF rankings, with IIT Madras securing the top spot in overall category for consecutive years.",
        "label": 1,
        "category": "education"
    },
    {
        "text": "Tokyo Electric Power Company resumes monitored treated water discharge from Fukushima nuclear station in accordance with International Atomic Energy Agency safety standards.",
        "label": 1,
        "category": "world"
    },
    {
        "text": "Automobile manufacturer Tata Motors announces billion dollar investment in state-of-the-art electric vehicle battery gigafactory to power upcoming clean mobility fleet.",
        "label": 1,
        "category": "business"
    },

    # --- FAKE / FABRICATED NEWS (Label 0 = FAKE) ---
    {
        "text": "SHOCKING: UNESCO declares Indian National Anthem Jana Gana Mana as best national anthem in the world! Forward this message to all groups immediately to show your patriotism!",
        "label": 0,
        "category": "whatsapp_hoax"
    },
    {
        "text": "BREAKING: Reserve Bank of India has embedded a nano-GPS chip inside new 2000 rupee notes that allows satellites to track hidden cash piles even 120 meters underground!",
        "label": 0,
        "category": "currency_myth"
    },
    {
        "text": "SECRET CURE EXPOSED: Drinking hot lemon water with baking soda destroys coronavirus and all cancer cells in just 24 hours! Doctors are hiding this miraculous remedy!",
        "label": 0,
        "category": "medical_scam"
    },
    {
        "text": "Government of India is giving free 5000 rupees recharge to all citizens who click this special link and share on 10 WhatsApp groups before midnight! Hurry up!",
        "label": 0,
        "category": "phishing"
    },
    {
        "text": "NASA satellite photos reveal entire India illuminated during festival night, while scientists confirm divine cosmic cosmic vibrations detected from space over temple!",
        "label": 0,
        "category": "viral_conspiracy"
    },
    {
        "text": "URGENT WARNING: Eating kurkure causes plastic buildup in human stomach because it contains petroleum and flammable synthetic polymers that melt like plastic!",
        "label": 0,
        "category": "food_myth"
    },
    {
        "text": "WhatsApp will become paid from next Monday costing 499 rupees per month unless you forward this alert to at least 25 contacts right now!",
        "label": 0,
        "category": "chain_letter"
    },
    {
        "text": "SCANDAL: Secret leaked document proves 5G mobile cell towers transmit radiation frequencies specifically calibrated to spread respiratory lung infections and control brains!",
        "label": 0,
        "category": "conspiracy"
    },
    {
        "text": "BOYCOTT IMMEDIATELY: Popular cold drink brand contains blood of diseased cattle according to secret forensic lab report leaked by brave anonymous whistleblower!",
        "label": 0,
        "category": "defamation"
    },
    {
        "text": "Government has decided to freeze all private bank savings accounts and seize 30 percent of deposits starting next Monday to pay off foreign national debt!",
        "label": 0,
        "category": "financial_panic"
    },
    {
        "text": "PUT AN ONION IN YOUR SOCKS: Ancient Himalayan doctor reveals sleeping with raw sliced onion absorbs all toxins and eliminates diabetes and paralysis overnight without medicine!",
        "label": 0,
        "category": "medical_scam"
    },
    {
        "text": "EXPOSED: Leading world leaders meet at clandestine underground ritual site to orchestrate global earthquake weapon using geomagnetic ionosphere antennas!",
        "label": 0,
        "category": "conspiracy"
    },
    {
        "text": "ALERT: Do not attend any calls from numbers starting with plus 92 as your phone battery will explode instantly and drain your entire bank balance in seconds!",
        "label": 0,
        "category": "whatsapp_hoax"
    },
    {
        "text": "Supreme Court judge resigns in tears live on national television after disclosing shocking secret military coup underway right now across major metropolitan capitals!",
        "label": 0,
        "category": "political_hoax"
    },
    {
        "text": "Miracle herbal oil from Amazonian rainforest regrows severed human limbs and restores 20/20 eyesight in 3 days! Pharmaceutical companies tried to ban this link!",
        "label": 0,
        "category": "medical_scam"
    },
    {
        "text": "NASA confirms Earth will undergo complete total darkness for 15 straight days starting next Friday due to unprecedented solar alignment and planetary eclipse!",
        "label": 0,
        "category": "astronomy_hoax"
    },
    {
        "text": "Prime Minister signs secret emergency decree abolishing all state borders and declaring nationwide martial law starting tomorrow morning at 6 AM!",
        "label": 0,
        "category": "political_hoax"
    },
    {
        "text": "Drinking boiled garlic water completely cures incurable terminal diseases in 48 hours according to viral Chinese traditional herbal remedy text!",
        "label": 0,
        "category": "medical_scam"
    },
    {
        "text": "Free laptop distribution scheme for all students launched by Prime Minister office, enter your Aadhaar number and OTP on this unverified blog site immediately!",
        "label": 0,
        "category": "phishing"
    },
    {
        "text": "Aliens have officially landed in remote desert base and signed technology pact with global shadow government, footage hidden from public mainstream media!",
        "label": 0,
        "category": "conspiracy"
    },
    {
        "text": "UNBELIEVABLE: Major soft drink company admits putting pork gelatin and addictive hypnotic narcotics into baby formulas to manipulate future consumer generations!",
        "label": 0,
        "category": "defamation"
    },
    {
        "text": "New rule says sending WhatsApp messages with double red ticks means government police has initiated your immediate surveillance and home arrest warrant!",
        "label": 0,
        "category": "whatsapp_hoax"
    },
    {
        "text": "World Health Organization has secretly patented all wild plant DNA to force every human citizen to purchase synthetic food rations starting next year!",
        "label": 0,
        "category": "conspiracy"
    },
    {
        "text": "Artificial sweetener aspartame is proven to be an intentional biological weapon manufactured by foreign intelligence agencies to reduce global lifespan!",
        "label": 0,
        "category": "medical_scam"
    },
    {
        "text": "BREAKING: Reserve Bank to discontinue all 500 rupee currency notes by the end of this month, citizens requested to deposit notes immediately or face forfeiture!",
        "label": 0,
        "category": "currency_myth"
    }
]

# Known credible publishers and fact checking domains
TRUSTED_DOMAINS = {
    "ndtv.com": {"name": "NDTV", "trust_score": 92, "category": "mainstream_news", "country": "India"},
    "timesofindia.indiatimes.com": {"name": "The Times of India", "trust_score": 90, "category": "mainstream_news", "country": "India"},
    "thehindu.com": {"name": "The Hindu", "trust_score": 95, "category": "mainstream_news", "country": "India"},
    "indianexpress.com": {"name": "The Indian Express", "trust_score": 93, "category": "mainstream_news", "country": "India"},
    "hindustantimes.com": {"name": "Hindustan Times", "trust_score": 89, "category": "mainstream_news", "country": "India"},
    "pib.gov.in": {"name": "Press Information Bureau (PIB)", "trust_score": 98, "category": "official_government", "country": "India"},
    "bbc.com": {"name": "BBC News", "trust_score": 94, "category": "international", "country": "UK"},
    "bbc.co.uk": {"name": "BBC UK", "trust_score": 94, "category": "international", "country": "UK"},
    "reuters.com": {"name": "Reuters", "trust_score": 98, "category": "wire_service", "country": "Global"},
    "apnews.com": {"name": "Associated Press (AP)", "trust_score": 98, "category": "wire_service", "country": "Global"},
    "aljazeera.com": {"name": "Al Jazeera", "trust_score": 88, "category": "international", "country": "Qatar"},
    "bloomberg.com": {"name": "Bloomberg", "trust_score": 93, "category": "financial_wire", "country": "US"},
    "who.int": {"name": "World Health Organization", "trust_score": 99, "category": "health_authority", "country": "Global"},
    "isro.gov.in": {"name": "ISRO", "trust_score": 99, "category": "space_agency", "country": "India"},
    "nasa.gov": {"name": "NASA", "trust_score": 99, "category": "space_agency", "country": "US"},
    "snopes.com": {"name": "Snopes Fact Check", "trust_score": 96, "category": "fact_checker", "country": "Global"},
    "altnews.in": {"name": "Alt News", "trust_score": 94, "category": "fact_checker", "country": "India"},
    "boomlive.in": {"name": "Boom Live", "trust_score": 93, "category": "fact_checker", "country": "India"},
    "factly.in": {"name": "Factly", "trust_score": 93, "category": "fact_checker", "country": "India"},
    "thequint.com": {"name": "The Quint (WebQoof)", "trust_score": 88, "category": "fact_checker", "country": "India"},
    "indiatoday.in": {"name": "India Today (Fact Check)", "trust_score": 90, "category": "mainstream_news", "country": "India"}
}

# Suspicious, satirical, or known fake-news domains
SUSPICIOUS_DOMAINS = {
    "thefakingnews.com": {"name": "Faking News (Satire)", "trust_score": 15, "category": "satire"},
    "theonion.com": {"name": "The Onion (Satire)", "trust_score": 15, "category": "satire"},
    "naturalnews.com": {"name": "Natural News", "trust_score": 20, "category": "health_pseudoscience"},
    "infowars.com": {"name": "InfoWars", "trust_score": 10, "category": "conspiracy"},
    "beforeitsnews.com": {"name": "Before It's News", "trust_score": 15, "category": "unverified_blog"}
}

# Viral Debunked Claims Database for rapid signature matching
DEBUNKED_SIGNATURES = [
    {
        "keywords": ["gps chip", "2000 note", "nano chip", "satellite tracking 120m"],
        "topic": "Nano GPS Chip in Rs 2000 Note",
        "verdict": "FALSE / FABRICATED",
        "debunked_by": "RBI & PIB Fact Check",
        "fact": "The Reserve Bank of India and Ministry of Finance confirmed that no currency note ever possessed electronic GPS chips or tracking hardware."
    },
    {
        "keywords": ["unesco", "jana gana mana", "best national anthem"],
        "topic": "UNESCO Best Anthem Award",
        "verdict": "FALSE / HOAX",
        "debunked_by": "UNESCO & AltNews",
        "fact": "UNESCO never declared any national anthem as the best in the world. This is a recurring internet hoax."
    },
    {
        "keywords": ["lemon", "baking soda", "cure cancer", "cure coronavirus"],
        "topic": "Lemon and Baking Soda Miracle Cure",
        "verdict": "FALSE / DANGEROUS MEDICAL SCAM",
        "debunked_by": "WHO & Healthline",
        "fact": "There is no clinical evidence that alkaline diets or lemon water cures cancer or viral infections."
    },
    {
        "keywords": ["5g", "radiation", "spreads virus", "respiratory lung"],
        "topic": "5G Radiation Spreads Illness",
        "verdict": "FALSE / CONSPIRACY",
        "debunked_by": "WHO, ITU, PIB",
        "fact": "5G non-ionizing radio waves cannot transmit biological pathogens or viruses."
    },
    {
        "keywords": ["earth 15 days darkness", "total darkness", "nasa confirms darkness"],
        "topic": "Earth Darkness for 15 Days",
        "verdict": "FALSE / HOAX",
        "debunked_by": "NASA",
        "fact": "NASA has repeatedly debunked claims of multi-day planetary darkness caused by solar or planetary conjunctions."
    },
    {
        "keywords": ["kurkure", "contains plastic", "burns like plastic"],
        "topic": "Kurkure Contains Plastic",
        "verdict": "FALSE / URBAN LEGEND",
        "debunked_by": "FSSAI & AFSTI",
        "fact": "Snacks burn due to starch and edible oils, not synthetic polymers or plastics."
    },
    {
        "keywords": ["free recharge", "5000", "whatsapp groups", "forward to 10"],
        "topic": "Free Government Recharge Scheme Link",
        "verdict": "PHISHING / SCAM",
        "debunked_by": "PIB Fact Check",
        "fact": "Government of India does not distribute free mobile recharge vouchers through WhatsApp chain forwards."
    },
    {
        "keywords": ["double red ticks", "whatsapp police", "surveillance warrant"],
        "topic": "WhatsApp Red Ticks Surveillance",
        "verdict": "FALSE / HOAX",
        "debunked_by": "WhatsApp & Factly",
        "fact": "WhatsApp features only grey single tick, grey double tick, and blue double tick. There is no three-tick or red-tick monitoring protocol."
    },
    {
        "keywords": ["onion in socks", "cures diabetes", "absorbs toxins"],
        "topic": "Onion in Socks Cures Disease",
        "verdict": "PSEUDOSCIENCE / FALSE",
        "debunked_by": "Medical News Today",
        "fact": "Placing onions on feet does not filter toxins through the bloodstream or reverse endocrine disorders."
    },
    {
        "keywords": ["discontinue 500 note", "ban 500 note", "demonetize 500"],
        "topic": "Demonetization of 500 Rupee Note",
        "verdict": "FALSE / RUMOR",
        "debunked_by": "PIB Fact Check & RBI",
        "fact": "The Reserve Bank of India has repeatedly clarified that 500 rupee banknotes remain legal tender and will not be banned."
    }
]

# Verified Factual Knowledge Graph for Real-Time Reality Checks
FACTUAL_KNOWLEDGE_BASE = {
    "current_officials": {
        "prime_minister_of_india": {
            "title": "Prime Minister of India",
            "current_holder": "Narendra Modi",
            "assumed_office": "May 2014",
            "synonyms": ["prime minister of india", "pm of india", "indian prime minister", "pm modi"],
            "former_holders": [
                "jawaharlal nehru", "lal bahadur shastri", "indira gandhi", "morarji desai",
                "charan singh", "rajiv gandhi", "v. p. singh", "chandra shekhar",
                "p. v. narasimha rao", "atal bihari vajpayee", "h. d. deve gowda",
                "i. k. gujral", "manmohan singh"
            ]
        },
        "president_of_india": {
            "title": "President of India",
            "current_holder": "Droupadi Murmu",
            "assumed_office": "July 2022",
            "synonyms": ["president of india", "rashtrapati", "indian president"],
            "former_holders": [
                "rajendra prasad", "sarvepalli radhakrishnan", "zakir husain", "v. v. giri",
                "fakhruddin ali ahmed", "neelam sanjiva reddy", "giani zail singh",
                "r. venkataraman", "shankar dayal sharma", "k. r. narayanan",
                "a. p. j. abdul kalam", "apj abdul kalam", "abdul kalam",
                "pratibha patil", "pranab mukherjee", "ram nath kovind"
            ]
        },
        "president_of_usa": {
            "title": "President of the United States",
            "current_holder": "Joe Biden",
            "synonyms": ["president of the united states", "us president", "potus"],
            "former_holders": ["george washington", "abraham lincoln", "barack obama", "donald trump", "george w. bush", "bill clinton"]
        },
        "prime_minister_of_uk": {
            "title": "Prime Minister of the United Kingdom",
            "current_holder": "Keir Starmer",
            "synonyms": ["uk prime minister", "prime minister of uk", "british prime minister"],
            "former_holders": ["rishi sunak", "liz truss", "boris johnson", "theresa may", "david cameron", "tony blair"]
        }
    },
    "historical_figures": {
        "apj abdul kalam": {
            "aliases": ["apj abdul kalam", "abdul kalam", "a. p. j. abdul kalam", "dr kalam", "dr. kalam", "a.p.j. abdul kalam", "kalam", "a p j abdul kalam"],
            "status": "deceased",
            "death_date": "July 27, 2015",
            "actual_role": "11th President of India (2002–2007)",
            "never_held": ["prime minister", "pm", "chief minister", "home minister", "finance minister"],
            "fact": "Dr. A.P.J. Abdul Kalam was the 11th President of India (2002–2007) and passed away on July 27, 2015. He was never the Prime Minister of India. The current Prime Minister is Narendra Modi."
        },
        "mahatma gandhi": {
            "aliases": ["mahatma gandhi", "gandhiji", "bapu", "m. k. gandhi", "mohandas gandhi"],
            "status": "deceased",
            "death_date": "January 30, 1948",
            "actual_role": "Leader of Indian Independence Movement",
            "never_held": ["prime minister", "president", "minister"],
            "fact": "Mahatma Gandhi was the leader of the Indian independence movement and passed away in 1948. He never held any political or governmental office."
        },
        "jawaharlal nehru": {
            "aliases": ["jawaharlal nehru", "pandit nehru", "nehru"],
            "status": "deceased",
            "death_date": "May 27, 1964",
            "actual_role": "1st Prime Minister of India (1947–1964)",
            "never_held": ["current prime minister", "current president", "president of india"],
            "fact": "Jawaharlal Nehru was India's 1st Prime Minister from 1947 until his demise in 1964."
        },
        "atal bihari vajpayee": {
            "aliases": ["atal bihari vajpayee", "vajpayee"],
            "status": "deceased",
            "death_date": "August 16, 2018",
            "actual_role": "Former Prime Minister of India",
            "never_held": ["current prime minister", "current president"],
            "fact": "Atal Bihari Vajpayee was a former Prime Minister of India who passed away in 2018."
        },
        "manmohan singh": {
            "aliases": ["manmohan singh", "dr manmohan singh"],
            "status": "living",
            "actual_role": "Former Prime Minister of India (2004–2014)",
            "never_held": ["current prime minister", "current president"],
            "fact": "Dr. Manmohan Singh served as Prime Minister of India from 2004 to 2014. The current Prime Minister of India is Narendra Modi."
        }
    }
}
