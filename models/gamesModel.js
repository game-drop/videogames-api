const { chromium } = require('playwright');

const getOferta = async (url, selector, tituloTxt, precioAnteriorTxt, precioFinalTxt, imagenTxt, ofertaTxt) => {
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
      ({ selector, tituloTxt, precioAnteriorTxt, precioFinalTxt, imagenTxt, ofertaTxt }) => {
        const items = Array.from(document.querySelectorAll(selector));

        return items.map(item => ({
          titulo: item.querySelector(tituloTxt)?.textContent.trim(),
          precioAnterior: item.querySelector(precioAnteriorTxt)?.textContent.trim() || 'NO OFERTA',
          precioFinal: item.querySelector(precioFinalTxt)?.textContent.trim(),
          imagen: item.querySelector(imagenTxt)?.src,
          oferta: item.querySelector(ofertaTxt)?.textContent.trim() || 'NO OFERTA',
          link: item.href,
        }));
      },
      { selector, tituloTxt, precioAnteriorTxt, precioFinalTxt, imagenTxt, ofertaTxt } // Pasar los argumentos aquí
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
    'https://store.steampowered.com/',
    '.tab_item',
    '.tab_item_name',
    '.discount_original_price',
    '.discount_final_price',
    '.tab_item_cap_img',
    '.discount_pct'
  );
};

module.exports = { getSteam };
