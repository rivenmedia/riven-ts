# Contributing

## Running

### Setup development environment

Install `pnpm`,

```
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

_Restart shell / source the shell config file to make `pnpm` command available._

Then, install lts node & npm,

```
pnpm env use --global lts
```

Then, install turbo globally (optional, but recommended),

```
pnpm add turbo --global
```

Then, you need to make sure fuse related deps are installed. These deps can differ based on the distribution you are using.
You need to have `libfuse.so.2` installed. For example,

```
# Ubuntu

sudo apt install fuse3

# Arch
sudo pacman -S fuse fuse3
```

Then, edit the `/etc/fuse.conf` file, and uncomment the line `user_allow_other` (remove the `#` at the beginning of the line).

```
sudo nano /etc/fuse.conf

# Uncomment the following line
#user_allow_other
```

> [!IMPORTANT]  
> For WSL users, you need to make the root (/) directory to be mounnted with rshared propagation. You can do this by running once each time you start WSL:
>
> ```
> sudo mount --make-rshared /
> ```
>
> Or you can make a service file which does this for you automatically:
> `sudo nano /etc/systemd/system/mount-root-rshared.service`
>
> ```
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

_Reboot your system after the above steps to make sure all the changes take effect._

### Running the project

To run the project, you first need to setup the .env files. Each folder in `apps` has its own `.env` file, you can copy the `.env.example` file to `.env` and fill in the values. Similarly, some of the packages in `packages` also have their own `.env` files, you can do the same for them.

You need to make the `/mnt/riven` directory too, and `sudo chown -R 1000:1000 /mnt/riven`. Also if running `seerr`, it needs the folder perm to be set,

```
mkdir -p packages/plugin-seerr/docker-data/seerr
sudo chown -R 1000:1000 packages/plugin-seerr/docker-data
```

After setting up the `.env` files, you need to do a one-time schema generation for different services,

```
turbo generate-schemas
```

Then, you can start the different services required,

```
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

```
pnpm --filter @repo/riven dev
```

If everything works, you should see a bunch of logs, else you can check for errors on http://localhost:8969.

Also for dev, it's recommened to enable these env in `.env.riven` ``

## Clear queues on startup

RIVEN_SETTING\_\_unsafeClearQueuesOnStartup=true

## Refresh database on startup

RIVEN_SETTING\_\_unsafeRefreshDatabaseOnStartup=true

```

```
