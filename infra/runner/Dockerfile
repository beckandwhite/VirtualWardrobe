FROM ubuntu:24.04

ARG RUNNER_VERSION=2.328.0
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        ca-certificates \
        curl \
        git \
        jq \
        libicu74 \
        libssl3t64 \
        libkrb5-3 \
        zlib1g \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash runner

WORKDIR /opt/actions-runner

RUN curl --fail --silent --show-error --location \
      "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" \
      --output runner.tar.gz \
    && tar --extract --gzip --file runner.tar.gz \
    && rm runner.tar.gz \
    && ./bin/installdependencies.sh \
    && chown --recursive runner:runner /opt/actions-runner

COPY --chown=runner:runner entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh

USER runner
ENV RUNNER_ALLOW_RUNASROOT=false \
    RUNNER_WORKDIR=/home/runner/_work

ENTRYPOINT ["/entrypoint.sh"]