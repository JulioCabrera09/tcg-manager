import { NextRequest, NextResponse } from 'next/server';

// Common translations for popular Yu-Gi-Oh! cards in Spanish
const SPANISH_TO_ENGLISH: Record<string, string> = {
  'mago oscuro': 'Dark Magician',
  'dragon blanco de ojos azules': 'Blue-Eyes White Dragon',
  'dragón blanco de ojos azules': 'Blue-Eyes White Dragon',
  'chica maga oscura': 'Dark Magician Girl',
  'dragon negro de ojos rojos': 'Red-Eyes Black Dragon',
  'dragón negro de ojos rojos': 'Red-Eyes Black Dragon',
  'flor de ceniza': 'Ash Blossom & Joyous Spring',
  'flor de ceniza y primavera feliz': 'Ash Blossom & Joyous Spring',
  'exodia': 'Exodia the Forbidden One',
  'exodia el prohibido': 'Exodia the Forbidden One',
  'olla de la codicia': 'Pot of Greed',
  'fuerza de espejo': 'Mirror Force',
  'fuerza del espejo': 'Mirror Force',
  'monstruo renacido': 'Monster Reborn',
  'raigeki': 'Raigeki',
  'tributo torrencial': 'Torrential Tribute',
  'tributo a los condenados': 'Tribute to the Doomed',
  'polimerizacion': 'Polymerization',
  'polimerización': 'Polymerization',
  'tutan': 'Tutan Mask',
  'agujero oscuro': 'Dark Hole',
  'tifon del espacio mistico': 'Mystical Space Typhoon',
  'tifón del espacio místico': 'Mystical Space Typhoon',
  'kuriboh': 'Kuriboh',
  'slifer el dragon del cielo': 'Slifer the Sky Dragon',
  'obelisco el atormentador': 'Obelisk the Tormentor',
  'el dragon alado de ra': 'The Winged Dragon of Ra',
  'ciber dragon': 'Cyber Dragon',
  'ciber dragón': 'Cyber Dragon',
  'nibiru': 'Nibiru, the Primal Being',
  'nibiru el ser primordial': 'Nibiru, the Primal Being',
  'gota infinita': 'Infinite Impermanence',
  'impermanencia infinita': 'Infinite Impermanence',
  'droplet': 'Forbidden Droplet',
  'gotita prohibida': 'Forbidden Droplet',
  'juicio solemne': 'Solemn Judgment',
};

// Language detection from set code prefixes/infixes
function parseCardCode(rawCode: string): {
  baseSetCode: string;
  detectedLang: 'ES' | 'EN' | 'JA' | 'IT' | 'DE' | 'FR' | 'PT';
  normalizedCode: string;
} {
  const code = rawCode.trim().toUpperCase();

  // Pattern like: LOB-S001, LOB-SP001, LOB-ES001, RA01-ES005, MP23-ES012
  let detectedLang: 'ES' | 'EN' | 'JA' | 'IT' | 'DE' | 'FR' | 'PT' = 'EN';

  if (/-(ES|SP|S)\d+/i.test(code)) {
    detectedLang = 'ES';
  } else if (/-(JP|J|JA)\d+/i.test(code)) {
    detectedLang = 'JA';
  } else if (/-(IT|I)\d+/i.test(code)) {
    detectedLang = 'IT';
  } else if (/-(DE|G)\d+/i.test(code)) {
    detectedLang = 'DE';
  } else if (/-(FR|F)\d+/i.test(code)) {
    detectedLang = 'FR';
  } else if (/-(PT|P)\d+/i.test(code)) {
    detectedLang = 'PT';
  } else if (/-(EN|E)\d+/i.test(code)) {
    detectedLang = 'EN';
  }

  // Extract base set prefix before dash (e.g. LOB from LOB-S005)
  const parts = code.split('-');
  const baseSetCode = parts[0] || code;

  return {
    baseSetCode,
    detectedLang,
    normalizedCode: code,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim() || '';

  if (!query) {
    return NextResponse.json({ success: true, cards: [] });
  }

  try {
    let searchUrl = '';
    const { baseSetCode, detectedLang, normalizedCode } = parseCardCode(query);

    // 1. Check if the query is a card code (contains dash with letters and numbers, like LOB-S005)
    const isCodePattern = /^[A-Z0-9]{2,6}-[A-Z0-9]{2,6}$/i.test(query.trim());

    // 2. Check if query is in Spanish dictionary
    const lowerQuery = query.toLowerCase();
    const translatedName = SPANISH_TO_ENGLISH[lowerQuery];

    if (translatedName) {
      searchUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(
        translatedName
      )}`;
    } else if (isCodePattern) {
      // Search with cardset or fname using the set prefix
      searchUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(
        baseSetCode
      )}&num=15&offset=0`;
    } else if (/^\d{7,8}$/.test(query.trim())) {
      // Card Passcode / ID
      searchUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${encodeURIComponent(
        query.trim()
      )}`;
    } else {
      // Search by partial card name
      searchUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(
        query
      )}&num=12&offset=0`;
    }

    const res = await fetch(searchUrl, {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'TCG-Ecosystem-App/1.0',
      },
    });

    if (!res.ok) {
      // If code search returned nothing, fallback to searching by name
      if (isCodePattern) {
        // Try searching without the code dash
        const fallbackUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(
          query.split('-')[0]
        )}&num=10&offset=0`;
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return processApiData(fallbackData, detectedLang, normalizedCode);
        }
      }
      return NextResponse.json({ success: true, cards: [] });
    }

    const apiData = await res.json();
    return processApiData(apiData, detectedLang, normalizedCode);
  } catch (error: any) {
    console.error('Error fetching Yu-Gi-Oh! API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error en la búsqueda de cartas' },
      { status: 500 }
    );
  }
}

function processApiData(
  apiData: any,
  detectedLang: 'ES' | 'EN' | 'JA' | 'IT' | 'DE' | 'FR' | 'PT',
  cardCode: string
) {
  if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
    return NextResponse.json({ success: true, cards: [] });
  }

  const USD_TO_MXN = 20.0; // Current market conversion benchmark
  const EUR_TO_MXN = 21.5;

  const cards = apiData.data.slice(0, 12).map((item: any) => {
    const rawPrices = item.card_prices?.[0] || {};
    const tcgPriceUsd = parseFloat(rawPrices.tcgplayer_price || '0');
    const cardmarketPriceEur = parseFloat(rawPrices.cardmarket_price || '0');
    const ebayPriceUsd = parseFloat(rawPrices.ebay_price || '0');

    // Calculate market recommendation in MXN
    const benchmarkUsd = tcgPriceUsd > 0 ? tcgPriceUsd : ebayPriceUsd > 0 ? ebayPriceUsd : 1.0;
    const recommendedPriceMxn = Math.max(20, Math.round(benchmarkUsd * USD_TO_MXN));

    // Extract all available card sets & rarities for this card
    const cardSets = Array.isArray(item.card_sets)
      ? item.card_sets.map((s: any) => ({
          setName: s.set_name,
          setCode: s.set_code,
          rarity: s.set_rarity,
          rarityCode: s.set_rarity_code,
          priceUsd: parseFloat(s.set_price || '0'),
          priceMxn: Math.max(20, Math.round(parseFloat(s.set_price || '0') * USD_TO_MXN)),
        }))
      : [];

    const defaultSet = cardSets[0] || {
      setName: 'Colección Oficial Yu-Gi-Oh!',
      setCode: cardCode || 'TCG-YGO-PRO',
      rarity: 'Ultra Rare',
      priceMxn: recommendedPriceMxn,
    };

    // Bilingual title mapping
    const nameEn = item.name;
    // Simple reverse lookup for Spanish name if known
    let nameEs = nameEn;
    for (const [esKey, enVal] of Object.entries(SPANISH_TO_ENGLISH)) {
      if (enVal.toLowerCase() === nameEn.toLowerCase()) {
        nameEs = esKey
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        break;
      }
    }

    return {
      id: String(item.id),
      name_en: nameEn,
      name_es: nameEs,
      type: item.type,
      desc: item.desc,
      race: item.race,
      attribute: item.attribute,
      atk: item.atk,
      def: item.def,
      level: item.level,
      image_url:
        item.card_images?.[0]?.image_url ||
        `https://images.ygoprodeck.com/images/cards/${item.id}.jpg`,
      image_url_small:
        item.card_images?.[0]?.image_url_small ||
        `https://images.ygoprodeck.com/images/cards_small/${item.id}.jpg`,
      detected_language: detectedLang,
      card_code: cardCode || defaultSet.setCode,
      default_set_name: defaultSet.setName,
      default_rarity: defaultSet.rarity,
      recommended_price_mxn: recommendedPriceMxn,
      recommended_price_usd: benchmarkUsd,
      tcgplayer_price_usd: tcgPriceUsd,
      cardmarket_price_eur: cardmarketPriceEur,
      ebay_price_usd: ebayPriceUsd,
      available_sets: cardSets,
    };
  });

  return NextResponse.json({
    success: true,
    count: cards.length,
    cards,
  });
}
