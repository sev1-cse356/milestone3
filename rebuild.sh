sudo docker compose down
sudo docker compose up --remove-orphans --build --scale express=1 -d
sudo docker compose exec express node init.js
sudo docker compose logs -f