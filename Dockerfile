FROM oven/bun
RUN apt update && \
    apt install -y curl && \
    curl -fsSL https://get.docker.com/ | sh
COPY dist/daemon.js /index.ts
WORKDIR /
CMD bun /index.ts
