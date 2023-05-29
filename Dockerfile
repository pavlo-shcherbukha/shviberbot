FROM registry.access.redhat.com/ubi8/nodejs-14
USER 0

COPY . /tmp/src

RUN /usr/bin/fix-permissions /tmp/src
USER 1001

# Install the dependencies
RUN /usr/libexec/s2i/assemble
##EXPOSE 8080

# Set the default command for the resulting image
CMD /usr/libexec/s2i/run
