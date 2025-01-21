# Usa la imagen oficial de Node.js como base
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Instala Playwright y los navegadores necesarios
RUN npx playwright install --with-deps

# Copia el resto del código de tu proyecto
COPY . .

# Expone el puerto que tu servidor utiliza
EXPOSE 3000

# Comando por defecto para iniciar el servidor
CMD ["node", "server.js"]