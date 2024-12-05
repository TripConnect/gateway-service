FROM node:20.18.1

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

COPY ./src/services/graphql/schema.graphql dist/services/graphql/schema.graphql

CMD ["node", "dist/application.js"]

EXPOSE 31072
