FROM oven/bun
COPY dist/cli.js /index.js
WORKDIR /
CMD bun index.js
