#base-image for arm with node
FROM resin/rpi-raspbian:jessie

#Install dependencies
RUN apt-get update && apt-get install -yq --no-install-recommends \
		nano \
		git \
		apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    libssl-dev

# update the repository sources list
# and install dependencies
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

# confirm installation
RUN node -v
RUN npm -v

# add alias for ll
RUN echo "alias ll='ls -lG'" >> /root/.bashrc

RUN mkdir -p /root/workspace
WORKDIR /root/workspace

RUN git clone git@github.com:chenosaurus/fpvio-timer.git \
  && cd fpvio-timer \
  && npm install


ARG RTK_ENGINE_VERSION=v1.1.3
RUN git clone  -b $RTK_ENGINE_VERSION --single-branch git@github.com:Skycatch/rtk-engine.git --depth 1 \
    && cd rtk-engine \
    && npm --verbose install -g .

CMD ["npm", "start"]
