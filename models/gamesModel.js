const { chromium } = require('playwright');

const getOferta = async (config) => {
  const {
    url,
    selector,
    tituloTxt,
    precioAnteriorTxt,
    precioFinalTxt,
    imagenTxt,
    ofertaTxt,
    linkTxt,
    detailSelectors,
  } = config;

  const startTime = Date.now(); // Registra el tiempo de inicio

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navegar a la página indicada
    await page.goto(url, { timeout: 60000 });

    // Esperar a que los elementos relevantes estén cargados en la página
    console.log(`Esperando el selector: ${selector}`);
    await page.waitForSelector(selector, { timeout: 10000 });

    // Extraer los datos con la lógica de extracción dentro de evaluate
    const games = await page.evaluate(
      ({ selector, tituloTxt, precioAnteriorTxt, precioFinalTxt, imagenTxt, ofertaTxt, linkTxt }) => {
        const items = Array.from(document.querySelectorAll(selector));

        return items.map(item => ({
          titulo: item.querySelector(tituloTxt)?.textContent.trim(),
          precioAnterior: item.querySelector(precioAnteriorTxt)?.textContent.trim() || 'NO OFERTA',
          precioFinal: item.querySelector(precioFinalTxt)?.textContent.trim(),
          imagen: item.querySelector(imagenTxt)?.src,  // Extrae la imagen de la lista
          oferta: item.querySelector(ofertaTxt)?.textContent.trim() || 'NO OFERTA',
          link: item.querySelector(linkTxt)?.href || item.href,
        }));
      },
      { selector, tituloTxt, precioAnteriorTxt, precioFinalTxt, imagenTxt, ofertaTxt, linkTxt }
    );

    // Filtrar elementos cuya oferta no sea "NO OFERTA"
    const filteredGames = games.filter(game => game.oferta !== 'NO OFERTA');

    console.log(`Se encontraron ${filteredGames.length} juegos con oferta.`);

    // Scrapeo adicional para cada link
    const detailedGames = [];
    for (const game of filteredGames) {
      if (Object.keys(detailSelectors).length > 0) {
        try {
          const detailPage = await browser.newPage();
          await detailPage.goto(game.link, { timeout: 60000 });
          await detailPage.waitForSelector(Object.values(detailSelectors)[0], { timeout: 10000 });

          const details = await detailPage.evaluate(
            ({ detailSelectors }) => {
              const detailsData = {};
              for (const [key, selector] of Object.entries(detailSelectors)) {
                detailsData[key] = document.querySelector(selector)?.textContent.trim();
              }
              // Intentar obtener la imagen desde los detalles, si existe
              const imagen = document.querySelector('.game_header_image_full')?.src;
              detailsData.imagen = imagen || ''; // Fallback a una cadena vacía si no se encuentra
              return detailsData;
            },
            { detailSelectors }
          );

          // Agregar datos detallados al juego
          detailedGames.push({
            ...game,
            ...details,
          });

          await detailPage.close();
        } catch (error) {
          console.error(`Error al obtener detalles de ${game.link}:`, error);
        }
      } else {
        detailedGames.push(game);
      }
    }

    // Eliminar objetos con nombres repetidos
    const uniqueGames = [];
    const seenTitles = new Set();

    for (const game of detailedGames) {
      if (!seenTitles.has(game.titulo)) {
        uniqueGames.push(game);
        seenTitles.add(game.titulo);
      }
    }

    console.log(`Lista final contiene ${uniqueGames.length} juegos únicos.`);
    const endTime = Date.now(); // Registra el tiempo final
    const executionTimeInSeconds = ((endTime - startTime) / 1000).toFixed(2); // Calcula el tiempo en segundos (con 2 decimales)
    console.log(`Tiempo de ejecución: ${executionTimeInSeconds} segundos`);

    return uniqueGames;

  } catch (error) {
    console.error('Error durante el scraping:', error);
    return [];
  } finally {
    await browser.close();
  }
};

const steamConfig = {
  url: 'https://store.steampowered.com/',
  selector: '.tab_item',
  tituloTxt: '.tab_item_name',
  precioAnteriorTxt: '.discount_original_price',
  precioFinalTxt: '.discount_final_price',
  ofertaTxt: '.discount_pct',
  linkTxt: '.tab_item',
  detailSelectors: {
    developer: '#developers_list',
    releaseDate: '.release_date .date',
    description: '.game_description_snippet',
    imagen: '.game_header_image_full',  
  },
};

const getSteam = async () => getOferta(steamConfig);

const enebaConfig = {
  url: 'https://www.eneba.com/promo/cheap-games?itm_source=eneba&itm_medium=navigation&itm_campaign=cheap_games',
  selector: '.pFaGHa',
  tituloTxt: '.YLosEL',
  precioAnteriorTxt: '.bmxuMu',
  precioFinalTxt: '.DTv7Ag',
  imagenTxt: '.LBwiWP img',
  ofertaTxt: '.PIG8fA',
  linkTxt: '.GZjXOw',
  detailSelectors: {
    developer: '#',
    releaseDate: '.',
    description: '.',
    imagen: '.',  
  },
};


const getEneba = async () => {
  let games = await getOferta(enebaConfig);
  return games.map(game => ({
    ...game,
    precioAnterior: game.precioAnterior.replace('Save', '').trim(),
  }));
};

const getGog = async () => {
  // Configuración básica para GOG
  // const gogConfig = {
  //   url: 'https://www.gog.com/en/games',
  //   selector: '.product-tile',
  //   tituloTxt: '.product-tile__title',
  //   precioAnteriorTxt: '.product-tile__price--old',
  //   precioFinalTxt: '.product-tile__price--new',
  //   imagenTxt: '.product-tile__image img',
  //   ofertaTxt: '.product-tile__discount',
  //   linkTxt: '.product-tile__link',
  //   detailSelectors: {},
  // };
  // return getOferta(gogConfig);
};

const getEpic = async () => {
  // Configuración básica para Epic Games
  // const epicConfig = {
  //   url: 'https://store.epicgames.com/en-US/browse?sortBy=releaseDate&sortDir=DESC&priceTier=tierDiscouted&category=Game&count=40&start=0',
  //   selector: '.css-1jx3eyg',
  //   tituloTxt: '.css-2ucwu',
  //   precioAnteriorTxt: '.css-2vawxz',
  //   precioFinalTxt: '.css-2ucwu',
  //   imagenTxt: '.css-1anx036 img',
  //   ofertaTxt: '.css-1jx3eyg .css-1nho2o4',
  //   linkTxt: '.css-1jx3eyg a',
  //   detailSelectors: {},
  // };
  // return getOferta(epicConfig);
};

module.exports = { getSteam, getEneba, getGog, getEpic };
