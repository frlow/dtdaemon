FROM oven/bun
RUN apt update && \
    apt install -y curl && \
    curl -fsSL https://get.docker.com/ | sh
COPY dist/cli.js /index.js
WORKDIR /
CMD bash -c "bun index.js"
