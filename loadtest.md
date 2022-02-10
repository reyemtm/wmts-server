## Testing Vector Tile Response with `loadtest`

```
loadtest http://127.0.0.1:3000/pub_lands/6/13/24.pbf -t 20 -c 10 --keepalive --rps 2000
```

|Server|Completed Requests|Requests per Second|Mean Latency|
|-|-:|-:|-:|
|wmts-server|3443|172|90.1|
|mbtileserver|3317|166|91.5|
|mbview|3090|154|97.6|


### WMTS-SERVER

- better-sqlite3

```
loadtest http://127.0.0.1:3000/pub_lands/6/13/24.pbf -t 20 -c 10 --keepalive --rps 2000
```

```
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Target URL:          http://127.0.0.1:3000/pub_lands/6/13/24.pbf
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Max time (s):        20
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Concurrency level:   10
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Agent:               keepalive
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Requests per second: 2000
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Completed requests:  3443
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Total errors:        0
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Total time:          20.006057799999997 s
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Requests per second: 172
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Mean latency:        90.1 ms
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO Percentage of the requests served within a certain time
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO   50%      89 ms
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO   90%      113 ms
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO   95%      120 ms
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO   99%      148 ms
[Wed Jan 19 2022 06:00:57 GMT-0500 (Eastern Standard Time)] INFO  100%      230 ms (longest request)
```

### MBTILESERVER

- GO

```
loadtest http://127.0.0.1:3000/pub_lands.mbtiles/6/13/24.pbf -t 20 -c 10 --keepalive --rps 2000
```

```
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Target URL:          http://127.0.0.1:3000/services/pub_lands/tiles/6/13/24.pbf
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Max time (s):        20
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Concurrency level:   10
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Agent:               keepalive
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Requests per second: 2000
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO 
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Completed requests:  3317
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Total errors:        0
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Total time:          20.0025473 s
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Requests per second: 166
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Mean latency:        91.5 ms
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO 
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO Percentage of the requests served within a certain time
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO   50%      90 ms
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO   90%      115 ms
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO   95%      125 ms
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO   99%      157 ms
[Wed Jan 19 2022 06:19:20 GMT-0500 (Eastern Standard Time)] INFO  100%      199 ms (longest request)
```

### MBVIEW

- sqlite3 via @mapbox/mbtiles

```
loadtest http://127.0.0.1:3000/services/pub_lands/tiles/6/13/24.pbf -t 20 -c 10 --keepalive --rps 2000
```

```
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Target URL:          http://127.0.0.1:3000/pub_lands.mbtiles/6/13/24.pbf
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Max time (s):        20
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Concurrency level:   10
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Agent:               keepalive
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Requests per second: 2000
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Completed requests:  3090
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Total errors:        0
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Total time:          20.0020561 s
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Requests per second: 154
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Mean latency:        97.6 ms
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO Percentage of the requests served within a certain time
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO   50%      95 ms
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO   90%      131 ms
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO   95%      152 ms
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO   99%      197 ms
[Wed Jan 19 2022 06:11:46 GMT-0500 (Eastern Standard Time)] INFO  100%      248 ms (longest request)
```
