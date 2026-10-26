# Polar UI

This application is part of the Polar Bookshop system and provides the frontend functionality. It's part of the project built in the [Cloud Native Spring in Action](https://www.manning.com/books/cloud-native-spring-in-action) book by [Thomas Vitale](https://www.thomasvitale.com).

## About this fork

This is a fork of [PolarBookshop/polar-ui](https://github.com/PolarBookshop/polar-ui), used by
[mikkosuonio-ai/cloud-native-spring-in-action](https://github.com/mikkosuonio-ai/cloud-native-spring-in-action),
which tests it as part of the whole system.

Differences from the original:
- The image is built from `Dockerfile` (Node.js 16 to build the SPA, then unprivileged nginx
  to serve it) instead of with the Paketo nginx buildpack. `nginx/nginx.conf.template` is the
  nginx configuration, with the port taken from `PORT` (default 9004).
- The workflow publishes the image as `ghcr.io/mikkosuonio-ai/polar-ui`: `sha-<commit>` for
  each push to `mikkosuonio/development`, and the tag's name for each `v*` tag.

## Instructions

Run the following command to build the project.

```shell
./gradlew buildAngular
```

Then, build the image with Docker or Podman. The image's build stage builds the SPA too, so
the first step isn't needed for this.

```shell
docker build -t polar-ui .
podman build -t polar-ui .
```

Finally, you can run the container as follows.

```shell
docker run -d --name polar-ui --publish 9004:9004 polar-ui
podman run -d --name polar-ui --publish 9004:9004 polar-ui
```

It listens on port 9004. To use another port, set `PORT`, for example
`--env PORT=8080 --publish 8080:8080`.
