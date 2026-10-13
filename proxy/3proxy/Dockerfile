FROM alpine:3.19

RUN apk add --no-cache build-base git curl jq bash \
  && git clone --depth 1 --branch 0.9.5 https://github.com/z3APA3A/3proxy.git /tmp/3proxy \
  && cd /tmp/3proxy && make -f Makefile.Linux \
  && mkdir -p /usr/local/3proxy/bin /usr/local/3proxy/logs \
  && cp bin/3proxy /usr/local/3proxy/bin/ \
  && rm -rf /tmp/3proxy \
  && apk del build-base git

WORKDIR /usr/local/3proxy

COPY generate-config.sh /usr/local/3proxy/generate-config.sh
COPY 3proxy.cfg.template /usr/local/3proxy/3proxy.cfg.template
COPY entrypoint.sh /usr/local/3proxy/entrypoint.sh
RUN chmod +x /usr/local/3proxy/generate-config.sh /usr/local/3proxy/entrypoint.sh

EXPOSE 3128 1080

ENTRYPOINT ["/usr/local/3proxy/entrypoint.sh"]
