FROM node:20-alpine

WORKDIR /app

# Same approach as the dashboard: install from the committed pnpm lockfile.
RUN npm install -g pnpm@10.33.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# NEXT_PUBLIC_* values are baked into the browser bundle at build time.
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_MINIO_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MINIO_URL=$NEXT_PUBLIC_MINIO_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
