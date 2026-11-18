FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS build
# NEXT_PUBLIC_* values are inlined into the client bundle at build time,
# so they must be passed as build arguments, not only as runtime env.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_CPANEL_API_URL
ARG NEXT_PUBLIC_CPANEL_USERNAME
ARG NEXT_PUBLIC_CPANEL_API_TOKEN
ARG NEXT_PUBLIC_PUBLIC_DOMAIN
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL \
    NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    NEXT_PUBLIC_CPANEL_API_URL=$NEXT_PUBLIC_CPANEL_API_URL \
    NEXT_PUBLIC_CPANEL_USERNAME=$NEXT_PUBLIC_CPANEL_USERNAME \
    NEXT_PUBLIC_CPANEL_API_TOKEN=$NEXT_PUBLIC_CPANEL_API_TOKEN \
    NEXT_PUBLIC_PUBLIC_DOMAIN=$NEXT_PUBLIC_PUBLIC_DOMAIN \
    NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dev dependencies stay installed: `next start` needs typescript to load next.config.ts.
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/package.json /app/next.config.ts ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next ./.next
USER node
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start"]
