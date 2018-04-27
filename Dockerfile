from ubuntu

RUN apt-get update
RUN apt-get upgrade -y
RUN apt -y install vim
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get install -y nodejs
RUN apt-get install -y git
RUN git clone https://maratbunyatov:April2005@github.com/spotnetio/ui.git
RUN git clone https://maratbunyatov:April2005@github.com/spotnetio/spotter.git
RUN git clone https://maratbunyatov:April2005@github.com/spotnetio/contracts.git
RUN apt-get install -y build-essential
WORKDIR /ui
RUN npm install
WORKDIR /contracts
RUN npm install
WORKDIR /spotter
RUN npm install
ADD config /spotter/config

EXPOSE 8000
EXPOSE 3001
RUN mkdir /logs
VOLUME ["/logs"]

#RUN npm run start > /logs/spotter.log
#RUN cd ../ui
#RUN python -m SimpleHTTPServer > /logs/ui.log

CMD /bin/bash

# docker run -i -t -p 8000:8000 -p 3001:3001 --entrypoint /bin/bash 186166c8e71c