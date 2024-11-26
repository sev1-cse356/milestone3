sudo docker compose down
sudo docker compose up --build -d
sudo docker compose exec express node init.js
sudo docker compose logs -f