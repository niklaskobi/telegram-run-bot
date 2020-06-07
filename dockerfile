FROM node:12-alpine

ENV UID=2000
ENV GUID=2000

RUN deluser node
RUN adduser -u $UID -D runbot

USER runbot
RUN mkdir -p /home/runbot/data

WORKDIR /home/runbot
COPY . .

RUN npm install

EXPOSE 30000
CMD ["node", "/home/runbot/app.js"]