const { chromium } = require('playwright');

const getOferta = async (url, selector, tituloTxt, precioAnteriorTxt, precioFinalTxt, imagenTxt, ofertaTxt, linkTxt) => {
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
            imagen: item.querySelector(imagenTxt)?.src,
            oferta: item.querySelector(ofertaTxt)?.textContent.trim() || 'NO OFERTA',
            link: item.querySelector(linkTxt)?.href || item.href, 
          }));
        },
        { selector, tituloTxt, precioAnteriorTxt, precioFinalTxt, imagenTxt, ofertaTxt, linkTxt }
    );

    // Filtrar elementos cuya oferta no sea "NO OFERTA"
    const filteredGames = games.filter(game => game.oferta !== 'NO OFERTA');

    console.log(`Se encontraron ${filteredGames.length} juegos con oferta.`);
    return filteredGames;

  } catch (error) {
    console.error('Error durante el scraping:', error);
    return [];

  } finally {
    await browser.close();
  }
};

const getSteam = async () => {
  return getOferta(
    'https://store.steampowered.com/', // LINK
    '.tab_item', // NOMBRE
    '.tab_item_name', // SECCION DEL JUEGO
    '.discount_original_price', // PRECIO SIN OFERTA
    '.discount_final_price', // PRECIO CON OFERTA
    '.tab_item_cap_img', // IMAGEN
    '.discount_pct', // PORCENTAJE DE DESCUENTO
  );
};

const getEneba = async () => {
    let games = getOferta(
      'https://www.eneba.com/promo/cheap-games?itm_source=eneba&itm_medium=navigation&itm_campaign=cheap_games', // LINK
      '.pFaGHa', // SECCION DEL JUEGO
      '.YLosEL', // NOMBRE 
      '.bmxuMu', // PRECIO SIN OFERTA
      '.DTv7Ag', // PRECIO CON OFERTA
      '.LBwiWP', // IMAGEN
      '.PIG8fA', // PORCENTAJE DE DESCUENTO   // NOTA QUITAR EL TEXTO "SAVE 95%" Y DEJAR SOLO EL NUMERO
      '.GZjXOw'  // LINK
    );
    // games = games.map(game => {
    //   game.precioAnterior = game.precioAnterior.replace('Save', '');
    //   return game;
    // });

    return games;
};

const getGog = async () => {
    let games = getOferta(
      'https://www.gog.com/en/games', // LINK
      '.', // SECCION DEL JUEGO
      '.', // NOMBRE 
      '.', // PRECIO SIN OFERTA
      '.', // PRECIO CON OFERTA
      '.', // IMAGEN
      '.', // PORCENTAJE DE DESCUENTO   // NOTA QUITAR EL TEXTO "SAVE 95%" Y DEJAR SOLO EL NUMERO
      '.'  // LINK
    );
    return games;
};

const getEpic = async () => {
    let games = getOferta(
      'https://store.epicgames.com/es-ES/browse?sortBy=releaseDate&sortDir=DESC&priceTier=tierDiscouted&category=Game&count=40&start=0', // LINK
      '.', // SECCION DEL JUEGO
      '.', // NOMBRE 
      '.', // PRECIO SIN OFERTA
      '.', // PRECIO CON OFERTA
      '.', // IMAGEN
      '.', // PORCENTAJE DE DESCUENTO   // NOTA QUITAR EL TEXTO "SAVE 95%" Y DEJAR SOLO EL NUMERO
      '.'  // LINK
    );
    return games;
};
  

module.exports = { getSteam, getEneba, getGog, getEpic };
