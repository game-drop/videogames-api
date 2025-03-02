// Importación dinámica de playwright
let chromium;
async function importarPlaywright() {
  if (!chromium) {
    const playwright = await import('playwright');
    chromium = playwright.chromium;
  }
}

// Función para medir el tiempo de ejecución de una función
const medirTiempoEjecucion = async (fn) => {
  const inicio = Date.now();
  const resultado = await fn();
  const tiempoEjecucion = ((Date.now() - inicio) / 1000).toFixed(2);
  console.log("\x1b[32m[TERMINADO]\x1b[0m Tiempo de ejecución: " + tiempoEjecucion + "s");
  return resultado;
};

// En el código principal, crea una sola instancia de navegador
async function scrapearTienda(config) {
  await importarPlaywright();  // Asegurarse de que se haya importado correctamente `playwright`
  const navegador = await chromium.launch({ headless: true }); // Lanza una sola instancia de navegador
  const pagina = await navegador.newPage();

  try {
    await pagina.goto(config.url, { timeout: aMili(5) });
    await pagina.waitForSelector(config.selectores.principal, { timeout: aMili(1) });

    let juegos = await pagina.evaluate(scrapearPaginaPrincipal, config.selectores);
    console.log("");
    console.log(`\x1b[33m[INICIANDO]\x1b[0m ${config.selectores.nombreTienda}`);
    console.log("\x1b[33m[INICIANDO]\x1b[0m Numero de juegos: " + juegos.length);
    console.log(` - [TERMINADO] Pagina principal terminada`);

    juegos = juegos.map(juego => ({
      ...juego,
      platform: config.selectores.nombreTienda || 'Desconocido',
      id: juego.titulo?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'sin-titulo',
    }));

    const juegosDetallados = await Promise.all(
      juegos.map(juego => scrapearDetallesJuego(navegador, juego, config.selectores.detalles))
    );

    const juegosFinal = limpiarJuegos(eliminarDuplicados(juegosDetallados));
    console.log(`\x1b[32m[TERMINADO]\x1b[0m Numero de juegos: ${juegosFinal.length}`);

    return juegosFinal;
  } finally {
    await navegador.close(); // Cerrar el navegador después de completar todo el scraping
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
      console.log("\x1b[31mNumero existen suficientes juegos\x1b[0m");
    }
  }

  // Si después de varios intentos no tenemos suficientes juegos, devolver solo los que se tienen
  if (juegos.length > NUM_MAX_JUEGOS) {
    juegos = juegos.slice(0, NUM_MAX_JUEGOS); // Limitar a 24 juegos como máximo
  }

  // Cerrar la página después de scrapear la página principal
  document.close();
  return juegos;
}



// Función para scrapear los detalles de un juego (optimizada)
async function scrapearDetallesJuego(navegador, juego, selectoresDetalles) {
  if (Object.keys(selectoresDetalles).length === 0) return juego;

  const pagina = await navegador.newPage();
  try {
    await pagina.goto(juego.enlace, { timeout: aMili(5) });
    await pagina.waitForSelector(Object.values(selectoresDetalles)[0], { timeout: aMili(1) });

    const detalles = await pagina.evaluate(extraerDetalles, selectoresDetalles);
    console.log(` - [TERMINADO] Se termino el juego: ${juego.titulo}`);

    return { ...juego, ...detalles };
  } catch (error) {
    console.error("\x1b[31m - [ERROR] Error al obtener detalles de " + juego.titulo + "\x1b[0m");
    console.error(error); // COMENTAR PARA TENERLO MAS LIMPITO                                        <-------- IMPORTANTE (PARA MI)
    return juego;
  } finally {
    // Cerrar la página después de obtener los detalles del juego
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

// Función para limpiar juegos
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

function aMili(segundos) {
  return segundos * 60000;
}

// Exportamos las funciones
module.exports = { scrapearTienda, medirTiempoEjecucion };