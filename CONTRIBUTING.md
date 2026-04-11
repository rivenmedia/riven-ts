# Contributing

## Running

### Setup development environment

1. Install `pnpm`,

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

_Restart shell / source the shell config file to make `pnpm` command available._

2. Install lts node & npm,

```bash
pnpm env use --global lts
```

3. Install turbo globally (optional, but recommended),

```bash
pnpm add turbo --global
```

4. Make sure fuse-related deps are installed. These deps can differ based on the distribution you are using.
   You need to have `libfuse.so.2` installed. For example,

```bash
# Ubuntu

sudo apt install fuse3

# Arch
sudo pacman -S fuse fuse3
```

5. Edit the `/etc/fuse.conf` file, and uncomment the line `user_allow_other` (remove the `#` at the beginning of the line).

```bash
sudo nano /etc/fuse.conf

# Uncomment the following line
#user_allow_other
```

> [!IMPORTANT]  
> For WSL users, you need to make the root (/) directory to be mounnted with rshared propagation. You can do this by running once each time you start WSL:
>
> ```bash
> sudo mount --make-rshared /
> ```
>
> Or you can make a service file which does this for you automatically:
> `sudo nano /etc/systemd/system/mount-root-rshared.service`
>
> ```bash
> [Unit]
> Description=Remount / with shared propagation
> Requires=-.mount
> After=-.mount
>
> [Service]
> Type=oneshot
> ExecStart=/bin/mount --make-rshared /
>
> [Install]
> WantedBy=local-fs.target
> ```
>
> Source: 3.1 https://wiki.archlinux.org/title/Install_Arch_Linux_on_WSL

_Reboot your system after the above steps to make sure all the changes take effect._

### Running the project

To run the project, you first need to setup the .env files. Each folder in `apps` has its own `.env.<name>` file, you can copy the `.env.<name>.example` file to `.env.<name>` and fill in the values. Similarly, some of the packages in `packages` also have their own `.env` files, you can do the same for them.

You need to make the `/mnt/riven` directory too, and `sudo chown -R 1000:1000 /mnt/riven`. Also if running `seerr`, it needs the folder perm to be set,

```bash
mkdir -p packages/plugin-seerr/docker-data/seerr
sudo chown -R 1000:1000 packages/plugin-seerr/docker-data
```

After setting up the `.env` files, you need to do a one-time schema generation for different services,

```bash
turbo generate-schemas
```

Then, you can start the different services required,

```bash
docker compose --profile all down && docker compose --profile services up -d && docker compose --profile analytics up -d
```

This will run the services & analytics:

- bull-board: Dashboard for monitoring the queues - http://localhost:4000
- spotlight: Logging service - http://localhost:8969
- postgres,redis
- stremthru
- seerr: for requesting media - http://localhost:5055
- plex: media server - http://localhost:32400

Then, you can start the riven app in dev mode,

```bash
pnpm --filter @repo/riven dev
```

If everything works, you should see a bunch of logs, else you can check for errors on http://localhost:8969.

Also for dev, it's recommended to enable these env in `.env.riven`

```bash
# Clear Redis cache on startup
RIVEN_SETTING__unsafeWipeRedisOnStartup=true

# Wipe database on startup
RIVEN_SETTING__unsafeWipeDatabaseOnStartup=true
```
