FROM mcr.microsoft.com/playwright:v1.58.2-jammy

# Configuración de idioma a Español
RUN apt-get update && apt-get install -y locales \
    && sed -i -e 's/# es_ES.UTF-8 UTF-8/es_ES.UTF-8 UTF-8/' /etc/locale.gen \
    && locale-gen
ENV LANG es_ES.UTF-8
ENV LANGUAGE es_ES:es
ENV LC_ALL es_ES.UTF-8

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración
COPY package*.json tsconfig.json pnpm-lock.yaml ./

# Instalación de dependencias
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copia el código fuente
COPY src ./src

# Comando por defecto
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
CMD ["/bin/sh", "-c", "exec pnpm run start:docker:${NODE_ENV}"]