# Stage 1: Download Fabric binaries and samples
FROM ubuntu:20.04 as fabric-builder

# Install dependencies
RUN apt-get update && apt-get install -y \
	curl \
	git \
	jq \
	wget

# Download Fabric binaries and samples
WORKDIR /fabric
RUN curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh | bash -s -- 2.5.9 1.5.12

# Stage 2: Final application image
FROM node:16

# Copy Fabric binaries from builder
COPY --from=fabric-builder /fabric/fabric-samples/bin /usr/local/bin
COPY --from=fabric-builder /fabric/fabric-samples/config /etc/hyperledger/fabric/config

# Create app directory
WORKDIR /usr/src/app

# Copy application source
COPY . .

# Install app dependencies
WORKDIR /usr/src/app/fabric-samples/asset-transfer-basic/application-javascript
RUN npm install

# Set environment variables
ENV PATH="/usr/local/bin:${PATH}"
ENV FABRIC_CFG_PATH=/etc/hyperledger/fabric/config

# Expose port
EXPOSE 3000

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
