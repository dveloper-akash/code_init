FROM golang:1.22-alpine

RUN apk add --no-cache \
    git \
    build-base \
    curl

WORKDIR /workspace

RUN adduser -D sandbox
USER sandbox

CMD ["sh"]
