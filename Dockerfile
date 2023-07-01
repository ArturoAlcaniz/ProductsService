FROM arturoalcaniz/node-image:latest
RUN --mount=type=secret,id=env \
    git clone "https://$(grep TOKEN_GIT /run/secrets/env | cut -d'=' -f 2-)@github.com/ArturoAlcaniz/ProductsService.git" /app/ProductsService/ && \
    git clone "https://$(grep TOKEN_GIT /run/secrets/env | cut -d'=' -f 2-)@github.com/ArturoAlcaniz/entities-lib.git" /app/entities-lib/ && \
    git clone "https://$(grep TOKEN_GIT /run/secrets/env | cut -d'=' -f 2-)@github.com/ArturoAlcaniz/config-lib.git" /app/config-lib/ && \
    git clone "https://$(grep TOKEN_GIT /run/secrets/env | cut -d'=' -f 2-)@github.com/ArturoAlcaniz/certs.git" /app/certs/
RUN chown -R node:node /app/ProductsService /app/entities-lib /app/config-lib /app/certs
RUN chmod -R 755 /app/ProductsService /app/entities-lib /app/config-lib /app/certs
USER node
EXPOSE 3023