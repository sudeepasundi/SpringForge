import type { DemoFile } from '@/lib/types';

/**
 * The infrastructure ShopFlow runs on — the subject of modules 14–17.
 *
 * These are the files nobody writes in a tutorial and everybody inherits in a
 * real system: the broker settings that decide whether an acknowledged write
 * survives, the proxy settings that decide behaviour under load, and the
 * collector and alert configuration that decide whether you find out.
 */
export const shopflowInfraFiles: DemoFile[] = [
  {
    path: 'infrastructure/kafka/server.properties',
    lang: 'properties',
    note: 'The durability settings are cluster-side. A producer using acks=all against defaults is not durable.',
    code: `# ShopFlow Kafka broker — KRaft mode, three brokers, no ZooKeeper.
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@kafka-0:9093,2@kafka-1:9093,3@kafka-2:9093

listeners=PLAINTEXT://:9092,CONTROLLER://:9093
inter.broker.listener.name=PLAINTEXT
controller.listener.names=CONTROLLER

log.dirs=/var/lib/kafka/data

# --- Durability -------------------------------------------------------------
# The replication factor for automatically created topics AND for the internal
# consumer offsets topic. The default of 1 for offsets is a data-loss bug
# waiting for a broker restart.
default.replication.factor=3
offsets.topic.replication.factor=3
transaction.state.log.replication.factor=3
transaction.state.log.min.isr=2

# acks=all only means "all in-sync replicas". With min.insync.replicas=1 that
# can be a single replica, so acks=all guarantees nothing on its own.
# 2 of 3 means one broker can be down and writes still succeed.
min.insync.replicas=2

# Never elect a replica that was out of sync. Doing so trades committed data
# for availability, silently.
unclean.leader.election.enable=false

# --- Topic hygiene ----------------------------------------------------------
# Auto-creation makes a typo in a producer config into a live topic with
# defaults nobody chose. Topics are declared, reviewed and applied.
auto.create.topics.enable=false
delete.topic.enable=true

log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000

# --- Placement and throughput ----------------------------------------------
# Rack awareness spreads replicas across availability zones, so losing a zone
# does not take every replica of a partition with it.
broker.rack=eu-west-1a

num.network.threads=8
num.io.threads=16
num.replica.fetchers=4
replica.lag.time.max.ms=30000

# Quotas: one runaway consumer must not starve the rest of the cluster.
quota.producer.default=52428800
quota.consumer.default=52428800`,
  },
  {
    path: 'infrastructure/kafka/topics.yaml',
    lang: 'yaml',
    note: 'Topics as reviewed configuration. Partition count is chosen from throughput, not guessed.',
    code: `# Applied by CI with 'kafka-topics --alter'. Partition count can be raised
# but never lowered, and raising it changes key routing permanently — an
# existing key may move to a different partition, so ordering per key is
# broken across the boundary. Size for peak, once.
topics:
  - name: shopflow.orders.v1
    # Peak 4,000 msg/s; one consumer handles ~500 msg/s; 2x headroom.
    partitions: 16
    replicationFactor: 3
    config:
      min.insync.replicas: "2"
      retention.ms: "604800000"          # 7 days
      cleanup.policy: "delete"
      compression.type: "producer"

  - name: shopflow.inventory-snapshot.v1
    partitions: 12
    replicationFactor: 3
    config:
      min.insync.replicas: "2"
      # Compacted: the log keeps the latest value per key forever, so a new
      # consumer can rebuild full state by replaying from the beginning.
      cleanup.policy: "compact"
      min.cleanable.dirty.ratio: "0.1"
      delete.retention.ms: "86400000"    # how long tombstones survive
      segment.ms: "3600000"              # compaction only touches closed segments

  - name: shopflow.orders.v1.DLT
    partitions: 16
    replicationFactor: 3
    config:
      min.insync.replicas: "2"
      retention.ms: "2592000000"         # 30 days — you need time to triage`,
  },
  {
    path: 'infrastructure/kafka/schema-registry.yaml',
    lang: 'yaml',
    note: 'BACKWARD by default; TRANSITIVE on compacted topics, where the oldest record never ages out.',
    code: `# Global default. A new consumer schema can read data written with the
# previous producer schema — so consumers are upgraded first, then producers.
compatibility: BACKWARD

subjects:
  # Compacted topics retain records indefinitely, so a consumer may encounter
  # ANY historical schema, not just the previous one. Non-transitive
  # compatibility is insufficient here and the failure appears months later.
  - subject: shopflow.inventory-snapshot.v1-value
    compatibility: BACKWARD_TRANSITIVE

  # Consumed by an external partner on their own release cadence, so changes
  # must be readable in both directions.
  - subject: shopflow.orders.v1-value
    compatibility: FULL

client:
  # Never let a producer register a schema implicitly. Registration is a
  # reviewed CI step; an application that can self-register can deploy a
  # breaking change without anyone seeing it.
  auto.register.schemas: false
  use.latest.version: true`,
  },
  {
    path: 'infrastructure/redis/redis.conf',
    lang: 'conf',
    note: 'maxmemory sits well below the container limit — the headroom is for copy-on-write during saves.',
    code: `# ShopFlow Redis — session store and read-through cache.
bind 0.0.0.0
protected-mode yes
port 6379
timeout 300
tcp-keepalive 300

# --- Memory -----------------------------------------------------------------
# Container limit is 10 GB. maxmemory is 6 GB, not 9: the remainder covers
# copy-on-write during a background save, allocator fragmentation, client
# output buffers and replication buffers — none of which count toward
# used_memory, all of which count toward the limit.
maxmemory 6gb
maxmemory-policy allkeys-lfu

# volatile-* would evict nothing if no key had a TTL, silently degrading to
# noeviction under exactly the pressure eviction exists for.

# --- Persistence ------------------------------------------------------------
save 900 1
save 300 100
save 60 10000
dbfilename dump.rdb
dir /data
stop-writes-on-bgsave-error yes
rdbcompression yes

appendonly yes
appendfilename "appendonly.aof"
# everysec can lose up to one second of acknowledged writes. That is accepted
# here: nothing in Redis is a system of record, only a derived copy.
appendfsync everysec
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# --- Fragmentation ----------------------------------------------------------
activedefrag yes
active-defrag-ignore-bytes 100mb
active-defrag-threshold-lower 10
active-defrag-cycle-min 5
active-defrag-cycle-max 25

# --- Safety -----------------------------------------------------------------
# O(n) commands over the whole keyspace freeze the single execution thread.
# Removing them is the only reliable way to stop one from reaching production.
rename-command KEYS ""
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command CONFIG "CONFIG_b41f9c2e"

# Anything slower than 10ms on a single-threaded server is worth seeing.
slowlog-log-slower-than 10000
slowlog-max-len 256
latency-monitor-threshold 100`,
  },
  {
    path: 'infrastructure/nginx/nginx.conf',
    lang: 'nginx',
    note: 'Every proxy timeout defaults to 60s. Leaving them there is how an edge outage becomes a cascade.',
    code: `worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 8192;
    multi_accept on;
}

http {
    # --- Upstreams ----------------------------------------------------------
    upstream gateway {
        least_conn;
        server gateway-0.shopflow.svc:8080 max_fails=3 fail_timeout=10s;
        server gateway-1.shopflow.svc:8080 max_fails=3 fail_timeout=10s;
        keepalive 64;
        keepalive_timeout 60s;
    }

    # --- Rate limit zones ---------------------------------------------------
    limit_req_zone  $binary_remote_addr zone=api_rate:10m rate=20r/s;
    limit_req_zone  $binary_remote_addr zone=login_rate:10m rate=5r/m;
    limit_conn_zone $binary_remote_addr zone=api_conn:10m;

    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:100m
                     max_size=10g inactive=60m use_temp_path=off;

    server {
        listen 443 ssl;
        http2 on;
        server_name api.shopflow.dev;

        # fullchain, not the leaf: a leaf-only chain works in a browser that
        # cached the intermediate and fails for every other client.
        ssl_certificate     /etc/ssl/shopflow/fullchain.pem;
        ssl_certificate_key /etc/ssl/shopflow/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_session_cache shared:SSL:20m;
        ssl_session_tickets off;
        ssl_stapling on;
        ssl_stapling_verify on;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        client_max_body_size 10m;
        client_header_timeout 10s;
        client_body_timeout 10s;

        location /api/ {
            limit_req  zone=api_rate burst=40 nodelay;
            limit_conn api_conn 20;
            # 429, not the default 503: a fault code invites clients to retry
            # harder, which is the retry storm this limit exists to prevent.
            limit_req_status 429;
            limit_conn_status 429;

            proxy_pass http://gateway;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host              $host;
            proxy_set_header X-Real-IP         $remote_addr;
            proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_connect_timeout 2s;
            proxy_send_timeout    10s;
            proxy_read_timeout    15s;

            proxy_next_upstream error timeout http_502 http_503 http_504;
            proxy_next_upstream_tries 2;
        }

        location /api/auth/login {
            # No nodelay: making a brute-force attempt wait is the point.
            limit_req zone=login_rate burst=3;
            limit_req_status 429;
            proxy_pass http://gateway;
        }

        location /api/catalog/ {
            proxy_cache api_cache;
            proxy_cache_key "$scheme$request_method$host$request_uri";
            proxy_cache_valid 200 301 5m;
            proxy_cache_valid 404 30s;

            # Serve stale rather than 502, and refresh behind the response so
            # the refresh latency never lands on a user.
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
            proxy_cache_background_update on;
            proxy_cache_lock on;
            proxy_cache_lock_timeout 5s;

            # Personalised responses must never enter a shared cache.
            proxy_cache_bypass $http_authorization;
            proxy_no_cache     $http_authorization;

            add_header X-Cache-Status $upstream_cache_status;
            proxy_pass http://gateway;
        }

        location /api/orders/stream {
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 1h;
            proxy_pass http://gateway;
        }
    }
}`,
  },
  {
    path: 'infrastructure/istio/order-service.yaml',
    lang: 'yaml',
    note: 'Canary weight is a routing rule applied in seconds — no pod restarted, no deploy.',
    code: `apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: shopflow
spec:
  # PERMISSIVE first, watch until the plaintext share is zero, then STRICT.
  # Going straight to STRICT breaks anything without a sidecar — including
  # Prometheus scrapes and probes from outside the mesh.
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: payment-callers
  namespace: shopflow
spec:
  selector:
    matchLabels:
      app: payment-service
  action: ALLOW
  rules:
    # Identifies the workload, not the IP. An attacker in a pod without this
    # service account cannot reach payment, whatever the network permits.
    - from:
        - source:
            principals: ["cluster.local/ns/shopflow/sa/order-service"]
      to:
        - operation:
            methods: ["POST"]
            paths: ["/api/payments"]
---
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: order-service
  namespace: shopflow
spec:
  hosts: [order-service]
  http:
    # Testers opt in by header and always reach v2.
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination: { host: order-service, subset: v2 }
    - route:
        - destination: { host: order-service, subset: v1 }
          weight: 95
        - destination: { host: order-service, subset: v2 }
          weight: 5
---
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: order-service
  namespace: shopflow
spec:
  host: order-service
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }
  trafficPolicy:
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      # Without this cap, a deploy that makes every pod fail ejects the whole
      # pool — turning a degraded service into an unreachable one.
      maxEjectionPercent: 50`,
  },
  {
    path: 'infrastructure/observability/otel-collector.yaml',
    lang: 'yaml',
    note: 'memory_limiter first, batch last. Wrong order still starts, then OOMs under the spike it was meant to survive.',
    code: `receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }

processors:
  # Must be first — it can only protect the collector if it sees data before
  # anything else has allocated on it.
  memory_limiter:
    check_interval: 1s
    limit_percentage: 80
    spike_limit_percentage: 15

  k8sattributes:
    auth_type: serviceAccount
    extract:
      metadata:
        - k8s.namespace.name
        - k8s.pod.name
        - k8s.deployment.name
        - k8s.node.name

  # Gateway only. Requires every span of a trace to reach this replica, which
  # is what the load-balancing exporter on the agents guarantees.
  tail_sampling:
    decision_wait: 10s        # must exceed the slowest trace, or it decides blind
    num_traces: 100000
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 1000 }
      - name: baseline
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }

  # Must be last: batching before something that drops data batches work you
  # then discard.
  batch:
    timeout: 5s
    send_batch_size: 8192
    send_batch_max_size: 10000

exporters:
  otlp/tempo:
    endpoint: tempo.observability.svc:4317
    tls: { insecure: true }
    sending_queue: { enabled: true, num_consumers: 10, queue_size: 5000 }
    retry_on_failure: { enabled: true, initial_interval: 5s, max_elapsed_time: 300s }

  prometheusremotewrite:
    endpoint: http://mimir.observability.svc/api/v1/push

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, k8sattributes, tail_sampling, batch]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, k8sattributes, batch]
      exporters: [prometheusremotewrite]
  telemetry:
    metrics:
      level: detailed`,
  },
  {
    path: 'infrastructure/observability/prometheus.yml',
    lang: 'yaml',
    note: 'sample_limit contains a cardinality explosion to one broken target instead of OOM-killing Prometheus.',
    code: `global:
  scrape_interval: 15s
  scrape_timeout: 10s
  evaluation_interval: 30s
  external_labels:
    cluster: shopflow-prod
    replica: A               # the HA pair says B; Alertmanager deduplicates

rule_files:
  - /etc/prometheus/rules/*.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: [alertmanager.observability.svc:9093]

scrape_configs:
  - job_name: spring-services
    metrics_path: /actuator/prometheus
    kubernetes_sd_configs:
      - role: pod

    # A target exposing a runaway label fails its own scrape rather than
    # taking down the monitoring system that would have reported it.
    sample_limit: 20000
    label_limit: 30

    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: "true"
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: app
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod

    metric_relabel_configs:
      # Per-request identifiers are unbounded in cardinality. Strip them at
      # ingestion — asking every team not to add them does not scale.
      - regex: 'user_id|request_id|session_id|trace_id'
        action: labeldrop

remote_write:
  - url: https://mimir.observability.svc/api/v1/push
    queue_config:
      capacity: 10000
      max_shards: 50
      min_shards: 4
      max_samples_per_send: 2000
    write_relabel_configs:
      # Do not pay to store at 90 days what you would never query there.
      - source_labels: [__name__]
        regex: 'go_gc_.*|process_.*'
        action: drop`,
  },
  {
    path: 'infrastructure/observability/rules/shopflow.yml',
    lang: 'yaml',
    note: 'Symptoms page; causes inform. Every rule here means a user is having a bad time.',
    code: `groups:
  - name: shopflow-aggregates
    interval: 30s
    rules:
      # Precomputed so an incident-time dashboard rush does not take
      # Prometheus down re-evaluating this for every viewer.
      - record: job:http_request_duration_seconds:p99
        expr: |
          histogram_quantile(0.99,
            sum by (job, le) (rate(http_server_requests_seconds_bucket[5m])))

      - record: job:slo_error_ratio:rate1h
        expr: |
          sum by (job) (rate(http_server_requests_seconds_count{status=~"5.."}[1h]))
          / sum by (job) (rate(http_server_requests_seconds_count[1h]))

  - name: shopflow-slo
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          sum by (job) (rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
          / sum by (job) (rate(http_server_requests_seconds_count[5m])) > 0.05
        # Without 'for', one bad scrape pages someone — and three false pages
        # is all it takes for people to stop reading the channel.
        for: 5m
        labels: { severity: critical, team: payments }
        annotations:
          summary: "{{ $labels.job }} error rate is {{ $value | humanizePercentage }}"
          runbook_url: https://wiki.shopflow.dev/runbooks/high-error-rate

      - alert: ConsumerLagGrowing
        # Lag per partition, not summed: one stuck partition is invisible in
        # a total that the other fifteen keep healthy.
        expr: max by (topic, consumergroup, partition) (kafka_consumergroup_lag) > 50000
        for: 10m
        labels: { severity: warning, team: payments }
        annotations:
          summary: "{{ $labels.consumergroup }} is behind on {{ $labels.topic }}"

      - alert: KafkaUnderReplicatedPartitions
        # The leading indicator: a broker is struggling well before it fails,
        # and min.insync.replicas=2 means the next failure rejects writes.
        expr: kafka_server_replicamanager_underreplicatedpartitions > 0
        for: 5m
        labels: { severity: critical, team: platform }

      - alert: TLSCertificateExpiringSoon
        # 21 days, not 7: a renewal that has silently failed needs to be
        # noticed, diagnosed and fixed by someone not expecting it.
        expr: probe_ssl_earliest_cert_expiry - time() < 86400 * 21
        for: 1h
        labels: { severity: warning, team: platform }`,
  },
  {
    path: 'infrastructure/observability/alertmanager.yml',
    lang: 'yaml',
    note: 'Inhibition is the least-used feature and turns a thirty-page cascade into one page.',
    code: `route:
  receiver: slack-default
  # Group by what describes the problem, not where it is. Including 'pod'
  # here would send one notification per pod on a node failure.
  group_by: [alertname, cluster, namespace]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  routes:
    - matchers: [severity="critical"]
      receiver: pagerduty
      group_wait: 10s
      repeat_interval: 1h
    - matchers: [team="payments"]
      receiver: slack-payments
      continue: true
    - matchers: [severity="info"]
      receiver: "null"

inhibit_rules:
  # One database failure lights up every service that depends on it. Without
  # this the on-call engineer is handed thirty pages describing one problem.
  - source_matchers: [alertname="DatabaseDown"]
    target_matchers: [severity=~"warning|critical"]
    equal: [cluster, namespace]

  - source_matchers: [severity="critical"]
    target_matchers: [severity="warning"]
    equal: [alertname, cluster, namespace]

receivers:
  - name: slack-default
    slack_configs:
      - channel: "#shopflow-alerts"
        title: "{{ .CommonAnnotations.summary }}"
        text: "{{ range .Alerts }}{{ .Annotations.runbook_url }}\\n{{ end }}"
  - name: slack-payments
    slack_configs:
      - channel: "#payments-alerts"
  - name: pagerduty
    pagerduty_configs:
      - service_key_file: /etc/alertmanager/secrets/pagerduty-key
        description: "{{ .CommonAnnotations.summary }}"
  - name: "null"`,
  },
];
