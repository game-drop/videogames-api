// Importación dinámica de playwright
let chromium;
import('playwright').then(playwright => {
  chromium = playwright.chromium;
});

// Función de utilidad para esperar un tiempo determinado
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para medir el tiempo de ejecución de una función
const medirTiempoEjecucion = async (fn) => {

  const inicio = Date.now();
  const resultado = await fn();
  const tiempoEjecucion = ((Date.now() - inicio) / 1000).toFixed(2);
  console.log(`Tiempo de ejecución: ${tiempoEjecucion} segundos`);
  return resultado;

};

// Función principal de scraping
async function scrapearTienda(config) {

  const navegador = await chromium.launch({ headless: true });
  const pagina = await navegador.newPage();

  try {
    await pagina.goto(config.url, { timeout: 60000 });
    await pagina.waitForSelector(config.selectores.principal, { timeout: 10000 });

    let juegos = await pagina.evaluate(scrapearPaginaPrincipal, config.selectores);
    console.log(`Se encontraron ${juegos.length} juegos CON DESCUENTO.`);

    const juegosDetallados = await Promise.all(
      juegos.map(juego => scrapearDetallesJuego(navegador, juego, config.selectores.detalles))
    );

    const juegosFinal = limpiarJuegos(eliminarDuplicados(juegosDetallados));
    console.log(`La lista final contiene ${juegosFinal.length} juegos FINALES.`);

    return juegosFinal;
  } finally {
    await navegador.close();
  }

}

// Función para scrapear la página principal
async function scrapearPaginaPrincipal(selectores) {

  const NUM_MAX_JUEGOS = 24;

  let juegos = [];
  let numeroIntentos = 0;

  // Bucle para asegurar que se obtienen exactamente 24 juegos con descuento
  while (juegos.length < NUM_MAX_JUEGOS && numeroIntentos < 5) { // Limite de intentos para evitar bucles infinitos
    numeroIntentos++;

    // Obtener los primeros juegos disponibles con el selector y el filtro de nth-child
    const elementos = Array.from(
      document.querySelectorAll(`${selectores.principal}:nth-child(n+${juegos.length + 1}):nth-child(-n+${juegos.length + NUM_MAX_JUEGOS})`)
    );

    // Mapear los elementos a un array de juegos con sus datos
    const nuevosJuegos = elementos.map(elemento => {
      const precioOriginalText = elemento.querySelector(selectores.precioOriginal)?.textContent.trim();
      const precioFinalText = elemento.querySelector(selectores.precioFinal)?.textContent.trim();
      const descuentoText = elemento.querySelector(selectores.descuento)?.textContent.trim();

      return {
        titulo: elemento.querySelector(selectores.titulo)?.textContent.trim(),
        precioOriginal: precioOriginalText ? parseFloat(precioOriginalText.replace(/[^0-9,\.]/g, '').replace(',', '.')) : 0,
        precioFinal: precioFinalText ? parseFloat(precioFinalText.replace(/[^0-9,\.]/g, '').replace(',', '.')) : 0,
        imagenExterna: elemento.querySelector(selectores.imagen)?.src,
        descuento: descuentoText ? parseFloat(descuentoText.replace(/[^0-9,\.]/g, '').replace(',', '.')) : 0,      
        enlace: elemento.querySelector(selectores.enlace)?.href || elemento.href,
      };
    });

    // Filtrar los juegos que tienen descuento mayor a 0
    juegos = juegos.concat(nuevosJuegos.filter(juego => juego.descuento !== 0));

    // Si no hemos alcanzado los 24 juegos, obtenemos más
    if (juegos.length < NUM_MAX_JUEGOS) {
      console.log(`Se necesitan más juegos. Intentando obtener más elementos...`);
    }
  }

  // Si después de varios intentos no tenemos suficientes juegos, devolver solo los que se tienen
  if (juegos.length > NUM_MAX_JUEGOS) {
    juegos = juegos.slice(0, NUM_MAX_JUEGOS); // Limitar a 24 juegos como máximo
  }

  return juegos;
}

// Función para scrapear los detalles de un juego
async function scrapearDetallesJuego(navegador, juego, selectoresDetalles) {

  if (Object.keys(selectoresDetalles).length === 0) return juego;

  const pagina = await navegador.newPage();
  try {
    await pagina.goto(juego.enlace, { timeout: 60000 });
    await pagina.waitForSelector(Object.values(selectoresDetalles)[0], { timeout: 10000 });

    const detalles = await pagina.evaluate(extraerDetalles, selectoresDetalles);
    return { ...juego, ...detalles };
  } catch (error) {
    console.error(`Error al obtener detalles de ${juego.titulo}:`, error);
    return juego;
  } finally {
    await pagina.close();
  }

}

// Función para extraer detalles de la página
function extraerDetalles(selectores) {

  const detalles = {};
  for (const [clave, selector] of Object.entries(selectores)) {
    detalles[clave] = document.querySelector(selector)?.textContent.trim() || '';
  }
  detalles.imagenInterna = document.querySelector(selectores.imagen)?.src || '';
  return detalles;

}

// Función para eliminar juegos duplicados
function eliminarDuplicados(juegos) {

  const juegosUnicos = [];
  const titulosVistos = new Set();
  for (const juego of juegos) {
    if (!titulosVistos.has(juego.titulo)) {
      juegosUnicos.push(juego);
      titulosVistos.add(juego.titulo);
    }
  }
  return juegosUnicos;
}

// Funcoón para limpiar juegos
const limpiarJuegos = (juegos) => {
  const camposRequeridos = [
    "titulo",
    "precioOriginal",
    "precioFinal",
    "descuento",
    "enlace",
    "desarrollador",
    "fechaLanzamiento",
    "descripcion",
  ];

  return juegos.filter((juego) => {
    // Verificar que el objeto tenga todas las propiedades requeridas y que sus valores no sean nulos o vacíos
    return camposRequeridos.every(
      (campo) => juego.hasOwnProperty(campo) && juego[campo] !== null && juego[campo] !== ""
    );
  });
};

// Configuraciones de las tiendas
const configuracionesTiendas = {
  steam: {  // JUEGOS ILIMITADOS
    url: 'https://store.steampowered.com/search/?supportedlang=spanish&category1=998&specials=1&hidef2p=1&ndl=1',
    selectores: {
      principal: '.search_result_row',
      titulo: '.title',
      precioOriginal: '.discount_original_price',
      precioFinal: '.discount_final_price',
      descuento: '.discount_pct',
      enlace: '.search_result_row',
      imagen: null,
      detalles: {
        desarrollador: '#developers_list',
        fechaLanzamiento: '.release_date .date',
        descripcion: '.game_description_snippet',
        imagen: '.game_header_image_full',
      },
    },
  },
  eneba: {
    url: 'https://www.eneba.com/collection/cheap-games',
    selectores: {
      principal: '.pFaGHa',
      titulo: '.YLosEL',
      precioOriginal: '.bmxuMu',
      precioFinal: '.DTv7Ag',
      imagen: '.LBwiWP',
      descuento: '.PIG8fA',
      enlace: '.GZjXOw',
      detalles: {
        desarrollador: '.eRDpjp',
        fechaLanzamiento: '.eRDpjp',
        descripcion: '.tq3wly',
        imagen: '.OlZQ6u',
      },
    },
  },
};

// const configuracionesTiendas = {
//   steam: {
//     url: 'https://store.steampowered.com/',
//     selectores: {
//       principal: '.tab_item',
//       titulo: '.tab_item_name',
//       precioOriginal: '.discount_original_price',
//       precioFinal: '.discount_final_price',
//       descuento: '.discount_pct',
//       enlace: '.tab_item',
//       imagen: '.tab_item_cap_img',
//       detalles: {
//         desarrollador: '#developers_list',
//         fechaLanzamiento: '.release_date .date',
//         descripcion: '.game_description_snippet',
//         imagen: '.game_header_image_full',
//       },
//     },
//   },
//   eneba: {
//     url: 'https://www.eneba.com/promo/cheap-games?itm_source=eneba&itm_medium=navigation&itm_campaign=cheap_games',
//     selectores: {
//       principal: '.pFaGHa',
//       titulo: '.YLosEL',
//       precioOriginal: '.bmxuMu',
//       precioFinal: '.DTv7Ag',
//       imagen: '.LBwiWP',
//       descuento: '.PIG8fA',
//       enlace: '.GZjXOw',
//       detalles: {
//         desarrollador: '.eRDpjp',
//         fechaLanzamiento: '.eRDpjp',
//         descripcion: '.tq3wly',
//         imagen: '.OlZQ6u',
//       },
//     },
//   },
// };

// Funciones específicas para cada tienda
const getSteam = async () => {
  try {
    // Llamada
    let juegos = await medirTiempoEjecucion(() => scrapearTienda(configuracionesTiendas.steam));

    // Asegurarse de que juegos sea un array
    if (!Array.isArray(juegos)) {
      console.error('Error: juegos no es un array');
      juegos = [];
    }

    // Filtros
    juegos = juegos.map(juego => ({
      ...juego,
      imagen: juego.imagenInterna || juego.imagenExterna || juego.imagen || ''
    }));

    // Retorno
    return juegos;
  } catch (error) {
    console.error('Error en getSteam:', error);
    return [];
  }
};

const getEneba = async () => {

  try {
    // Llamada
    let juegos = await medirTiempoEjecucion(() => scrapearTienda(configuracionesTiendas.eneba));

    // Asegurarse de que juegos sea un array
    if (!Array.isArray(juegos)) {
      console.error('Error: juegos no es un array');
      juegos = [];
    }

    // Filtros
    juegos = juegos.map(juego => {
      // Extraer desarrollador y fecha de lanzamiento con validación
      const developerMatch = juego.desarrollador.match(/Publisher(.*?)Developers/);
      const releaseDateMatch = juego.fechaLanzamiento.match(/Release date(.*?)Publisher/);
    
      juego.desarrollador = developerMatch ? developerMatch[1].trim() : '';
      juego.fechaLanzamiento = releaseDateMatch ? releaseDateMatch[1].trim() : '';
    
      // Selección de imagen
      juego.imagen = juego.imagenInterna || juego.imagenExterna || juego.imagen || '';
    
      return juego;
    });
    
    // Retorno
    return juegos;
  } catch (error) {
    console.error('Error en getEneba:', error);
    return [];
  }

};


// Exportamos las funciones para su uso en otros módulos
module.exports = { getSteam, getEneba };

