DOCKER_BUILDKIT=1 docker build --no-cache --secret id=env,src=.env -t arturoalcaniz/products-service:latest -t arturoalcaniz/products-service:$(npm pkg get version | tr -d '"') -f Dockerfile ..
if [ "$1" ]
  then
    printf $1 | docker login --username arturoalcaniz --password-stdin
fi
docker push arturoalcaniz/products-service:$(npm pkg get version | tr -d '"')
docker push arturoalcaniz/products-service:latest
