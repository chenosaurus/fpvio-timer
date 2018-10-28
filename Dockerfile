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
    minicom \
    libssl-dev \
    openssh-client

# update the repository sources list
# and install dependencies
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

# confirm installation
RUN node -v
RUN npm -v

# add alias for ll
RUN echo "alias ll='ls -lG'" >> /root/.bashrc

RUN mkdir -p /root/fpvio-timer
RUN mkdir -p /root/.ssh


COPY package.json /root/fpvio-timer/
COPY index.js /root/fpvio-timer/

WORKDIR /root/fpvio-timer

RUN npm i

CMD ["npm", "start"]
