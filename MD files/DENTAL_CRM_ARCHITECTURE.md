# 🏗️ Dental Clinic CRM - Architecture Decision Record (ADR)

**Status**: APPROVED  
**Version**: 1.0  
**Last Updated**: July 2026  
**Decision Date**: July 2026  
**Review Cycle**: Quarterly  

---

## 1. Executive Architecture Summary

The Dental Clinic CRM uses a **layered monorepo architecture** with microservices-ready backend, cloud-native infrastructure, and healthcare-grade security. The system is designed to:

- Support 10,000+ patients per clinic
- Handle 1,000+ concurrent users
- Maintain 99.9% uptime
- Achieve HIPAA/SOC2 compliance
- Enable future patient self-service (multi-tenant SaaS)

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Web Browser)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React + Next.js (Staff Dashboard, Admin Panel)          │   │
│  │  - Dentist Views (treatment planning, patient records)    │   │
│  │  - Receptionist Views (scheduling, check-in)             │   │
│  │  - Manager Views (analytics, reporting)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/TLS 1.3
┌─────────────────────────────────────────────────────────────────┐
│               API GATEWAY & LOAD BALANCER                       │
│  (Nginx / AWS ALB - Rate limiting, CORS, Auth)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   API SERVICES LAYER                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Auth     │  │  Core API    │  │   Payment    │           │
│  │  Service    │  │  Service     │  │  Service     │           │
│  ├─────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ • Signup    │  │ • Patients   │  │ • Stripe     │           │
│  │ • Login     │  │ • Appt Schedule  │ • Invoices  │           │
│  │ • JWT Mgmt  │  │ • Treatment  │  │ • Refunds    │           │
│  │ • OAuth     │  │ • Insurance  │  │ • Billing    │           │
│  │ • Sessions  │  │ • Inventory  │  │ • Analytics  │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │Notifications │  │ Job Queue    │  │  File       │           │
│  │ Service      │  │ Service      │  │ Service     │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ • SMS        │  │ • Reminders  │  │ • Photos    │           │
│  │ • Email      │  │ • Reports    │  │ • X-rays    │           │
│  │ • Push       │  │ • Reports Gen│  │ • Documents │           │
│  │ • In-app     │  │ • Backups    │  │ • Storage   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
│  ┌────────────────────┐  ┌──────────────────────┐              │
│  │   PostgreSQL       │  │      Redis           │              │
│  │   (Primary DB)     │  │   (Cache & Queue)    │              │
│  ├────────────────────┤  ├──────────────────────┤              │
│  │ • Patients         │  │ • Session storage    │              │
│  │ • Appointments     │  │ • Real-time features │              │
│  │ • Treatments       │  │ • Job queue (Bull)   │              │
│  │ • Billing/Invoices │  │ • Rate limiting      │              │
│  │ • Insurance        │  │ • Cache layer        │              │
│  │ • Inventory        │  │ • Pub/Sub messaging  │              │
│  │ • Audit logs       │  │                      │              │
│  └────────────────────┘  └──────────────────────┘              │
│                                                                  │
│  ┌────────────────────┐  ┌──────────────────────┐              │
│  │      S3/MinIO      │  │   Elasticsearch      │              │
│  │   (File Storage)   │  │   (Search Index)     │              │
│  ├────────────────────┤  ├──────────────────────┤              │
│  │ • Photos (HIPAA)   │  │ • Full-text search   │              │
│  │ • X-rays (HIPAA)   │  │ • Patient records    │              │
│  │ • Documents        │  │ • Treatment history  │              │
│  │ • Encrypted        │  │ • Analytics queries  │              │
│  │ • Versioned        │  │                      │              │
│  └────────────────────┘  └──────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL INTEGRATIONS & SERVICES                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Stripe   │  │ Twilio   │  │SendGrid  │  │ Zoom API │       │
│  │ (Payments)  │(SMS)     │  │(Email)   │  │(Video)   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ DataDog  │  │ Sentry   │  │ GitHub   │  │AWS/GCP/  │       │
│  │(Monitoring) │(Errors)  │  │(Git)     │  │Azure     │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack Decisions

### 3.1 Frontend: React + Next.js

**Decision**: Use **React 18.2+ with Next.js 14+** for the web application

**Why?**
- ✅ Server-side rendering (SSR) for better SEO
- ✅ API routes eliminate need for separate API communication layer
- ✅ Excellent TypeScript support
- ✅ Image optimization (AVIF, WebP)
- ✅ File-based routing (less boilerplate)
- ✅ Middleware support for authentication
- ✅ Incremental Static Regeneration (ISR) for reports
- ✅ Vercel deployment integration

**Trade-offs**
- ❌ Steeper learning curve than plain React
- ✅ But better for production applications

**Comparison Matrix**

| Criteria | React + Next | Vue + Nuxt | Angular | Svelte |
|----------|-------------|-----------|---------|--------|
| Type Safety | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Learning Curve | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Job Market | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Ecosystem | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Selected**: React + Next.js (best balance for healthcare + large team hiring)

---

### 3.2 Backend: Node.js + Express + TypeScript

**Decision**: Use **Node.js 18+ with Express.js and TypeScript**

**Why?**
- ✅ Shared language with frontend (JavaScript/TypeScript)
- ✅ Rich ecosystem for healthcare integrations
- ✅ Non-blocking I/O ideal for real-time features (appointments, notifications)
- ✅ Express.js is battle-tested in production
- ✅ TypeScript strict mode prevents runtime errors
- ✅ Easy to extend with microservices pattern
- ✅ Excellent ORM options (Prisma, TypeORM)

**Trade-offs**
- ❌ Not ideal for CPU-intensive operations (but we don't have any)
- ✅ Perfect for I/O-heavy applications

**Alternative Considered**: Python/FastAPI
- Pros: Excellent for data science, good async support
- Cons: Different language, slower scaling of teams in dentistry market
- Decision: Rejected (but could be revisited for analytics microservice)

---

### 3.3 Database: PostgreSQL Primary + Redis Cache

**Decision**: **PostgreSQL 15+ for primary data + Redis 7+ for caching**

**Why PostgreSQL?**
- ✅ ACID compliance (critical for financial data: billing, insurance)
- ✅ JSONB support (flexible patient metadata)
- ✅ Full-text search (search patients, treatments)
- ✅ Row-level security (HIPAA audit compliance)
- ✅ Excellent array/uuid support
- ✅ 25+ years of production stability
- ✅ Strong community in healthcare

**Why Redis?**
- ✅ Session storage (healthcare regulations require fast session management)
- ✅ Job queue (Bull - for reminder notifications, report generation)
- ✅ Real-time features (appointment availability, staff status)
- ✅ Pub/Sub for notifications
- ✅ Rate limiting (API abuse protection)
- ✅ Caching patient frequently-accessed data

**Schema Strategy**: 
- Normalized patient data in PostgreSQL
- Denormalized real-time data in Redis
- Archive old records after 7 years (regulatory requirement for some jurisdictions)

**Backups**:
- Daily automated backups
- Point-in-time recovery (24-hour window)
- Cross-region backup replication (disaster recovery)

---

### 3.4 File Storage: AWS S3 / MinIO

**Decision**: **AWS S3 (production) + MinIO (development)**

**Why?**
- ✅ HIPAA-compliant storage (S3 with encryption)
- ✅ Version control for audit trails
- ✅ Automatic expiration policies (old X-rays after 7 years)
- ✅ Server-side encryption (AES-256)
- ✅ CloudFront CDN integration for fast delivery
- ✅ Lifecycle policies (move to Glacier for long-term storage)

**Security Controls**:
- ✅ Bucket encryption enabled
- ✅ Versioning enabled
- ✅ Block public access
- ✅ MFA delete enabled
- ✅ Presigned URLs for authorized access only
- ✅ VPC endpoint (no internet routing)

---

### 3.5 Search: Elasticsearch (Optional, Future)

**Decision**: **PostgreSQL full-text search for MVP, Elasticsearch for Phase 2+**

**Why not in MVP?**
- ✅ PostgreSQL full-text search handles 10K patients easily
- ❌ Elasticsearch adds operational complexity
- ✅ Can add later with zero code changes

**When to add Elasticsearch**:
- > 100K patients
- Complex aggregations needed
- Full-text search becomes slow

---

### 3.6 Authentication: JWT + bcrypt

**Decision**: **JWT tokens with refresh token rotation + bcrypt password hashing**

**Implementation**:
- ✅ Access token (15 min expiry)
- ✅ Refresh token (30 days, rotated on use)
- ✅ bcrypt cost factor: 12+ (OWASP recommendation)
- ✅ HTTPS-only cookies for token storage
- ✅ CSRF protection on state-changing requests
- ✅ Rate limiting on auth endpoints (5 failed attempts = 15 min lockout)

**Future Enhancement**: OAuth2 for Google/Microsoft login (Phase 2)

---

### 3.7 API Design: REST with OpenAPI/Swagger

**Decision**: **RESTful API with OpenAPI 3.0 specification**

**Why REST?**
- ✅ Stateless (healthcare compliance friendly)
- ✅ Standard HTTP methods align with healthcare data operations
- ✅ Easy to cache (GET requests are cacheable)
- ✅ Simple to learn for teams

**Alternative Considered**: GraphQL
- Pros: Better for complex queries, client-driven schema
- Cons: Overkill for dental CRM, harder to cache, security complexity
- Decision: Rejected (REST is simpler for healthcare)

**API Documentation**:
- ✅ OpenAPI 3.0 specification
- ✅ Interactive Swagger UI at `/api/docs`
- ✅ Example requests/responses for every endpoint
- ✅ Error code documentation
- ✅ Rate limit documentation

---

### 3.8 Deployment: Docker + Kubernetes

**Decision**: **Docker for containerization, Kubernetes for production orchestration**

**Development**: Docker Compose (all services locally)
```yaml
services:
  api:
    build: ./packages/api
    ports: ["3000:3000"]
  
  web:
    build: ./packages/web
    ports: ["3001:3001"]
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: dev_password
    ports: ["5432:5432"]
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

**Production**: Kubernetes Deployment (AWS EKS / GCP GKE / Azure AKS)
- ✅ 3+ replicas for API
- ✅ Pod autoscaling (CPU/memory-based)
- ✅ Health checks (liveness/readiness probes)
- ✅ Zero-downtime deployments (rolling updates)
- ✅ Persistent volumes for database
- ✅ Network policies (pod-to-pod communication)

---

### 3.9 CI/CD: GitHub Actions

**Decision**: **GitHub Actions for CI/CD automation**

**Pipeline Stages**:
1. **Lint** (ESLint, Prettier) - 2 min
2. **Build** (TypeScript, Next.js) - 5 min
3. **Unit Tests** (Jest) - 5 min
4. **Integration Tests** (Database operations) - 8 min
5. **Security Scan** (SAST, dependency check) - 3 min
6. **E2E Tests** (Playwright) - 10 min
7. **Docker Build** (multi-stage) - 8 min
8. **Deploy to Staging** - 3 min
9. **Smoke Tests** (on staging) - 5 min
10. **Approval Gate** - Manual
11. **Deploy to Production** - 5 min

**Total Pipeline Time**: ~50 minutes

---

## 4. Data Layer Design

### 4.1 PostgreSQL Schema (Normalized)

**Core Tables**:

```sql
-- Users & Authentication
users (id, email, password_hash, role, clinic_id, created_at)
user_sessions (id, user_id, token, expires_at)

-- Clinic Management
clinics (id, name, address, phone, is_active)
clinic_settings (clinic_id, timezone, currency, default_appointment_duration)

-- Patients
patients (id, clinic_id, first_name, last_name, dob, phone, email)
patient_addresses (id, patient_id, type, street, city, state, zip)
patient_insurance (id, patient_id, provider_id, policy_number, group_number)
patient_medical_history (patient_id, allergies, medications, conditions)

-- Appointments
appointments (id, clinic_id, patient_id, provider_id, start_time, end_time, status)
appointment_types (id, clinic_id, name, duration_minutes, price)

-- Treatment Planning
treatments (id, appointment_id, procedure_code, status, notes)
treatment_notes (id, treatment_id, provider_id, note_text, created_at)
treatment_photos (id, treatment_id, photo_url, created_at)
treatment_xrays (id, treatment_id, xray_url, created_at)

-- Billing
invoices (id, patient_id, total_amount, status, due_date)
invoice_line_items (id, invoice_id, treatment_id, amount, description)
payments (id, invoice_id, amount, method, transaction_id, status)

-- Inventory
inventory_items (id, clinic_id, name, category, quantity, reorder_level)
inventory_suppliers (id, clinic_id, name, contact_email, phone)
inventory_transactions (id, item_id, transaction_type, quantity, user_id)

-- Audit & Compliance
audit_logs (id, clinic_id, user_id, action, entity_type, entity_id, old_values, new_values, created_at)
```

**Indexes for Performance**:
```sql
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

### 4.2 Redis Key Structure

```
// Sessions
session:{sessionId} → {userId, clinic_id, expiresAt}

// Real-time
appointment:availability:{providerId}:{date} → {slots}
provider:status:{providerId} → {online/offline}

// Cache
patient:{patientId} → {cached patient data, 5 min TTL}
insurance:{insuranceId} → {coverage details, 1 hour TTL}

// Job Queue (Bull)
reminder:queue → {appointmentId, reminderType, scheduledAt}
report:queue → {reportType, userId, params}
backup:queue → {backupTime}
```

---

## 5. Security Architecture

### 5.1 Authentication Flow

```
1. User logs in with email + password
2. Server validates credentials against bcrypt hash
3. Server generates JWT access token (15 min) + refresh token (30 days)
4. Tokens sent in secure HTTP-only cookies
5. Client includes access token in Authorization header for API calls
6. On token expiry, client uses refresh token to get new access token
7. Refresh token rotated on each use (old token invalidated)
```

### 5.2 Authorization: Role-Based Access Control (RBAC)

**Roles**:
- `admin` - Full system access
- `clinic_manager` - Clinic operations, reporting, staff management
- `dentist` - Patient records, treatment planning, clinical notes
- `hygienist` - Patient records, hygiene notes, limited treatment info
- `receptionist` - Appointments, check-in, basic patient info
- `patient` (Phase 2) - Own records only, appointment booking

**Implementation**:
```typescript
// Middleware
function authorize(...allowedRoles: Role[]) {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
router.get('/patients/:id', authorize('dentist', 'hygienist', 'receptionist'), getPatient);
router.delete('/patients/:id', authorize('admin'), deletePatient);
```

### 5.3 Data Encryption

**At Rest**:
- PostgreSQL: Column-level encryption for sensitive fields (SSN, DOB)
- S3: Server-side encryption (AES-256)
- Redis: Encrypted with cluster mode

**In Transit**:
- TLS 1.3 for all communications
- HTTPS redirect (HTTP → HTTPS)
- Certificate pinning (mobile apps only)

**Sensitive Fields Encrypted**:
- Passwords (bcrypt)
- Social Security Numbers
- Credit card numbers (not stored - Stripe tokenization)
- Patient phone/email (searchable encryption)

### 5.4 HIPAA Compliance Measures

| Requirement | Implementation |
|-------------|-----------------|
| Access Control | RBAC + Multi-factor authentication (Phase 2) |
| Audit Trail | PostgreSQL audit logs (all data modifications) |
| Encryption | TLS + AES-256 at rest |
| Backup | Daily encrypted backups, 7-year retention |
| Breach Notification | Automated alert system, documented procedure |
| Business Associate Agreements | Signed with Stripe, Twilio, SendGrid, AWS |
| Disaster Recovery | RTO < 4 hours, tested quarterly |
| Data Minimization | Only collect necessary data |
| Workforce Training | Annual HIPAA training mandatory |

---

## 6. Performance & Scalability

### 6.1 Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| API Response Time (95th percentile) | < 200ms | Query optimization, caching, indexing |
| Page Load Time (First Contentful Paint) | < 2s | Code splitting, image optimization, CDN |
| Database Query Time | < 100ms | Indexes, materialized views, partitioning |
| Search Response (patient, treatment) | < 500ms | Full-text search index, caching |
| Appointment Booking | < 1s | Real-time availability cache |

### 6.2 Scaling Strategy

**Year 1** (10K patients, 1 clinic):
- Vertical scaling (larger servers)
- Single PostgreSQL instance with replicas
- Single Redis instance
- Kubernetes 3 API replicas

**Year 2** (50K patients, 5 clinics):
- Horizontal scaling (more servers)
- PostgreSQL read replicas
- Redis cluster mode
- Kubernetes auto-scaling (5-10 replicas)
- Elasticsearch for search

**Year 3+** (100K+ patients, multi-region):
- Microservices decomposition (Auth, Core API, Payment separated)
- Multi-region Kubernetes clusters
- Global load balancing
- Database sharding by clinic_id

---

## 7. Disaster Recovery

### 7.1 Backup Strategy

```
Daily Backups:
├── PostgreSQL (point-in-time recovery, 30-day window)
├── S3/File Storage (versioning enabled, 7-year retention)
└── Configuration (Infrastructure-as-Code versioned in Git)

Recovery Time Objective (RTO): < 4 hours
Recovery Point Objective (RPO): < 1 hour
```

### 7.2 High Availability

```
Multi-AZ Kubernetes Deployment:
├── API (3 pods spread across 3 AZs)
├── PostgreSQL (Primary + Standby, automatic failover)
├── Redis (Cluster mode, automatic failover)
└── Load Balancer (Multi-AZ, health checks)

Health Checks:
├── API: HTTP GET /health (every 10 sec)
├── Database: Connection test (every 5 sec)
└── Redis: Ping test (every 5 sec)

Failover Actions:
├── Pod crash → Kubernetes reschedules automatically
├── Zone outage → Redirect traffic to other zones
└── Region outage → Failover to backup region
```

---

## 8. Cost Estimation

### 8.1 AWS Infrastructure Cost (Year 1)

| Service | Usage | Cost/Month |
|---------|-------|-----------|
| EKS (Kubernetes) | 3 t3.medium nodes | $150 |
| RDS PostgreSQL | db.t3.small, Multi-AZ | $200 |
| ElastiCache Redis | cache.t3.micro | $30 |
| S3 Storage | 1TB (photos, X-rays) | $25 |
| CloudFront CDN | 100GB transfer | $20 |
| Load Balancer | ALB | $20 |
| Backup Storage | 1TB, daily snapshots | $25 |
| NAT Gateway | Data transfer | $35 |
| Data Transfer | 500GB outbound | $45 |
| **TOTAL** | | **$550/month** |

### 8.2 Development Cost

| Phase | Duration | Team Size | Cost |
|-------|----------|-----------|------|
| Phase 1 (Setup) | 1 week | 1 Lead Architect | $2,500 |
| Phase 2 (Backend) | 3 weeks | 1 Backend + 1 Architect | $7,500 |
| Phase 3 (Frontend) | 3 weeks | 1 Frontend + 1 Designer | $7,500 |
| Phase 4 (Features) | 3 weeks | 2 Full-Stack + QA | $9,000 |
| Phase 5 (SaaS) | 1 week | 1 Backend | $2,500 |
| Phase 6 (Testing) | 2 weeks | 1 QA + 1 Full-Stack | $5,000 |
| Phase 7 (DevOps) | 2 weeks | 1 DevOps Engineer | $5,000 |
| Phase 8 (Launch) | 1 week | Full team on-call | $3,000 |
| **TOTAL** | 12 weeks | 2-3 FTE | **$42,000** |

**Note**: Assumes $75/hour contract rate for distributed team

---

## 9. Technology Alternatives Considered & Rejected

### Why NOT Mongo/NoSQL?
❌ Financial data (billing, invoicing) requires ACID transactions  
❌ Referential integrity critical (patient → appointments → treatments)  
✅ PostgreSQL enforces correctness at database level  

### Why NOT GraphQL?
❌ Overengineering for CRM domain  
❌ Caching is more complex (query-based vs endpoint-based)  
❌ Security rules harder to enforce  
✅ REST is simpler, sufficient, and standardized  

### Why NOT Python/Django?
❌ Different language splits team (JavaScript/TypeScript everywhere is better)  
❌ Python startup time affects serverless functions  
✅ Node.js ecosystem stronger for real-time (Bull, Socket.io)  

### Why NOT Firebase/Supabase?
❌ Vendor lock-in (healthcare data portability critical)  
❌ Limited control over encryption, auditing  
❌ Hard to optimize queries for 10K+ patients  
✅ Self-hosted PostgreSQL = full control + HIPAA compliance  

---

## 10. Architecture Decisions Summary Table

| Component | Decision | Rationale |
|-----------|----------|-----------|
| **Frontend** | React + Next.js | SSR, type-safety, modern DX |
| **Backend** | Node.js + Express | Shared language, non-blocking I/O, ecosystem |
| **Database** | PostgreSQL + Redis | ACID + caching, healthcare standard |
| **File Storage** | AWS S3 + MinIO | HIPAA-compliant, versioned |
| **Search** | PostgreSQL FTS (MVP) → Elasticsearch (Phase 2) | Start simple, scale when needed |
| **Auth** | JWT + bcrypt | Stateless, standard healthcare pattern |
| **API Design** | REST + OpenAPI | Simple, cacheable, standardized |
| **Deployment** | Docker + Kubernetes | Cloud-agnostic, scalable |
| **CI/CD** | GitHub Actions | Integrated with GitHub, free tier available |
| **Monitoring** | DataDog + Sentry | Industry standard for healthcare |
| **Infrastructure** | AWS/GCP/Azure (cloud-agnostic) | Multi-cloud flexibility |

---

## 11. Future Architecture Evolution

### Phase 2+: Multi-Tenant SaaS
```
Current: Single clinic per database
Future: Multiple clinics in same database with:
├── Tenant isolation (clinic_id in all queries)
├── Dedicated data warehouses per tenant
├── Tenant-specific feature flags
└── Custom branding per tenant
```

### Phase 3+: Microservices
```
Current: Monolithic API
Future: Decomposition
├── Auth Service (independent scaling)
├── Patient Service (core business logic)
├── Appointment Service (high-traffic)
├── Billing Service (payment processing)
├── Notification Service (async jobs)
└── Analytics Service (offline processing)

Communication: Event-driven via RabbitMQ/Kafka
```

### Phase 4+: AI/ML Features
```
├── Treatment recommendation engine
├── Predictive patient no-show detection
├── Revenue forecasting
└── Insurance eligibility prediction
```

---

## 12. Approval & Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Tech Lead | Sonny (IT Department) | July 2026 | ⏳ Pending |
| Clinic Manager | TBD | - | ⏳ Pending |
| Security Officer | TBD | - | ⏳ Pending |

---

**Next Steps**:
1. ✅ Present architecture to stakeholders
2. ⏳ Get approval from security team
3. ⏳ Finalize technology licenses
4. ⏳ Proceed to Phase 1: Environment Setup

---

**Document Version**: 1.0  
**Last Updated**: July 2026  
**Review Schedule**: Quarterly or after major architectural change
