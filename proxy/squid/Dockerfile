FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    squid python3 python3-requests \
  && rm -rf /var/lib/apt/lists/*

COPY squid.conf.template /etc/squid/squid.conf.template
COPY basic_auth_helper.py /usr/local/bin/basic_auth_helper.py
COPY ext_ip_helper.py /usr/local/bin/ext_ip_helper.py
COPY ext_dest_helper.py /usr/local/bin/ext_dest_helper.py
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/basic_auth_helper.py /usr/local/bin/ext_ip_helper.py /usr/local/bin/ext_dest_helper.py /usr/local/bin/entrypoint.sh

EXPOSE 3128

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
