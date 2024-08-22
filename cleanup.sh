
#!/bin/sh

if sudo docker images | grep -q web-scrapping-backend; then
      # Stop and remove any existing container if it exists
      if sudo docker ps -a | grep -q web-scrapping-backend; then
          sudo docker stop web-scrapping-backend || true
          sudo docker rm web-scrapping-backend || true

      # Remove the Docker image
      sudo docker rmi -f webscrapping/web-scrapping-backend || true
     fi
fi

if sudo docker images | grep -q web-scrapping-frontend; then
      # Stop and remove any existing container if it exists
      if sudo docker ps -a | grep -q web-scrapping-frontend; then
          sudo docker stop web-scrapping-frontend || true
          sudo docker rm web-scrapping-frontend || true

      # Remove the Docker image
      sudo docker rmi -f webscrapping/web-scrapping-frontend || true
     fi
fi
