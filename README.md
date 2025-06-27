# Introduction
The gateway service, entry point of backend services

# Setup
## Local lab
### Infrastructure
Starting up system infrastructure
```sh
cd infra-specs # Clone if not already
docker-compose -f k8s/local/docker-compose.yml up --force-recreate # Create up all system infrastructures
```
### Service
Precondition: `config-service`, `discovery-service`  
Starting up the `user-service`
```sh
cd gateway-service
npm install # Install libraries
npm start # Start the service
```
