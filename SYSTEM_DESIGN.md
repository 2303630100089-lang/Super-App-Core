# 🏗️ Super App — Production-Grade System Design

> Senior Staff Engineer Level Design | FAANG-Standard Architecture
> Covers: WhatsApp + Uber + Tinder + Amazon + Instagram + Payments

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Detailed Component Design](#2-detailed-component-design)
3. [Database Design](#3-database-design)
4. [Caching Strategy](#4-caching-strategy)
5. [Real-Time System](#5-real-time-system)
6. [Scalability Strategy](#6-scalability-strategy)
7. [Fault Tolerance & Reliability](#7-fault-tolerance--reliability)
8. [Performance Optimization](#8-performance-optimization)
9. [Security](#9-security)
10. [Trade-offs](#10-trade-offs)
11. [System Design Diagram](#11-system-design-diagram)
12. [Interview Explanation](#12-interview-explanation)

---

## 1. High-Level Architecture

**Request Flow:**
```
User Device → CDN (CloudFront/Fastly) → Global Load Balancer (Anycast)
  → API Gateway (Kong/Envoy) → Service Mesh (Istio)
    → Microservices → Data Layer (PostgreSQL, MongoDB, Redis, Cassandra)
      → Event Bus (Kafka) → Async Workers
```

**Core Infrastructure Layers:**

| Layer | Components |
|---|---|
| **Edge Layer** | CDN for static assets, geo-routed DNS (Route53/Cloudflare), WAF |
| **Gateway Layer** | API Gateway handles auth, rate limiting, routing, SSL termination |
| **Service Layer** | Domain-isolated microservices in Kubernetes pods |
| **Data Layer** | Polyglot persistence — right DB per domain |
| **Async Layer** | Kafka for event streaming, Celery/workers for jobs |
| **Observability** | Prometheus + Grafana + Jaeger + ELK stack |

---

## 2. Detailed Component Design

### API Gateway (Kong + Envoy sidecar)
- JWT validation, OAuth2 scopes
- Rate limiting per user/IP/service
- Request routing to downstream services
- gRPC for internal service communication, REST/GraphQL for clients

### Microservices Breakdown

| Service | Responsibility | Tech Stack |
|---|---|---|
| **Auth Service** | Login, OAuth, JWT, sessions | Go, Redis, PostgreSQL |
| **User Service** | Profiles, preferences, KYC | Go, PostgreSQL |
| **Chat Service** | Messages, threads, media | Go, Cassandra, Redis |
| **Ride Service** | Booking, driver matching, pricing | Go, PostgreSQL, Redis Geo |
| **Match Service** | Swipe engine, scoring, ranking | Python, MongoDB, Redis |
| **Marketplace** | Products, orders, inventory | Java/Spring, PostgreSQL |
| **Feed Service** | Timeline, posts, reactions | Go, Cassandra, Redis |
| **Payment Service** | Wallets, transactions, PSP | Java, PostgreSQL (strict ACID) |
| **Notification Service** | Push, SMS, email fan-out | Go, Kafka consumer |
| **Search Service** | Full-text + geo search | Elasticsearch |
| **Media Service** | Upload, transcode, CDN push | Node.js, S3, FFmpeg |

---

## 3. Database Design

### SQL vs NoSQL Decisions

| Domain | DB | Reason |
|---|---|---|
| Payments, Orders | **PostgreSQL** | ACID, financial consistency |
| Chat Messages | **Apache Cassandra** | Write-heavy, time-series, partition by `(user_id, month)` |
| User Profiles | **PostgreSQL** | Relational, joins needed |
| Matching/Swipes | **MongoDB** | Flexible schema, geospatial queries |
| Driver Locations | **Redis Geo + DynamoDB** | Sub-ms lookups, TTL |
| Product Catalog | **Elasticsearch + PostgreSQL** | Search + source of truth |
| Feed/Social | **Cassandra** | Wide-column, fan-out writes |
| Sessions/Cache | **Redis** | In-memory, TTL |

### Schema Examples

**Chat (Cassandra):**
```sql
CREATE TABLE messages (
  conversation_id UUID,
  sent_at         TIMEUUID,
  sender_id       UUID,
  content         TEXT,
  status          TINYINT,  -- 0=sent, 1=delivered, 2=read
  PRIMARY KEY (conversation_id, sent_at)
) WITH CLUSTERING ORDER BY (sent_at DESC);
```

**Ride (PostgreSQL):**
```sql
CREATE TABLE rides (
  id          UUID PRIMARY KEY,
  rider_id    UUID NOT NULL,
  driver_id   UUID,
  status      VARCHAR(20),  -- requested, matched, in_progress, completed
  pickup_lat  DOUBLE PRECISION,
  pickup_lng  DOUBLE PRECISION,
  fare_cents  INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON rides (rider_id, status);
```

**Matching (MongoDB):**
```json
{
  "_id": "user_id",
  "location": { "type": "Point", "coordinates": [-73.9857, 40.7484] },
  "age": 28,
  "preferences": { "min_age": 24, "max_age": 35, "radius_km": 50 },
  "swipe_history": ["user_b", "user_c"],
  "score": 0.87
}
```

### Sharding & Replication

| DB | Strategy |
|---|---|
| **PostgreSQL** | Citus for horizontal sharding by `user_id`; read replicas for analytics |
| **Cassandra** | Consistent hashing, RF=3, LOCAL_QUORUM reads/writes |
| **MongoDB** | Sharded by `user_id` hash; replica sets per shard |
| **Redis** | Redis Cluster (16384 slots), sentinel for HA |

---

## 4. Caching Strategy

### Redis Cache Layers

| Cache Type | What | TTL | Strategy |
|---|---|---|---|
| Session tokens | JWT refresh tokens | 7 days | Write-through |
| User profiles | Frequently read user data | 5 min | Cache-aside |
| Driver locations | Lat/lng of active drivers | 10s | Write-through with TTL |
| Feed timeline | Pre-computed user feeds | 2 min | Fan-out on write |
| Rate limit counters | Per-user API limits | 1 min sliding window | Token bucket |
| Product listings | Top 1000 items per category | 1 hr | Lazy loading |
| Ride pricing surge | Surge multiplier per zone | 30s | Write-through |

### Feed Fan-Out Strategy

- **Celebrities (>1M followers)**: Pull model — compute on read, cache result
- **Regular users (<10K followers)**: Push model — fan-out to follower feed lists in Redis on post

---

## 5. Real-Time System

### WebSocket Architecture

```
Client ↔ WebSocket Gateway (sticky sessions via consistent hash)
  → Redis Pub/Sub (message fan-out across gateway nodes)
    → Cassandra (durable message store)
      → Kafka (audit log, analytics pipeline)
```

### Chat Message Flow

1. Client sends message over WebSocket
2. WebSocket Gateway publishes to Redis channel `chat:{conversation_id}`
3. All gateway nodes subscribed to that channel push to connected recipients
4. Message async-written to Cassandra for persistence
5. Kafka event triggers push notification if recipient offline

### Message Delivery Guarantees

| Guarantee | Mechanism |
|---|---|
| At-least-once delivery | Kafka with idempotent consumer + dedup key |
| Delivery ACK | Client ACK → server marks `status=delivered` |
| Read receipts | Client sends read event → broadcast to sender |
| Offline queue | Redis sorted set of undelivered IDs; drained on reconnect |
| Message ordering | Cassandra TIMEUUID clustering per conversation |

### Driver Location (Ride Service)

- Driver app publishes location every 3s via WebSocket
- `GEOADD drivers:active lng lat driver_id` stored in Redis Geo
- `GEORADIUS` query finds nearby drivers in O(N+log M) time
- Stale drivers removed via TTL + heartbeat check

---

## 6. Scalability Strategy

### Load Balancing

| Level | Technology |
|---|---|
| L4 (Network) | AWS NLB / GCP Network LB with Anycast for global routing |
| L7 (Application) | Nginx/Envoy for path-based routing, health checks, circuit breaking |
| Service Mesh | Istio for east-west traffic, mTLS, retries, canary deployments |

### Horizontal Scaling

- All services are stateless — scale via Kubernetes HPA (CPU/RPS triggers)
- WebSocket gateways use consistent hashing on `user_id` (no session affinity at LB)
- Kafka partitioned by `user_id` — consumers scale linearly with partitions

### Auto-Scaling Config

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef: { name: chat-service }
  minReplicas: 10
  maxReplicas: 500
  metrics:
    - type: Resource
      resource: { name: cpu, target: { averageUtilization: 60 } }
    - type: External
      external:
        metric: { name: kafka_consumer_lag }
        target: { value: "1000" }
```

- **Cluster Autoscaler** provisions new nodes when pods are pending
- **Karpenter** for rapid node provisioning (<30s) on AWS
- **KEDA** for event-driven scaling (Kafka lag → scale consumers)

---

## 7. Fault Tolerance & Reliability

### Retry Mechanisms

- Exponential backoff with jitter: `base_delay * 2^attempt + random(0, base_delay)`
- Max 3 retries for idempotent operations (GET, PUT)
- Non-idempotent (POST payments): **no retry** — use idempotency keys instead

### Circuit Breakers (Resilience4j / Go-Hystrix)

```
CLOSED → (failure rate > 50% in 10s window) → OPEN
OPEN   → (after 30s timeout) → HALF-OPEN → (success) → CLOSED
```

Applied at: Payment PSP calls, Driver matching, Third-party OAuth

### Failover Strategy

| Strategy | Implementation |
|---|---|
| Multi-AZ | All services deployed across 3 AZs; DB with automatic failover |
| Multi-Region | Payments + Chat active-active in us-east-1 + eu-west-1 |
| DNS Failover | Route53 health checks → failover DNS in <60s |
| Chaos Engineering | Chaos Monkey + Gremlin run weekly in staging |
| Dead Letter Queues | Kafka DLQ for failed processing; alerting + replay tooling |

### Data Durability

| DB | Durability Mechanism |
|---|---|
| PostgreSQL | WAL streaming to S3, PITR (point-in-time recovery) |
| Cassandra | RF=3 with LOCAL_QUORUM; cross-DC replication |
| Redis | AOF + RDB snapshots; Cluster auto-failover to replicas |

---

## 8. Performance Optimization

### CDN Strategy

- **Static assets** (JS, CSS, images): CloudFront/Fastly with 1yr cache headers
- **Media** (chat images, product photos): S3 + CloudFront, WebP/AVIF auto-conversion
- **API responses**: Edge caching for public endpoints with `Cache-Control: public, max-age=60`

### Edge Computing

- **Cloudflare Workers / Lambda@Edge**: Auth token validation at edge (avoid origin round-trip)
- **Geo-fencing**: Ride surge pricing computed at edge using edge KV stores
- **A/B testing**: Feature flags evaluated at edge, zero latency to user

### Preloading & Async UI

| Technique | Applied To |
|---|---|
| Predictive prefetch | On app open, speculatively prefetch nearby drivers, top products |
| Optimistic UI | Chat — render message immediately, reconcile on ACK failure |
| Skeleton screens | Feed and marketplace show placeholders while data streams in |
| HTTP/2 Push / Early Hints (103) | Push critical CSS/JS before HTML is parsed |
| gRPC streaming | Ride tracking uses server-side streaming, not polling |

---

## 9. Security

### Authentication

| Mechanism | Usage |
|---|---|
| OAuth 2.0 + PKCE | Mobile clients |
| OIDC | Social login (Google, Apple) |
| JWT | 15-min access tokens + 7-day rotating refresh tokens |
| mTLS | All internal service-to-service via Istio |
| Biometric | Local FaceID/TouchID gates payments |

### Rate Limiting

- **Token Bucket** in Redis: 100 req/min per user, 500 req/min per IP
- **Kong Rate Limiting Plugin**: Applied at gateway before hitting services
- **Adaptive throttling**: Automatically tightens limits during traffic spikes

### Data Protection

| Protection | Implementation |
|---|---|
| Encryption at rest | AES-256 for all DBs; AWS KMS for key management |
| Encryption in transit | TLS 1.3 everywhere (edge + internal) |
| PII tokenization | Phone numbers, emails stored as tokens (HashiCorp Vault) |
| Payment data | PCI-DSS compliant; card numbers tokenized via Stripe/Adyen |
| Chat E2E encryption | Signal Protocol (Double Ratchet) for 1-to-1 chats |
| GDPR/CCPA | Data deletion pipeline; user data export via Kafka replay |

---

## 10. Trade-offs

### CAP Theorem Decisions

| Service | Choice | Reason |
|---|---|---|
| **Chat** | AP (Availability + Partition Tolerance) | Slight message reorder acceptable; uptime critical |
| **Payments** | CP (Consistency + Partition Tolerance) | No double charges; sacrifice availability |
| **Ride Matching** | AP | Stale driver location acceptable; must always respond |
| **Marketplace Orders** | CP | Inventory accuracy required; oversell is costly |
| **Feed/Social** | AP | Eventual consistency fine; users tolerate stale feed |
| **User Profiles** | CP | Consistent reads needed for auth/KYC |

### Consistency vs Availability

- **Saga Pattern** for distributed transactions (ride completion → payment → driver payout): choreography-based via Kafka; compensating transactions on failure
- **Eventual Consistency** accepted for: Feed likes/counts, match scores, notification delivery
- **Strong Consistency** enforced for: Payment debits, order inventory decrement (DB-level locking + optimistic concurrency)
- **Read-your-writes**: After posting, user's own feed read always shows it (route to primary replica for 5s)

---

## 11. System Design Diagram

```
                    ┌─────────────────────────────────────────────────┐
                    │                    CLIENTS                       │
                    │     Mobile App     Web App     3rd Party APIs    │
                    └───────────────────┬─────────────────────────────┘
                                        │ HTTPS / WSS
                    ┌───────────────────▼─────────────────────────────┐
                    │              CDN / Edge Layer                    │
                    │   CloudFront • Cloudflare Workers • WAF          │
                    └───────────────────┬─────────────────────────────┘
                                        │
                    ┌───────────────────▼─────────────────────────────┐
                    │         Global Load Balancer (Anycast)           │
                    └────────┬──────────────────────┬─────────────────┘
                             │                      │
          ┌──────────────────▼──────┐  ┌────────────▼───────────────┐
          │   REST/GraphQL Gateway  │  │   WebSocket Gateway         │
          │   (Kong + Envoy)        │  │   (sticky, consistent hash) │
          │   Auth • Rate Limit     │  │   Redis Pub/Sub fan-out     │
          └──────────────┬──────────┘  └────────────┬───────────────┘
                         │                          │
          ┌──────────────▼──────────────────────────▼───────────────┐
          │                  SERVICE MESH (Istio / mTLS)             │
          │                                                          │
          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
          │  │Auth Svc  │ │Chat Svc  │ │Ride Svc  │ │Match Svc │   │
          │  │(Go+Redis)│ │(Go+Cass.)│ │(Go+Redis)│ │(Py+Mongo)│   │
          │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
          │       │            │             │            │          │
          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
          │  │User Svc  │ │Feed Svc  │ │Market Svc│ │Payment   │   │
          │  │(Go+PG)   │ │(Go+Cass.)│ │(Java+PG) │ │(Java+PG) │   │
          │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
          └───────┼────────────┼─────────────┼────────────┼─────────┘
                  │            │             │            │
          ┌───────▼────────────▼─────────────▼────────────▼─────────┐
          │                EVENT BUS — Apache Kafka                   │
          │  Topics: chat.msgs • ride.events • payments • notifs      │
          └────────────────────────────┬────────────────────────────┘
                                       │
          ┌────────────────────────────▼────────────────────────────┐
          │              DATA LAYER (Polyglot Persistence)           │
          │                                                          │
          │  PostgreSQL    Cassandra    MongoDB     Elasticsearch    │
          │  (Payments,    (Chat,Feed)  (Matching)  (Search,Catalog) │
          │   Orders)                                                │
          │                                                          │
          │  Redis Cluster              S3 / Object Store            │
          │  (Cache, Geo, PubSub)       (Media, Backups)             │
          └──────────────────────────────────────────────────────────┘
                                       │
          ┌────────────────────────────▼────────────────────────────┐
          │            OBSERVABILITY & INFRASTRUCTURE                │
          │  Prometheus + Grafana • Jaeger Tracing • ELK Logs        │
          │  Kubernetes (EKS/GKE) • Karpenter • KEDA • ArgoCD       │
          └──────────────────────────────────────────────────────────┘
```

---

## 12. Interview Explanation

> "I'd build this Super App as a **domain-driven microservices architecture** deployed on Kubernetes across multiple regions. Each domain — Chat, Rides, Matching, Marketplace, Payments, Feed — owns its data store chosen for its access patterns: Cassandra for write-heavy time-series chat, PostgreSQL for ACID-compliant payments, MongoDB for geospatial matching. Real-time features use **WebSocket gateways with Redis Pub/Sub fan-out**, backed by Kafka for durable event streaming and async processing. For scale, every service is **stateless and horizontally scalable via HPA**, with KEDA for event-driven scaling on Kafka lag. Caching is layered — Redis for hot data with smart TTLs, CDN for static assets, edge workers for auth — targeting sub-100ms P99 latency globally. Fault tolerance is handled through **circuit breakers, Saga pattern for distributed transactions, multi-AZ deployments, and chaos engineering** to validate resilience continuously."

---

## Technology Stack Summary

| Concern | Technology |
|---|---|
| Container Orchestration | Kubernetes (EKS/GKE) + ArgoCD |
| Service Mesh | Istio + Envoy |
| Event Streaming | Apache Kafka |
| Caching | Redis Cluster |
| Real-time | WebSocket + Redis Pub/Sub |
| Chat Storage | Apache Cassandra |
| Financial Data | PostgreSQL + Citus |
| Search | Elasticsearch |
| Matching | MongoDB + Redis Geo |
| CDN | CloudFront / Fastly |
| Observability | Prometheus + Grafana + Jaeger + ELK |
| CI/CD | GitHub Actions + ArgoCD + Helm |
| Secrets | HashiCorp Vault + AWS KMS |
