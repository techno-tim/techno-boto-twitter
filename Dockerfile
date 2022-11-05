FROM node:18.12.1-alpine

WORKDIR /opt/app
COPY . /opt/app/
RUN chown -R node:node .
USER node
ENV NODE_ENV production
CMD [ "node", "."]
