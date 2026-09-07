/**
 * List of major Indonesian cities/kabupaten for validation of "Tempat Lahir" field.
 * This list covers all provincial capitals and major cities/kabupaten across Indonesia.
 */
export const INDONESIAN_CITIES: string[] = [
    // Aceh
    "Banda Aceh", "Langsa", "Lhokseumawe", "Sabang", "Subulussalam",
    "Aceh Barat", "Aceh Barat Daya", "Aceh Besar", "Aceh Jaya", "Aceh Selatan",
    "Aceh Singkil", "Aceh Tamiang", "Aceh Tengah", "Aceh Tenggara", "Aceh Timur",
    "Aceh Utara", "Bener Meriah", "Bireuen", "Gayo Lues", "Nagan Raya",
    "Pidie", "Pidie Jaya", "Simeulue",

    // Sumatera Utara
    "Medan", "Binjai", "Gunungsitoli", "Padangsidimpuan", "Pematangsiantar",
    "Sibolga", "Tanjungbalai", "Tebing Tinggi",
    "Asahan", "Batubara", "Dairi", "Deli Serdang", "Humbang Hasundutan",
    "Karo", "Labuhanbatu", "Labuhanbatu Selatan", "Labuhanbatu Utara",
    "Langkat", "Mandailing Natal", "Nias", "Nias Barat", "Nias Selatan",
    "Nias Utara", "Padang Lawas", "Padang Lawas Utara", "Pakpak Bharat",
    "Samosir", "Serdang Bedagai", "Simalungun", "Tapanuli Selatan",
    "Tapanuli Tengah", "Tapanuli Utara", "Toba", "Toba Samosir",

    // Sumatera Barat
    "Padang", "Bukittinggi", "Padang Panjang", "Pariaman", "Payakumbuh",
    "Sawahlunto", "Solok",
    "Agam", "Dharmasraya", "Kepulauan Mentawai", "Lima Puluh Kota",
    "Padang Pariaman", "Pasaman", "Pasaman Barat", "Pesisir Selatan",
    "Sijunjung", "Solok Selatan", "Tanah Datar",

    // Riau
    "Pekanbaru", "Dumai",
    "Bengkalis", "Indragiri Hilir", "Indragiri Hulu", "Kampar",
    "Kepulauan Meranti", "Kuantan Singingi", "Pelalawan", "Rokan Hilir",
    "Rokan Hulu", "Siak",

    // Jambi
    "Jambi", "Sungai Penuh",
    "Batanghari", "Bungo", "Kerinci", "Merangin", "Muaro Jambi",
    "Sarolangun", "Tanjung Jabung Barat", "Tanjung Jabung Timur", "Tebo",

    // Sumatera Selatan
    "Palembang", "Lubuklinggau", "Pagar Alam", "Prabumulih",
    "Banyuasin", "Empat Lawang", "Lahat", "Muara Enim", "Musi Banyuasin",
    "Musi Rawas", "Musi Rawas Utara", "Ogan Ilir", "Ogan Komering Ilir",
    "Ogan Komering Ulu", "Ogan Komering Ulu Selatan", "Ogan Komering Ulu Timur",
    "Penukal Abab Lematang Ilir",

    // Bengkulu
    "Bengkulu",
    "Bengkulu Selatan", "Bengkulu Tengah", "Bengkulu Utara", "Kaur",
    "Kepahiang", "Lebong", "Mukomuko", "Rejang Lebong", "Seluma",

    // Lampung
    "Bandar Lampung", "Metro",
    "Lampung Barat", "Lampung Selatan", "Lampung Tengah", "Lampung Timur",
    "Lampung Utara", "Mesuji", "Pesawaran", "Pesisir Barat", "Pringsewu",
    "Tanggamus", "Tulang Bawang", "Tulang Bawang Barat", "Way Kanan",

    // Kep. Bangka Belitung
    "Pangkalpinang",
    "Bangka", "Bangka Barat", "Bangka Selatan", "Bangka Tengah",
    "Belitung", "Belitung Timur",

    // Kep. Riau
    "Batam", "Tanjungpinang",
    "Bintan", "Karimun", "Kepulauan Anambas", "Lingga", "Natuna",

    // DKI Jakarta
    "Jakarta", "Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan",
    "Jakarta Timur", "Jakarta Utara", "Kepulauan Seribu",

    // Jawa Barat
    "Bandung", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok",
    "Sukabumi", "Tasikmalaya", "Banjar",
    "Bandung Barat", "Ciamis", "Cianjur", "Garut", "Indramayu",
    "Karawang", "Kuningan", "Majalengka", "Pangandaran", "Purwakarta",
    "Subang", "Sumedang",

    // Jawa Tengah
    "Semarang", "Magelang", "Pekalongan", "Salatiga", "Surakarta", "Solo", "Tegal",
    "Banjarnegara", "Banyumas", "Batang", "Blora", "Boyolali", "Brebes",
    "Cilacap", "Demak", "Grobogan", "Jepara", "Kebumen", "Kendal",
    "Klaten", "Kudus", "Pati", "Pemalang", "Purbalingga", "Purworejo",
    "Rembang", "Sragen", "Temanggung", "Wonogiri", "Wonosobo",

    // DI Yogyakarta
    "Yogyakarta", "Jogjakarta", "Jogja",
    "Bantul", "Gunung Kidul", "Gunungkidul", "Kulon Progo", "Sleman",

    // Jawa Timur
    "Surabaya", "Batu", "Blitar", "Kediri", "Madiun", "Malang",
    "Mojokerto", "Pasuruan", "Probolinggo",
    "Bangkalan", "Banyuwangi", "Bojonegoro", "Bondowoso", "Gresik",
    "Jember", "Jombang", "Lamongan", "Lumajang", "Magetan",
    "Nganjuk", "Ngawi", "Pacitan", "Pamekasan", "Ponorogo",
    "Sampang", "Sidoarjo", "Situbondo", "Sumenep", "Trenggalek",
    "Tuban", "Tulungagung",

    // Banten
    "Serang", "Cilegon", "Tangerang", "Tangerang Selatan", "South Tangerang",
    "Lebak", "Pandeglang",

    // Bali
    "Denpasar",
    "Badung", "Bangli", "Buleleng", "Gianyar", "Jembrana",
    "Karangasem", "Klungkung", "Tabanan",

    // NTB
    "Mataram", "Bima",
    "Dompu", "Lombok Barat", "Lombok Tengah", "Lombok Timur",
    "Lombok Utara", "Sumbawa", "Sumbawa Barat",

    // NTT
    "Kupang",
    "Alor", "Belu", "Ende", "Flores Timur", "Lembata", "Malaka",
    "Manggarai", "Manggarai Barat", "Manggarai Timur", "Nagekeo",
    "Ngada", "Rote Ndao", "Sabu Raijua", "Sikka", "Sumba Barat",
    "Sumba Barat Daya", "Sumba Tengah", "Sumba Timur",
    "Timor Tengah Selatan", "Timor Tengah Utara",

    // Kalimantan Barat
    "Pontianak", "Singkawang",
    "Bengkayang", "Kapuas Hulu", "Kayong Utara", "Ketapang",
    "Kubu Raya", "Landak", "Melawi", "Mempawah",
    "Sambas", "Sanggau", "Sekadau", "Sintang",

    // Kalimantan Tengah
    "Palangkaraya", "Palangka Raya",
    "Barito Selatan", "Barito Timur", "Barito Utara", "Gunung Mas",
    "Kapuas", "Katingan", "Kotawaringin Barat", "Kotawaringin Timur",
    "Lamandau", "Murung Raya", "Pulang Pisau", "Seruyan", "Sukamara",

    // Kalimantan Selatan
    "Banjarmasin", "Banjarbaru",
    "Balangan", "Banjar", "Barito Kuala", "Hulu Sungai Selatan",
    "Hulu Sungai Tengah", "Hulu Sungai Utara", "Kotabaru",
    "Tabalong", "Tanah Bumbu", "Tanah Laut", "Tapin",

    // Kalimantan Timur
    "Samarinda", "Balikpapan", "Bontang",
    "Berau", "Kutai Barat", "Kutai Kartanegara", "Kutai Timur",
    "Mahakam Ulu", "Paser", "Penajam Paser Utara",

    // Kalimantan Utara
    "Tarakan",
    "Bulungan", "Malinau", "Nunukan", "Tana Tidung",

    // Sulawesi Utara
    "Manado", "Bitung", "Kotamobagu", "Tomohon",
    "Bolaang Mongondow", "Bolaang Mongondow Selatan", "Bolaang Mongondow Timur",
    "Bolaang Mongondow Utara", "Kepulauan Sangihe", "Kepulauan Siau Tagulandang Biaro",
    "Kepulauan Talaud", "Minahasa", "Minahasa Selatan", "Minahasa Tenggara", "Minahasa Utara",

    // Sulawesi Tengah
    "Palu",
    "Banggai", "Banggai Kepulauan", "Banggai Laut", "Buol",
    "Donggala", "Morowali", "Morowali Utara", "Parigi Moutong",
    "Poso", "Sigi", "Tojo Una-Una", "Toli-Toli",

    // Sulawesi Selatan
    "Makassar", "Parepare", "Palopo",
    "Bantaeng", "Barru", "Bone", "Bulukumba", "Enrekang", "Gowa",
    "Jeneponto", "Kepulauan Selayar", "Luwu", "Luwu Timur", "Luwu Utara",
    "Maros", "Pangkajene dan Kepulauan", "Pinrang", "Sidenreng Rappang",
    "Sinjai", "Soppeng", "Takalar", "Tana Toraja", "Toraja Utara", "Wajo",

    // Sulawesi Tenggara
    "Kendari", "Baubau",
    "Bombana", "Buton", "Buton Selatan", "Buton Tengah", "Buton Utara",
    "Kolaka", "Kolaka Timur", "Kolaka Utara", "Konawe", "Konawe Kepulauan",
    "Konawe Selatan", "Konawe Utara", "Muna", "Muna Barat", "Wakatobi",

    // Gorontalo
    "Gorontalo",
    "Boalemo", "Bone Bolango", "Gorontalo Utara", "Pohuwato",

    // Sulawesi Barat
    "Mamuju",
    "Majene", "Mamasa", "Mamuju Tengah", "Pasangkayu", "Polewali Mandar",

    // Maluku
    "Ambon", "Tual",
    "Buru", "Buru Selatan", "Kepulauan Aru", "Maluku Barat Daya",
    "Maluku Tengah", "Maluku Tenggara", "Maluku Tenggara Barat",
    "Seram Bagian Barat", "Seram Bagian Timur",

    // Maluku Utara
    "Ternate", "Tidore Kepulauan",
    "Halmahera Barat", "Halmahera Selatan", "Halmahera Tengah",
    "Halmahera Timur", "Halmahera Utara", "Kepulauan Sula",
    "Pulau Morotai", "Pulau Taliabu",

    // Papua
    "Jayapura",
    "Biak Numfor", "Kepulauan Yapen", "Keerom", "Mamberamo Raya",
    "Mamberamo Tengah", "Sarmi", "Supiori", "Waropen",

    // Papua Barat
    "Manokwari", "Sorong",
    "Fakfak", "Kaimana", "Maybrat", "Raja Ampat",
    "Sorong Selatan", "Tambrauw", "Teluk Bintuni", "Teluk Wondama",

    // Papua Selatan
    "Merauke",
    "Asmat", "Boven Digoel", "Mappi",

    // Papua Tengah
    "Nabire",
    "Deiyai", "Dogiyai", "Intan Jaya", "Mimika", "Paniai", "Puncak",
    "Puncak Jaya",

    // Papua Pegunungan
    "Wamena",
    "Jayawijaya", "Lanny Jaya", "Nduga", "Pegunungan Bintang",
    "Tolikara", "Yalimo", "Yahukimo",

    // Papua Barat Daya
    "Kota Sorong",

    // IKN / Nusantara
    "Nusantara",
];

/**
 * Major world cities — capitals, major metropolitan areas, and commonly referenced cities.
 * Covers all world capitals + major cities for students born outside Indonesia.
 */
export const WORLD_CITIES: string[] = [
    // Southeast Asia
    "Kuala Lumpur", "Johor Bahru", "Penang", "George Town", "Ipoh", "Malacca",
    "Singapore", "Singapura",
    "Bangkok", "Chiang Mai", "Phuket", "Pattaya",
    "Manila", "Quezon City", "Cebu", "Davao",
    "Hanoi", "Ho Chi Minh City", "Da Nang",
    "Phnom Penh", "Siem Reap",
    "Vientiane", "Luang Prabang",
    "Naypyidaw", "Yangon", "Mandalay",
    "Bandar Seri Begawan",
    "Dili",

    // East Asia
    "Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka", "Kobe",
    "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Wuhan", "Hangzhou",
    "Nanjing", "Chongqing", "Tianjin", "Xi'an", "Suzhou", "Qingdao",
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon",
    "Taipei", "Kaohsiung", "Taichung", "Tainan",
    "Hong Kong", "Macau",
    "Ulaanbaatar",
    "Pyongyang",

    // South Asia
    "New Delhi", "Delhi", "Mumbai", "Bangalore", "Bengaluru", "Chennai", "Kolkata",
    "Hyderabad", "Ahmedabad", "Pune", "Jaipur",
    "Dhaka", "Chittagong",
    "Colombo", "Kandy",
    "Kathmandu", "Pokhara",
    "Islamabad", "Karachi", "Lahore",
    "Kabul",
    "Thimphu",
    "Male",

    // Central Asia
    "Astana", "Almaty",
    "Tashkent", "Samarkand",
    "Bishkek",
    "Dushanbe",
    "Ashgabat",

    // Middle East
    "Dubai", "Abu Dhabi", "Sharjah",
    "Riyadh", "Jeddah", "Mecca", "Medina",
    "Doha",
    "Kuwait City",
    "Manama",
    "Muscat",
    "Amman",
    "Beirut",
    "Damascus",
    "Baghdad", "Erbil",
    "Tehran", "Isfahan",
    "Ankara", "Istanbul", "Izmir", "Antalya",
    "Jerusalem", "Tel Aviv",
    "Sanaa",

    // Europe
    "London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Liverpool", "Bristol",
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Strasbourg",
    "Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart", "Düsseldorf",
    "Madrid", "Barcelona", "Valencia", "Seville", "Bilbao",
    "Rome", "Milan", "Naples", "Turin", "Florence", "Venice", "Bologna",
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht",
    "Brussels", "Antwerp", "Ghent",
    "Lisbon", "Porto",
    "Vienna", "Salzburg", "Graz",
    "Zurich", "Geneva", "Bern", "Basel",
    "Dublin", "Cork",
    "Copenhagen", "Aarhus",
    "Stockholm", "Gothenburg", "Malmö",
    "Oslo", "Bergen",
    "Helsinki", "Tampere",
    "Reykjavik",
    "Warsaw", "Krakow", "Gdansk", "Wroclaw",
    "Prague", "Brno",
    "Budapest",
    "Bucharest", "Cluj-Napoca",
    "Sofia",
    "Athens", "Thessaloniki",
    "Belgrade",
    "Zagreb",
    "Ljubljana",
    "Sarajevo",
    "Skopje",
    "Tirana",
    "Podgorica",
    "Pristina",
    "Bratislava",
    "Vilnius", "Kaunas",
    "Riga",
    "Tallinn",
    "Kyiv", "Lviv", "Odesa", "Kharkiv",
    "Moscow", "Saint Petersburg", "Novosibirsk", "Vladivostok",
    "Minsk",
    "Chisinau",
    "Tbilisi", "Batumi",
    "Yerevan",
    "Baku",

    // North America
    "Washington D.C.", "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
    "San Francisco", "Seattle", "Boston", "Miami", "Dallas", "Atlanta",
    "Denver", "San Diego", "Philadelphia", "Las Vegas", "Portland",
    "Ottawa", "Toronto", "Vancouver", "Montreal", "Calgary", "Edmonton",
    "Mexico City", "Guadalajara", "Monterrey", "Cancún", "Puebla",
    "Havana",
    "San Juan",
    "Kingston",
    "Nassau",
    "Port-au-Prince",
    "Santo Domingo",
    "San José",
    "Panama City",
    "Guatemala City",
    "Tegucigalpa", "San Pedro Sula",
    "San Salvador",
    "Managua",
    "Belmopan",

    // South America
    "Buenos Aires", "Córdoba", "Rosario",
    "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Recife", "Belo Horizonte",
    "Santiago",
    "Lima", "Cusco",
    "Bogotá", "Medellín", "Cali",
    "Caracas",
    "Quito", "Guayaquil",
    "La Paz", "Santa Cruz",
    "Asunción",
    "Montevideo",
    "Georgetown",
    "Paramaribo",
    "Cayenne",

    // Africa
    "Cairo", "Alexandria",
    "Lagos", "Abuja",
    "Nairobi", "Mombasa",
    "Johannesburg", "Cape Town", "Pretoria", "Durban",
    "Addis Ababa",
    "Accra",
    "Casablanca", "Rabat", "Marrakech",
    "Algiers",
    "Tunis",
    "Tripoli",
    "Khartoum",
    "Dar es Salaam", "Dodoma",
    "Kampala",
    "Kinshasa",
    "Luanda",
    "Maputo",
    "Harare",
    "Lusaka",
    "Windhoek",
    "Gaborone",
    "Antananarivo",
    "Dakar",
    "Abidjan", "Yamoussoukro",
    "Bamako",
    "Ouagadougou",
    "Niamey",
    "Conakry",
    "Freetown",
    "Monrovia",
    "Lomé",
    "Cotonou", "Porto-Novo",
    "Libreville",
    "Douala", "Yaoundé",
    "Brazzaville",
    "Bangui",
    "N'Djamena",
    "Kigali",
    "Bujumbura", "Gitega",
    "Juba",
    "Mogadishu",
    "Asmara",
    "Djibouti",
    "Port Louis",
    "Victoria",

    // Oceania
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra",
    "Auckland", "Wellington", "Christchurch",
    "Suva",
    "Port Moresby",
    "Noumea",
    "Apia",
    "Nuku'alofa",
    "Honiara",
    "Port Vila",
    "Tarawa",
    "Majuro",
    "Palikir",
];

/** Combined list: Indonesian cities first, then world cities */
export const ALL_CITIES: string[] = [...INDONESIAN_CITIES, ...WORLD_CITIES];

/**
 * Check if a given place name matches any known city (case-insensitive exact match).
 * Returns true if the input matches any known city name.
 */
export function isValidCity(input: string): boolean {
    if (!input || input.trim().length === 0) return false;
    const normalized = input.trim().toLowerCase();
    return ALL_CITIES.some(city => city.toLowerCase() === normalized);
}

/**
 * @deprecated Use isValidCity instead
 */
export function isValidIndonesianCity(input: string): boolean {
    return isValidCity(input);
}

/**
 * Search cities that match a query (for autocomplete/suggestions).
 * Indonesian cities are shown first (prioritized), then world cities.
 */
export function searchCities(query: string, limit = 10): string[] {
    if (!query || query.trim().length === 0) return [];
    const normalized = query.trim().toLowerCase();

    // Indonesian cities first (more likely)
    const idMatches = INDONESIAN_CITIES.filter(city => city.toLowerCase().includes(normalized));
    // World cities second
    const worldMatches = WORLD_CITIES.filter(city => city.toLowerCase().includes(normalized));

    return [...idMatches, ...worldMatches].slice(0, limit);
}

/**
 * @deprecated Use searchCities instead
 */
export function searchIndonesianCities(query: string, limit = 10): string[] {
    return searchCities(query, limit);
}
