FROM golang:1.23


WORKDIR /app 

COPY go.mod .

RUN go mod download

COPY ./ .


CMD [ "go", "run", "main.go" ]