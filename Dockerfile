FROM node:20.18.1

WORKDIR /app

COPY . .

RUN npm install -g pnpm

RUN pnpm install

RUN npm run build

CMD ["node", "dist/application.js"]

EXPOSE 31071