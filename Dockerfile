FROM node:20-slim

# Configuración de idioma a Español y dependencias base para Chromium Headless/xvfb
RUN apt-get update && apt-get install -y --no-install-recommends \
    locales \
    xvfb \
    xauth \
    && sed -i -e 's/# es_ES.UTF-8 UTF-8/es_ES.UTF-8 UTF-8/' /etc/locale.gen \
    && locale-gen \
    && rm -rf /var/lib/apt/lists/*

ENV LANG es_ES.UTF-8
ENV LANGUAGE es_ES:es
ENV LC_ALL es_ES.UTF-8

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración
COPY package*.json tsconfig.json pnpm-lock.yaml ./

# Instalación de dependencias
RUN npm install -g pnpm

# Evitamos que Playwright descargue todos los navegadores al hacer install
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm install --frozen-lockfile

# Instalamos únicamente Chromium y sus dependencias de sistema operativo asociadas
RUN npx playwright install --with-deps chromium

# Copia el código fuente
COPY src ./src

# Comando por defecto
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
CMD ["/bin/sh", "-c", "exec pnpm run start:docker:${NODE_ENV}"]