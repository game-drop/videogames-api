const fs = require('fs');
const path = require('path');
const { scrapearTienda, medirTiempoEjecucion } = require('./scraping');

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
        nombreTienda: 'steam',
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
        nombreTienda: 'eneba',
        detalles: {
          desarrollador: '.eRDpjp',
          fechaLanzamiento: '.eRDpjp',
          descripcion: '.tq3wly',
          imagen: '.OlZQ6u',
        },
      },
    },
};

// Función para scrapear Steam
const getSteam = async () => {
  try {

    let juegos = await medirTiempoEjecucion(() => scrapearTienda(configuracionesTiendas.steam));

     // Filtros
     juegos = juegos.map(juego => ({
        ...juego,
        imagen: juego.imagenInterna || juego.imagenExterna || juego.imagen || ''
      }));

      
    return juegos;

  } catch (error) {
    console.error('Error en getSteam:', error);
    return [];
  }
};

// Función para scrapear Eneba
const getEneba = async () => {
  try {

    let juegos = await medirTiempoEjecucion(() => scrapearTienda(configuracionesTiendas.eneba));

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

      
    return juegos;
  } catch (error) {
    console.error('Error en getEneba:', error);
    return [];
  }
};

// Función para guardar juegos en un archivo JSON
const guardarJuegosEnArchivo = async () => {
    console.log('Guardando juegos en juegos.json...');
    const steamGames = await getSteam();
     const enebaGames = await getEneba();
    const allGames = [...steamGames, ...enebaGames];
    fs.writeFileSync(path.join(__dirname, 'juegos.json'), JSON.stringify(allGames, null, 2));
    console.log('Juegos guardados en juegos.json');
};

// Ejecutar la función inmediatamente al iniciar la app
guardarJuegosEnArchivo();
// Ejecutar la función periódicamente (por ejemplo, cada hora)
setInterval(guardarJuegosEnArchivo, 3600000);

module.exports = { getSteam, getEneba };
