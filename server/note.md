Tao fondel: mkdir

Backup db: https://sectigostore.com/page/how-to-backup-mysql-database-on-linux-ubuntu/

backup db cmd: docker compose exec db mysqldump -u root -p poly_database > backup.sql

Lay file from server: ssh host 'cat /path/on/remote' > /path/on/local

Tạo ssl: https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal

Install nginx: https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04#step-5-setting-up-server-blocks-recommended

sudo nano /etc/nginx/sites-available/default
sudo systemctl reload nginx
sudo nginx -t

sudo chmod 666 /var/run/docker.sock
sudo docker compose -f docker-compose-prod.yml down swagger-ui-v2

Tạo Snap file

# Check current swap existence

sudo swapon -s

# if not only show header like:

# Filename Type Size Used Priority

# Check disk available space

df -h

# Create empty file with size 2GB

sudo dd if=/dev/zero of=/swapfile bs=1M count=2048

# Check file

ls -lh /swapfile

# Secure by locking permissions

sudo chmod 600 /swapfile
ls -lh /swapfile # re-check

# Tell the system to create a swap space

sudo mkswap /swapfile

# Establis to use

sudo swapon /swapfile
sudo swapon -s # Check
free -m # Check again

# Make the Swap File Permanent

echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

- Specify "swappiness" to indicate how ofen you want system swap data from RAM to swap space. It's about 60 (60%) for small memory 512 MB seem OK

# Check

cat /proc/sys/vm/swappiness

# Update

sudo sysctl vm.swappiness=30

- Specify "vfs_cache_pressure": This setting configures how much the system will choose to cache inode and dentry information over other data. Default is 100. Just let it as that

# Check

cat /proc/sys/vm/vfs_cache_pressure

# update

sudo sysctl vm.vfs_cache_pressure=50

Cài nginx

https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04
