sudo docker compose -f docker-compose.debug.yml down
sudo docker compose -f docker-compose.debug.yml up --remove-orphans --build -d
sudo docker compose exec express node init.js
sudo docker compose logs -f