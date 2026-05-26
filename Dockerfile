FROM ubuntu:22.04

RUN apt update && apt install -y \
    curl \
    nodejs \
    npm \
    bash

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]