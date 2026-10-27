# Polar UI

This application is part of the Polar Bookshop system and provides the frontend functionality. It's part of the project built in the [Cloud Native Spring in Action](https://www.manning.com/books/cloud-native-spring-in-action) book by [Thomas Vitale](https://www.thomasvitale.com).

## About this fork

This is a fork of [PolarBookshop/polar-ui](https://github.com/PolarBookshop/polar-ui), used by
[mikkosuonio-ai/cloud-native-spring-in-action](https://github.com/mikkosuonio-ai/cloud-native-spring-in-action),
which tests it as part of the whole system.

Differences from the original:
- The image is built with `paketobuildpacks/builder-jammy-base` (Ubuntu 22.04), pinned to a
  version, instead of the deprecated `paketobuildpacks/builder:base` (Ubuntu 18.04). Its nginx
  runs as a user who can't write to `/workspace`, so `nginx/nginx.conf` puts nginx's temporary
  files in the buildpack's `{{ tempDir }}`.
- The workflow publishes the image as `ghcr.io/mikkosuonio-ai/polar-ui`: `sha-<commit>` for
  each push to `mikkosuonio/development`, and the tag's name for each `v*` tag.

## Instructions

Run the following command to build the project.

```shell
./gradlew buildAngular
```

Then, package it in an NGINX container using the [pack](https://buildpacks.io/docs/tools/pack/)
CLI and the Paketo Buildpacks. Use the builder version in `.github/workflows/commit-stage.yml`.

```shell
pack build polar-ui \
  --builder paketobuildpacks/builder-jammy-base:0.4.673 \
  --buildpack paketo-buildpacks/nginx \
  --path dist
```

`pack` uses Docker by default. To use Podman instead, start Podman's Docker-compatible API
socket and point `pack` at it:

```shell
systemctl --user start podman.socket
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock
pack build polar-ui \
  --builder paketobuildpacks/builder-jammy-base:0.4.673 \
  --buildpack paketo-buildpacks/nginx \
  --path dist \
  --docker-host=inherit
```

Finally, you can run the container as follows. The image has no default port, so `PORT` is
required.

```shell
docker run -d --name polar-ui --publish 9004:9004 --env PORT=9004 polar-ui
podman run -d --name polar-ui --publish 9004:9004 --env PORT=9004 polar-ui
```
