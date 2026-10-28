# CyberBook

Personal cybersecurity cheatsheets, built with [VitePress](https://vitepress.dev) and published as a static site.

Live site: [cyberbook.me](https://cyberbook.me)

## Usage

This content is for educational purposes and authorized security testing only (pentests, CTFs, lab environments). Do not use it against systems you don't own or lack explicit permission to test.

## Local development

```sh
npm install
npm run dev
```

Build and preview the production output:

```sh
npm run build
npm run preview
```

## Deployment

The site is built and served via Docker (see `Dockerfile`): a Node build stage compiles the VitePress site, then an Nginx stage serves the static output.

```sh
docker build -t cyberbook .
docker run -p 8080:80 cyberbook
```
