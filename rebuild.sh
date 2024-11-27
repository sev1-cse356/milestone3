sudo docker compose down
sudo docker compose up --build --scale express=3 -d
sudo docker compose exec express node init.js
sudo docker compose logs -f