FROM node:18-bullseye

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Configure apt and install packages
RUN apt-get update \
    && apt-get -y install --no-install-recommends apt-utils dialog 2>&1 \
    # Install additional dependencies
    && apt-get -y install git procps lsb-release wget ca-certificates \
    # For Cypress dependencies
    && apt-get -y install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb \
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Switch back to dialog for any ad-hoc use of apt-get
ENV DEBIAN_FRONTEND=dialog

# Set up user
RUN mkdir -p /home/node/workspace
WORKDIR /workspace

# Expose ports
EXPOSE 3000 3001

# Set node to path
ENV PATH /usr/local/share/npm-global/bin:$PATH