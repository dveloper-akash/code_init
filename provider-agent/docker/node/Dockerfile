FROM node:20-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Common packages
RUN npm install -g \
    typescript \
    ts-node \
    nodemon

RUN useradd -m sandbox
WORKDIR /workspace
USER sandbox

CMD ["bash"]
