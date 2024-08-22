#!/bin/bash

# Log in to Docker Hub
#echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin

# Build and push Docker image
cd backend
sudo docker build --no-cache -t webscrapping/web-scrapping-backend .
sudo docker push "webscrapping/web-scrapping-backend:latest"
cd ..

cd frontend
sudo docker build --no-cache -t webscrapping/web-scrapping-frontend .
sudo docker push "webscrapping/web-scrapping-frontend:latest"
cd ..


# Log out from Docker Hub (optional)
#docker logout
