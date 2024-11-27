FROM golang:1.23

WORKDIR /app/tmp
WORKDIR /app

RUN apt update && apt install -y ffmpeg

COPY go.mod .

RUN go mod download

COPY ./ .

RUN go build

CMD [ "./uploader" ]