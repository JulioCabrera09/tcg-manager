import { NextRequest, NextResponse } from 'next/server';
import { ProductCategory } from '@/types/database';

export interface BarcodeLookupResult {
  barcode: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  image_url: string;
  description: string;
  suggested_price: number;
  cost_price?: number;
  source: 'curated' | 'open_food_facts';
}

// Curated list of instant-lookup products commonly sold in Mexican cardshops & gaming stores
const CURATED_MEXICAN_PRODUCTS: Record<string, Omit<BarcodeLookupResult, 'source'>> = {
  // --- SABRITAS & SNACKS ---
  '7501011115546': {
    barcode: '7501011115546',
    name: 'Papas Sabritas Original con Sal 45g',
    brand: 'Sabritas',
    category: 'snack',
    image_url: 'https://images.openfoodfacts.net/images/products/750/101/110/1678/front_es.24.400.jpg',
    description: 'Papas fritas con sal 45g. La botana clásica y crujiente de Sabritas.',
    suggested_price: 22.0,
    cost_price: 16.5,
  },
  '7501011101678': {
    barcode: '7501011101678',
    name: 'Papas Sabritas Limón 46g',
    brand: 'Sabritas',
    category: 'snack',
    image_url: 'https://images.openfoodfacts.net/images/products/750/101/110/1678/front_es.24.400.jpg',
    description: 'Papas fritas sabor chile y limón 46g.',
    suggested_price: 22.0,
    cost_price: 16.5,
  },
  '7501011133921': {
    barcode: '7501011133921',
    name: 'Papas Sabritas Adobadas 170g',
    brand: 'Sabritas',
    category: 'snack',
    image_url: 'https://images.openfoodfacts.net/images/products/750/101/113/3921/front_es.7.400.jpg',
    description: 'Papas fritas sabor adobo en bolsa familiar 170g.',
    suggested_price: 48.0,
    cost_price: 38.0,
  },
  '7501011143586': {
    barcode: '7501011143586',
    name: 'Cheetos Torciditos 58g',
    brand: 'Cheetos / Sabritas',
    category: 'snack',
    image_url: 'https://images.openfoodfacts.net/images/products/750/101/114/3586/front_es.36.400.jpg',
    description: 'Botana de maíz inflado con queso y chile en bolsa 58g.',
    suggested_price: 19.0,
    cost_price: 14.0,
  },
  '7501011123588': {
    barcode: '7501011123588',
    name: 'Doritos Nacho 62g',
    brand: 'Doritos / Sabritas',
    category: 'snack',
    image_url: 'https://images.openfoodfacts.net/images/products/750/101/112/3588/front_es.30.400.jpg',
    description: 'Totopos de maíz nixtamalizado con queso nacho.',
    suggested_price: 22.0,
    cost_price: 16.5,
  },
  '7501011173521': {
    barcode: '7501011173521',
    name: 'Tostitos Nachos 400g',
    brand: 'Tostitos',
    category: 'snack',
    image_url: 'https://images.openfoodfacts.net/images/products/750/101/117/3521/front_es.14.400.jpg',
    description: 'Totopos de maíz con sabor a queso nacho bolsa grande 400g.',
    suggested_price: 65.0,
    cost_price: 52.0,
  },
  '7501011135512': {
    barcode: '7501011135512',
    name: 'Tostitos Salsa Verde 240g',
    brand: 'Tostitos',
    category: 'snack',
    image_url: 'https://images.openfoodfacts.net/images/products/750/101/113/5512/front_en.25.400.jpg',
    description: 'Totopos de maíz con auténtica salsa verde y especias 240g.',
    suggested_price: 45.0,
    cost_price: 35.0,
  },
  '7501011114517': {
    barcode: '7501011114517',
    name: 'Rancheritos 160g',
    brand: 'Sabritas',
    category: 'snack',
    image_url: 'https://images.openfoodfacts.net/images/products/750/101/111/4517/front_en.4.400.jpg',
    description: 'Totopos de maíz sazonados al estilo ranchero.',
    suggested_price: 36.0,
    cost_price: 28.0,
  },
  '7501011116252': {
    barcode: '7501011116252',
    name: 'Fritos Sal y Limón 53g',
    brand: 'Sabritas',
    category: 'snack',
    image_url: 'https://images.openfoodfacts.net/images/products/750/101/111/6252/front_es.22.400.jpg',
    description: 'Tiras de maíz fritas con sal y limón.',
    suggested_price: 19.0,
    cost_price: 14.5,
  },

  // --- REFRESCOS & BEBIDAS (COCA-COLA & MÁS) ---
  '75007614': {
    barcode: '75007614',
    name: 'Coca-Cola Original 600ml',
    brand: 'Coca-Cola',
    category: 'beverage',
    image_url: 'https://images.openfoodfacts.net/images/products/000/007/500/7614/front_es.40.400.jpg',
    description: 'Refresco clásico en botella PET no retornable de 600 ml.',
    suggested_price: 20.0,
    cost_price: 15.0,
  },
  '7501055304745': {
    barcode: '7501055304745',
    name: 'Coca-Cola Original 3 Litros',
    brand: 'Coca-Cola',
    category: 'beverage',
    image_url: 'https://images.openfoodfacts.net/images/products/750/105/530/4745/front_es.28.400.jpg',
    description: 'Refresco familiar en botella PET no retornable de 3L.',
    suggested_price: 49.0,
    cost_price: 39.0,
  },
  '7501055320639': {
    barcode: '7501055320639',
    name: 'Coca-Cola Sin Azúcar 600ml',
    brand: 'Coca-Cola',
    category: 'beverage',
    image_url: 'https://images.openfoodfacts.net/images/products/750/105/532/0639/front_es.17.400.jpg',
    description: 'Refresco sin calorías ni azúcar en botella de 600 ml.',
    suggested_price: 20.0,
    cost_price: 15.0,
  },
  '7501055302925': {
    barcode: '7501055302925',
    name: 'Coca-Cola Original 2 Litros',
    brand: 'Coca-Cola',
    category: 'beverage',
    image_url: 'https://images.openfoodfacts.net/images/products/750/105/530/2925/front_es.27.400.jpg',
    description: 'Refresco en botella PET de 2 Litros.',
    suggested_price: 38.0,
    cost_price: 30.0,
  },
  '7501055313532': {
    barcode: '7501055313532',
    name: 'Coca-Cola Original 1.75 Litros',
    brand: 'Coca-Cola',
    category: 'beverage',
    image_url: 'https://images.openfoodfacts.net/images/products/750/105/531/3532/front_en.4.400.jpg',
    description: 'Refresco en botella PET de 1.75 Litros.',
    suggested_price: 34.0,
    cost_price: 26.0,
  },
  '7501055312345': {
    barcode: '7501055312345',
    name: 'Coca-Cola Original 600ml',
    brand: 'Coca-Cola',
    category: 'beverage',
    image_url: 'https://images.openfoodfacts.net/images/products/000/007/500/7614/front_es.40.400.jpg',
    description: 'Refresco frío en botella PET 600ml.',
    suggested_price: 20.0,
    cost_price: 15.0,
  },

  // --- TCG ACCESSORIES & CARDS ---
  '0820650853412': {
    barcode: '0820650853412',
    name: 'Booster Pack Pokémon: Chispas Fulgurantes',
    brand: 'The Pokémon Company',
    category: 'tcg_sealed',
    image_url: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500&auto=format&fit=crop&q=80',
    description: 'Sobre sellado oficial con 10 cartas en español de la expansión Escarlata y Púrpura.',
    suggested_price: 110.0,
    cost_price: 75.0,
  },
  '0744278453219': {
    barcode: '0744278453219',
    name: 'Micas Dragon Shield Matte Black (100 u)',
    brand: 'Dragon Shield',
    category: 'accessory',
    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
    description: 'Protectores de cartas estándar premium con textura mate para barajado suave.',
    suggested_price: 250.0,
    cost_price: 180.0,
  },
  '4005556274024': {
    barcode: '4005556274024',
    name: 'Deck Box Ultra Pro Pro-Dual Black',
    brand: 'Ultra Pro',
    category: 'accessory',
    image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    description: 'Caja portamazos con capacidad para 120 cartas en micas dobles.',
    suggested_price: 135.0,
    cost_price: 95.0,
  },
};

/**
 * Intelligent category detection from Open Food Facts categories string
 */
function inferCategory(categoriesStr: string, productName: string): ProductCategory {
  const text = `${categoriesStr} ${productName}`.toLowerCase();
  if (
    text.includes('soda') ||
    text.includes('refresco') ||
    text.includes('beverage') ||
    text.includes('boisson') ||
    text.includes('agua') ||
    text.includes('water') ||
    text.includes('juice') ||
    text.includes('jugo') ||
    text.includes('coca') ||
    text.includes('pepsi') ||
    text.includes('energy drink') ||
    text.includes('energizante')
  ) {
    return 'beverage';
  }
  return 'snack';
}

/**
 * Suggest a realistic Mexican retail price based on detected product size and category
 */
function calculateSuggestedPrice(name: string, quantity: string, category: ProductCategory): { suggested: number; cost: number } {
  const lower = `${name} ${quantity}`.toLowerCase();

  if (category === 'beverage') {
    if (lower.includes('3l') || lower.includes('3 l') || lower.includes('3000')) {
      return { suggested: 49.0, cost: 38.0 };
    }
    if (lower.includes('2l') || lower.includes('2.5') || lower.includes('2 l') || lower.includes('2000')) {
      return { suggested: 38.0, cost: 29.0 };
    }
    if (lower.includes('1.5') || lower.includes('1.75') || lower.includes('1l') || lower.includes('1 l')) {
      return { suggested: 28.0, cost: 21.0 };
    }
    if (lower.includes('energy') || lower.includes('monster') || lower.includes('red bull') || lower.includes('volt')) {
      return { suggested: 45.0, cost: 32.0 };
    }
    if (lower.includes('lata') || lower.includes('355')) {
      return { suggested: 18.0, cost: 13.0 };
    }
    return { suggested: 20.0, cost: 15.0 }; // Standard 600ml
  }

  // Snack / Botanas
  if (lower.includes('grande') || lower.includes('mega') || lower.includes('familiar') || lower.includes('400g') || lower.includes('240g') || lower.includes('200g')) {
    return { suggested: 55.0, cost: 42.0 };
  }
  if (lower.includes('comparte') || lower.includes('150g') || lower.includes('170g')) {
    return { suggested: 42.0, cost: 32.0 };
  }
  if (lower.includes('galleta') || lower.includes('emperador') || lower.includes('chokis') || lower.includes('oreo')) {
    return { suggested: 22.0, cost: 16.5 };
  }

  return { suggested: 22.0, cost: 16.5 }; // Standard individual bag ~45g-60g
}

/**
 * GET /api/products/barcode-lookup?barcode=7501011143586
 * Or GET /api/products/barcode-lookup?query=Sabritas
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const barcodeParam = searchParams.get('barcode')?.trim();
  const queryParam = searchParams.get('query')?.trim();

  // 1. Text Search Mode in Open Food Facts
  if (!barcodeParam && queryParam) {
    try {
      const searchUrl = `https://world.openfoodfacts.net/api/v2/search?search_terms=${encodeURIComponent(
        queryParam
      )}&countries_tags_en=mexico&fields=code,product_name,product_name_es,image_url,image_front_url,brands,quantity,categories&page_size=8`;

      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'TCGEcosystem-StoreManager/1.0 (contacto@tcgecosystem.com)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        const results: BarcodeLookupResult[] = [];

        if (Array.isArray(data.products)) {
          for (const p of data.products) {
            if (!p.code) continue;
            const name = p.product_name_es || p.product_name;
            if (!name) continue;
            const qty = p.quantity ? ` ${p.quantity}` : '';
            const fullName = name.toLowerCase().includes(p.quantity?.toLowerCase() || '---')
              ? name
              : `${name}${qty}`;
            const category = inferCategory(p.categories || '', fullName);
            const pricing = calculateSuggestedPrice(fullName, p.quantity || '', category);

            results.push({
              barcode: p.code,
              name: fullName,
              brand: p.brands || '',
              category,
              image_url: p.image_front_url || p.image_url || '',
              description: `Producto registrado en catálogo global: ${fullName}. Marca: ${p.brands || 'N/A'}.`,
              suggested_price: pricing.suggested,
              cost_price: pricing.cost,
              source: 'open_food_facts',
            });
          }
        }

        return NextResponse.json({
          success: true,
          query: queryParam,
          count: results.length,
          results,
        });
      }
    } catch {
      // Fallback below
    }

    // Filter curated by query if external API timed out
    const matchedCurated = Object.values(CURATED_MEXICAN_PRODUCTS).filter((item) =>
      item.name.toLowerCase().includes(queryParam.toLowerCase()) ||
      item.brand?.toLowerCase().includes(queryParam.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      query: queryParam,
      count: matchedCurated.length,
      results: matchedCurated.map((m) => ({ ...m, source: 'curated' as const })),
    });
  }

  // 2. Barcode Lookup Mode
  if (!barcodeParam) {
    return NextResponse.json(
      { error: 'Debes proporcionar un parámetro "barcode" o "query".' },
      { status: 400 }
    );
  }

  // Clean barcode: only digits
  const cleanBarcode = barcodeParam.replace(/[^0-9]/g, '');

  // Step A: Check local curated database for instant 0ms latency response
  if (CURATED_MEXICAN_PRODUCTS[cleanBarcode]) {
    const item = CURATED_MEXICAN_PRODUCTS[cleanBarcode];
    return NextResponse.json({
      found: true,
      source: 'curated',
      product: {
        ...item,
        source: 'curated',
      },
    });
  }

  // Also check without leading zero if 13 digits EAN starts with 0
  if (cleanBarcode.startsWith('0') && CURATED_MEXICAN_PRODUCTS[cleanBarcode.substring(1)]) {
    const item = CURATED_MEXICAN_PRODUCTS[cleanBarcode.substring(1)];
    return NextResponse.json({
      found: true,
      source: 'curated',
      product: {
        ...item,
        barcode: cleanBarcode,
        source: 'curated',
      },
    });
  }

  // Step B: Query Open Food Facts global database
  try {
    const offUrls = [
      `https://world.openfoodfacts.net/api/v2/product/${cleanBarcode}.json`,
      `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
    ];

    for (const url of offUrls) {
      try {
        const offRes = await fetch(url, {
          headers: {
            'User-Agent': 'TCGEcosystem-StoreManager/1.0 (contacto@tcgecosystem.com)',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(3500),
        });

        if (offRes.ok) {
          const offData = await offRes.json();
          if (offData && offData.status === 1 && offData.product) {
            const p = offData.product;
            const rawName = p.product_name_es || p.product_name || p.generic_name_es || p.generic_name;

            if (rawName) {
              const qty = p.quantity ? ` ${p.quantity}` : '';
              const cleanName = rawName.trim();
              const finalName = cleanName.toLowerCase().includes(p.quantity?.toLowerCase() || '---')
                ? cleanName
                : `${cleanName}${qty}`;

              const category = inferCategory(p.categories || '', finalName);
              const pricing = calculateSuggestedPrice(finalName, p.quantity || '', category);

              const image =
                p.image_front_url ||
                p.image_url ||
                p.selected_images?.front?.display?.es ||
                p.selected_images?.front?.display?.en ||
                '';

              const brand = p.brands || '';
              const description = `${finalName}. ${brand ? `Marca: ${brand}.` : ''} Categoría detectada en catálogo mundial: ${category === 'beverage' ? 'Bebidas & Refrescos' : 'Snacks & Alimentos'}.`;

              const product: BarcodeLookupResult = {
                barcode: cleanBarcode,
                name: finalName,
                brand,
                category,
                image_url: image,
                description,
                suggested_price: pricing.suggested,
                cost_price: pricing.cost,
                source: 'open_food_facts',
              };

              return NextResponse.json({
                found: true,
                source: 'open_food_facts',
                product,
              });
            }
          }
        }
      } catch {
        // Try next fallback URL
        continue;
      }
    }
  } catch (err: unknown) {
    console.error('Error fetching Open Food Facts:', err);
  }

  // Not found in Open Food Facts
  return NextResponse.json({
    found: false,
    barcode: cleanBarcode,
    message: 'Producto no encontrado en catálogo global. Puedes registrarlo manualmente.',
  });
}
