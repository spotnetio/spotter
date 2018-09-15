from ubuntu

RUN apt-get update
RUN apt-get upgrade -y
RUN apt -y install vim
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get install -y nodejs
RUN apt-get install -y git
RUN apt-get install -y build-essential
RUN npm install -g httpserver
ARG password
RUN echo "HELLO WORLD!!!!"
RUN git clone https://maratbunyatov:$password@github.com/spotnetio/ui.git
RUN git clone https://maratbunyatov:$password@github.com/spotnetio/spotter.git
RUN git clone https://maratbunyatov:$password@github.com/spotnetio/contracts.git
WORKDIR /ui
RUN npm install
WORKDIR /contracts
RUN npm install
WORKDIR /spotter
RUN npm install
ADD config /spotter/config
ADD bin /spotter/bin

RUN mkdir /logs
VOLUME ["/logs"]

CMD /spotter/bin/start.sh 

# docker build --build-arg password=<> . -t maratbunyatov/spotnet
# docker run -d --rm -p 3001:3001 -p 80:80 348196e38083
# docker run -d -i -t -p 80:80 -p 3001:3001 --entrypoint /bin/bash 186166c8e71c
# docker exec -it 2e09e889dde5 /bin/bash