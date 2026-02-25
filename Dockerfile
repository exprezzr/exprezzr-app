# Usa la imagen oficial de Node.js
FROM node:20

# Crea el directorio de la aplicación
WORKDIR /usr/src/app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las librerías
RUN npm install

# Copia el resto del código de tu app de taxi
COPY . .

# Expone el puerto que usa Cloud Run
EXPOSE 8080

# Comando para arrancar tu app
CMD [ "npm", "start" ]