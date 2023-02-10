docker build -t arturoalcaniz/mailer-service:$(npm pkg get version | tr -d '"') -f Dockerfile .. --network host
if [ "$1" ]
  then
    printf $1 | docker login --username arturoalcaniz --password-stdin
fi
docker push arturoalcaniz/mailer-service:$(npm pkg get version | tr -d '"')
