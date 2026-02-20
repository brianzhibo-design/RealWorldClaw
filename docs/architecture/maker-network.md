# Maker Network Architecture（制造者网络架构）

> **Strategic upgrade: from Print Farm to Maker Network**
> Author: 慢羊羊🧓 | Chief Advisor, 羊村智库
> Date: 2026-02-20
> Status: Architecture Proposal v1.0

---

## Executive Summary

大人's directive:

> "我们要做的是3D打印标准化与定制化共存，有打印机的人可以只负责打印生产，而有组装技术的人可以申请成为电路组装专家，以及其他角色等"

This document defines the evolution from a **Print Farm** (single-role: printing) to a **Maker Network** (multi-role manufacturing chain). The core insight: not everyone owns a printer AND knows soldering. Decompose the manufacturing chain into specialised roles, let the platform orchestrate.

---

## Table of Contents

1. [Manufacturing Chain Roles（制造链角色）](#1-manufacturing-chain-roles)
2. [Order Decomposition Engine（订单拆分引擎）](#2-order-decomposition-engine)
3. [Standardisation vs Customisation（标准化与定制化共存）](#3-standardisation-vs-customisation)
4. [Naming Decision（命名方案）](#4-naming-decision)
5. [Data Model Changes（数据模型变更）](#5-data-model-changes)
6. [Migration Impact Assessment（现有代码影响评估）](#6-migration-impact-assessment)

---

## 1. Manufacturing Chain Roles

### 1.1 Role Overview

| Role | Chinese | Icon | Barrier to Entry | Core Activity |
|------|---------|------|-------------------|---------------|
| **Printer** | 打印工坊 | 🖨️ | Low — owns a 3D printer | Print shells, structural parts |
| **Assembler** | 组装专家 | 🔧 | Medium — soldering skills + tools | PCB soldering, wiring, mechanical assembly |
| **Designer** | 设计师 | ✏️ | Medium-High — CAD/3D modelling | Custom designs, component modifications |
| **Inspector** | 质检员 | 🔍 | Medium — test equipment | Functional testing, QA sign-off |
| **Full-service** | 全能工坊 | ⭐ | High — all of the above | End-to-end: print → assemble → test → ship |

### 1.2 Printer（打印工坊）

**Capability Requirements:**
- Owns one or more FDM/SLA 3D printers
- Can print standard PLA/PETG/ABS parts
- Has basic post-processing ability (support removal, sanding)

**Certification Method:**
1. Register printer specs (brand, model, build volume, materials)
2. Print a **Calibration Test Part** (platform-provided STL) — upload photos
3. Community review or automated image comparison scores ≥ 80%
4. First 3 orders are "probation" (supervised, held escrow longer)

**Scoring Dimensions:**
| Metric | Weight | Description |
|--------|--------|-------------|
| Dimensional accuracy | 30% | Deviation from spec (measured via test part) |
| Surface quality | 20% | Layer consistency, no blobs/stringing |
| On-time delivery | 25% | Percentage shipped within promised window |
| Defect rate | 25% | Customer-reported defects / total orders |

**Pricing Model:**
- Per-gram of filament used + machine-hour rate
- Platform suggests range based on material + region; maker sets final price
- Express surcharge: maker-defined (typically 1.5–2×)

### 1.3 Assembler（组装专家）

**Capability Requirements:**
- Soldering iron (temperature-controlled preferred)
- Basic electronics tools (multimeter, wire strippers, heat gun)
- Ability to follow assembly instructions and wiring diagrams
- ESD-safe workspace (recommended, not required for entry tier)

**Certification Method:**
1. Submit photos/video of workspace and tools
2. Complete a **Certification Kit Assembly** — platform ships a kit with known-good components; assembler returns completed unit
3. Platform inspects returned unit: solder joint quality, functionality
4. Score ≥ 85% → certified Assembler
5. Advanced tier: SMD soldering certification (separate test)

**Scoring Dimensions:**
| Metric | Weight | Description |
|--------|--------|-------------|
| Solder quality | 30% | Cold joints, bridges, flux residue |
| Functional pass rate | 30% | Does it work on first power-up? |
| Assembly time | 15% | Efficiency relative to estimated time |
| On-time delivery | 25% | Shipped within window |

**Pricing Model:**
- Per-unit assembly fee (varies by component complexity)
- Platform provides reference pricing per component SKU
- Tiered: basic (through-hole only) vs advanced (SMD + through-hole)

### 1.4 Designer（设计师）

**Capability Requirements:**
- Proficiency in CAD software (Fusion 360, SolidWorks, Blender, OpenSCAD, etc.)
- Understanding of 3D printing constraints (overhangs, tolerances, wall thickness)
- Ability to produce print-ready STL/3MF files with proper manifests

**Certification Method:**
1. Submit portfolio: ≥ 3 printable designs with photos of printed results
2. Complete a **Design Challenge**: modify an existing RWC component to spec (e.g., "resize Clawbie shell to 120% with custom cutout")
3. Peer review by existing certified designers
4. Ongoing: design acceptance rate tracked

**Scoring Dimensions:**
| Metric | Weight | Description |
|--------|--------|-------------|
| Printability | 30% | % of designs that print successfully first try |
| Design accuracy | 25% | Matches customer brief |
| Turnaround time | 20% | Quote-to-delivery speed |
| Customer satisfaction | 25% | Post-delivery rating |

**Pricing Model:**
- Per-design fee (designer quotes per job)
- Hourly rate for iterative/complex work
- Royalty option: designer earns % on each print of their custom design

### 1.5 Inspector（质检员）

**Capability Requirements:**
- Multimeter, oscilloscope (for electronics testing)
- Calipers / measurement tools (for dimensional QA)
- Understanding of component test procedures
- Reliable internet for uploading test reports

**Certification Method:**
1. Submit equipment inventory with photos
2. Complete a **QA Certification Test**: platform sends 3 units (1 known-good, 1 with deliberate defect, 1 borderline) — inspector must correctly classify all 3
3. Score: binary pass/fail on the 3-unit test

**Scoring Dimensions:**
| Metric | Weight | Description |
|--------|--------|-------------|
| Detection accuracy | 40% | False positive + false negative rate |
| Report completeness | 25% | All test points documented |
| Turnaround time | 20% | Receipt to report |
| Consistency | 15% | Variance across similar units |

**Pricing Model:**
- Per-unit inspection fee
- Tiered: visual-only vs functional test vs full compliance report
- Premium: video-documented test (for customer confidence)

### 1.6 Full-service（全能工坊）

**Capability Requirements:**
- Meets ALL requirements for Printer + Assembler + Inspector
- Dedicated workspace for each stage
- Can handle complete order lifecycle including packaging and shipping

**Certification Method:**
- Must hold active certifications for Printer, Assembler, and Inspector roles
- Complete one end-to-end **Certification Order** (print + assemble + test + ship)
- Evaluated on the full chain

**Scoring Dimensions:**
- Composite score from all sub-role metrics
- Additional: **End-to-end time** (order placed → shipped) and **packaging quality**

**Pricing Model:**
- Bundled per-unit price (typically 10–15% discount vs sum of individual roles)
- Platform highlights full-service as "recommended" for convenience buyers

---

## 2. Order Decomposition Engine

### 2.1 Core Concept

Every orderable product has a **Manufacturing Manifest**（制造清单）that defines the required manufacturing steps. The Order Decomposition Engine reads this manifest and creates a fulfilment plan.

### 2.2 Manufacturing Manifest Structure

```yaml
# Example: Clawbie V4 赛博蛋
product_id: clawbie-v4
name: "Clawbie V4 Cyber Egg"
steps:
  - id: print_shell
    role: printer
    inputs:
      - file: clawbie-v4-shell-top.3mf
      - file: clawbie-v4-shell-bottom.3mf
    material: PLA
    estimated_time_hours: 6.5
    estimated_filament_g: 120
    
  - id: print_internal
    role: printer
    inputs:
      - file: clawbie-v4-bracket.3mf
      - file: clawbie-v4-diffuser.3mf
    material: PETG  # translucent
    estimated_time_hours: 2.0
    estimated_filament_g: 35
    
  - id: assemble
    role: assembler
    depends_on: [print_shell, print_internal]
    inputs:
      - bom: clawbie-v4-bom.yaml  # bill of materials
    skill_level: basic  # through-hole only
    estimated_time_hours: 1.5
    
  - id: inspect
    role: inspector
    depends_on: [assemble]
    test_procedure: clawbie-v4-test.yaml
    estimated_time_hours: 0.5

shipping_between_steps: true  # parts may ship between makers
```

### 2.3 Fulfilment Strategies

When a customer places an order, the engine evaluates three strategies and picks the optimal one (or lets the customer choose):

#### Strategy A: Full-service（一站式）

```
Customer Order
    └──▶ Full-service Maker (print + assemble + test + ship)
              └──▶ Customer
```

- **When preferred:** Full-service maker available nearby, fastest total time, lowest shipping cost
- **Selection criteria:** rating ≥ 4.0, availability = open, location proximity

#### Strategy B: Decomposed Pipeline（拆分流水线）

```
Customer Order
    ├──▶ Printer A (shell parts)    ──┐
    ├──▶ Printer B (internal parts) ──┤
    │                                  ▼
    │                           Assembler C (receives all printed parts + BOM kit)
    │                                  │
    │                                  ▼
    │                           Inspector D (test + sign off)
    │                                  │
    └──────────────────────────────────▶ Customer
```

- **When preferred:** No full-service maker available, or decomposed is cheaper/faster
- **Logistics:** Platform coordinates inter-maker shipping or uses a regional hub
- **Risk mitigation:** Each sub-order has escrow; parts verified at each handoff

#### Strategy C: Partial Order（部分订单）

```
Customer Order (shell only)
    └──▶ Printer A (shell parts)
              └──▶ Customer
```

- **When preferred:** Customer is a maker themselves, only needs specific parts
- **Selection:** Only relevant steps from the manifest

### 2.4 Decomposition Algorithm

```
function decomposeOrder(order, manifest):
    required_steps = filterSteps(manifest, order.scope)  // full, partial
    
    // Strategy A: try full-service first
    full_service_makers = findMakers(
        role = "full_service",
        location = order.shipping_address,
        materials = required_materials(required_steps),
        availability = "open"
    )
    if full_service_makers.length > 0:
        plan_a = buildFullServicePlan(full_service_makers, order)
    
    // Strategy B: decompose
    sub_tasks = topologicalSort(required_steps)  // respect depends_on
    plan_b = buildDecomposedPlan(sub_tasks, order)
    
    // Score and rank plans
    plans = [plan_a, plan_b].filter(valid)
    for plan in plans:
        plan.score = weightedScore(
            estimated_cost = 0.3,
            estimated_time = 0.3,
            maker_ratings  = 0.2,
            shipping_hops  = 0.2   // fewer hops = better
        )
    
    return plans.sortBy(score).desc()
```

### 2.5 Data Model for Order Decomposition

```
┌──────────────┐       ┌────────────────┐       ┌──────────────────┐
│   orders     │──1:N──│  sub_orders    │──N:1──│  maker_nodes     │
│              │       │                │       │                  │
│ id           │       │ id             │       │ id               │
│ customer_id  │       │ order_id       │       │ owner_id         │
│ product_id   │       │ step_id        │       │ display_name     │
│ scope        │       │ role_required  │       │ ...              │
│ strategy     │       │ maker_node_id  │       └──────────────────┘
│ status       │       │ status         │
│ total_cny    │       │ price_cny      │
└──────────────┘       │ depends_on[]   │
                       │ shipping_to    │
                       │ tracking_num   │
                       └────────────────┘
```

---

## 3. Standardisation vs Customisation

### 3.1 Two Modes, One Platform

```
┌─────────────────────────────────────────────────────────────┐
│                    RealWorldClaw Platform                     │
│                                                               │
│   ┌─────────────────────┐    ┌─────────────────────────┐     │
│   │  Standard Pipeline  │    │  Custom Pipeline         │     │
│   │  标准件流水线         │    │  定制件流水线             │     │
│   │                     │    │                           │     │
│   │  manifest → print   │    │  brief → design →         │     │
│   │  → assemble → test  │    │  manifest → print →       │     │
│   │                     │    │  assemble → test           │     │
│   │  Any qualified      │    │  Designer creates/modifies │     │
│   │  maker can do it    │    │  then standard pipeline    │     │
│   └─────────────────────┘    └─────────────────────────┘     │
│                                                               │
│   Shared: maker pool, rating system, escrow, logistics        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Standard Parts（标准件）

- Component has a **published manifest** with locked STL/3MF files and BOM
- Any certified Printer/Assembler can fulfil — no design step needed
- Quality enforced by: file checksums, slicer profiles, test procedures
- **Fungible**: if Printer A is busy, Printer B produces identical output
- Pricing: competitive, market-driven, race to efficiency

### 3.3 Custom Parts（定制件）

The custom pipeline prepends a **Design Phase** before the standard pipeline:

```
1. Customer submits brief:
   - Base product: "Clawbie V4"
   - Modifications: "Red color, 120% scale, add name engraving"
   
2. Platform routes to Designer:
   - Designer quotes (price + time)
   - Customer approves
   
3. Designer produces:
   - Modified STL/3MF files
   - Updated manifest (new dimensions, material, print time)
   - Files stored as a "custom variant" linked to base product
   
4. Custom manifest enters standard pipeline:
   - Printer prints using custom files
   - Assembler follows updated BOM (if changed)
   - Inspector tests per adjusted procedure

5. IP handling:
   - Customer owns the custom variant (personal use)
   - Designer retains design IP
   - Optional: customer can "publish" the variant to marketplace (designer earns royalty)
```

### 3.4 Hybrid Orders

A single order can mix standard and custom:

```yaml
order:
  items:
    - product: clawbie-v4        # standard
      quantity: 1
    - product: clawbie-v4        # custom variant
      custom:
        scale: 1.2
        color: "Pantone 185 C"
        engraving: "BRIAN"
      quantity: 1
```

The decomposition engine handles each item independently, potentially routing to different makers.

---

## 4. Naming Decision

### 4.1 Candidates

| Name | Domain (.com) | Intl. Pronunciation | Brand Fit | Scope |
|------|---------------|---------------------|-----------|-------|
| **Maker Network** | ❌ taken | ✅ universal | ✅ clear | ✅ broad |
| **Forge Network** | ⚠️ likely taken | ✅ strong imagery | ✅ powerful | ⚠️ metalwork connotation |
| **Build Network** | ⚠️ likely taken | ✅ simple | ⚠️ generic | ✅ broad |
| **Manufacturing Grid** | ⚠️ clunky | ⚠️ long | ⚠️ industrial | ✅ accurate |
| **Workshop Network** | ❌ long | ✅ warm | ✅ approachable | ✅ fits |

### 4.2 Recommendation: **Forge Network**（锻造网络）

**Primary choice: Forge Network**

Reasons:
1. **Imagery**: "Forge" evokes creation, craftsmanship, heat, transformation — perfect for 3D printing + electronics
2. **Concise**: Two syllables, memorable
3. **International**: Works in English, translatable to Chinese (锻造/铸造)
4. **Expandable**: A forge can make anything — not limited to printing
5. **Brand synergy**: "ClawForge" was already used in spec naming (`clawforge-spec`)
6. **Domain**: Use as sub-brand — `forge.realworldclaw.com` or keep `ClawForge`

**Internal codename**: `forge` (replacing `farm` in codebase)

**Chinese brand name**: **锻造坊** or simply **工坊网络**

### 4.3 Naming in Code

```
Current         →  New
─────────────────────────────
farms/          →  forge/
FarmPublic      →  ForgeNode
farm_id         →  maker_node_id
/api/v1/farms   →  /api/v1/forge/nodes
Print Farm page →  Forge Network page
```

---

## 5. Data Model Changes

### 5.1 Overview

Replace the single `farms` concept with a multi-entity model:

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  maker_nodes    │──1:N─│ maker_capabilities  │     │  orders          │
│  (replaces      │     │                     │     │  (enhanced)      │
│   farms)        │     └─────────────────────┘     │                  │
│                 │                                  │                  │
│                 │──1:N─┌─────────────────────┐     │                  │
│                 │     │ maker_equipment      │     │                  │
└─────────────────┘     └─────────────────────┘     └────────┬─────────┘
                                                             │ 1:N
                                                    ┌────────▼─────────┐
                                                    │  sub_orders      │
                                                    │  (new)           │
                                                    └────────┬─────────┘
                                                             │ N:1
                                                    ┌────────▼─────────┐
                                                    │  maker_nodes     │
                                                    └──────────────────┘
```

### 5.2 SQL Schema

```sql
-- ============================================================
-- Maker Network Schema — replaces farms table
-- ============================================================

-- ─── Maker Nodes（制造者节点）─────────────────────────────

CREATE TABLE maker_nodes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID NOT NULL REFERENCES agents(id),
    display_name        TEXT NOT NULL,
    description         TEXT,
    
    -- Location
    location_country    TEXT NOT NULL DEFAULT 'CN',
    location_province   TEXT,
    location_city       TEXT,
    latitude            DECIMAL(10, 7),
    longitude           DECIMAL(10, 7),
    
    -- Availability
    availability        TEXT NOT NULL DEFAULT 'offline'
                        CHECK (availability IN ('open', 'busy', 'offline', 'paused')),
    max_concurrent      INTEGER NOT NULL DEFAULT 1,  -- max simultaneous sub-orders
    current_load        INTEGER NOT NULL DEFAULT 0,
    
    -- Aggregated stats
    rating              DECIMAL(3, 2) DEFAULT 0.00,
    total_orders        INTEGER DEFAULT 0,
    success_rate        DECIMAL(5, 4) DEFAULT 1.0000,
    
    -- Verification
    verified            BOOLEAN DEFAULT FALSE,
    verified_at         TIMESTAMP,
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maker_nodes_availability ON maker_nodes(availability);
CREATE INDEX idx_maker_nodes_location ON maker_nodes(location_city);
CREATE INDEX idx_maker_nodes_rating ON maker_nodes(rating DESC);


-- ─── Maker Roles（制造者角色）───────────────────────────

-- A maker_node can hold multiple roles
CREATE TABLE maker_roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maker_node_id       UUID NOT NULL REFERENCES maker_nodes(id) ON DELETE CASCADE,
    role                TEXT NOT NULL 
                        CHECK (role IN ('printer', 'assembler', 'designer', 'inspector', 'full_service')),
    
    -- Certification status
    certified           BOOLEAN DEFAULT FALSE,
    certified_at        TIMESTAMP,
    certification_expires TIMESTAMP,  -- annual renewal
    certification_score DECIMAL(5, 2),  -- 0-100
    
    -- Role-specific pricing
    pricing_json        JSONB,  -- flexible per-role pricing structure
    
    -- Role-specific stats
    role_rating         DECIMAL(3, 2) DEFAULT 0.00,
    role_orders         INTEGER DEFAULT 0,
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(maker_node_id, role)
);

CREATE INDEX idx_maker_roles_role ON maker_roles(role, certified);

-- Pricing JSON examples:
-- Printer:   {"per_gram_cny": 0.15, "per_hour_cny": 8.0, "express_multiplier": 1.5}
-- Assembler: {"per_unit_basic_cny": 30, "per_unit_advanced_cny": 60}
-- Designer:  {"hourly_cny": 150, "min_project_cny": 200}
-- Inspector: {"per_unit_visual_cny": 10, "per_unit_functional_cny": 25}


-- ─── Maker Equipment（设备清单）──────────────────────────

CREATE TABLE maker_equipment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maker_node_id       UUID NOT NULL REFERENCES maker_nodes(id) ON DELETE CASCADE,
    
    equipment_type      TEXT NOT NULL,   -- '3d_printer', 'soldering_station', 'oscilloscope', etc.
    brand               TEXT,
    model               TEXT,
    
    -- For 3D printers specifically
    build_volume_x      INTEGER,  -- mm
    build_volume_y      INTEGER,
    build_volume_z      INTEGER,
    materials           TEXT[],   -- ['PLA', 'PETG', 'ABS', 'TPU']
    nozzle_sizes        DECIMAL(3,2)[],  -- [0.40, 0.60]
    
    -- General
    specs_json          JSONB,    -- arbitrary specs
    photo_urls          TEXT[],
    verified            BOOLEAN DEFAULT FALSE,
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maker_equipment_type ON maker_equipment(equipment_type);


-- ─── Certification Records（认证记录）────────────────────

CREATE TABLE maker_certifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maker_role_id       UUID NOT NULL REFERENCES maker_roles(id) ON DELETE CASCADE,
    
    certification_type  TEXT NOT NULL,   -- 'calibration_print', 'assembly_kit', 'design_challenge', 'qa_test'
    submitted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at         TIMESTAMP,
    reviewer_id         UUID,            -- platform admin or peer reviewer
    
    -- Evidence
    evidence_urls       TEXT[],          -- photos, videos, files
    
    -- Result
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'passed', 'failed', 'expired')),
    score               DECIMAL(5, 2),   -- 0-100
    feedback            TEXT,
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ─── Orders (enhanced)（订单 - 增强版）───────────────────

-- orders table gains new columns:
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'full'
    CHECK (scope IN ('full', 'print_only', 'assembly_only', 'custom'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS strategy TEXT
    CHECK (strategy IN ('full_service', 'decomposed', 'partial'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_brief TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_variant_id UUID;


-- ─── Sub-orders（子订单 / 子任务）─────────────────────────

CREATE TABLE sub_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Task definition
    step_id             TEXT NOT NULL,        -- matches manifest step id
    role_required       TEXT NOT NULL
                        CHECK (role_required IN ('printer', 'assembler', 'designer', 'inspector')),
    sequence            INTEGER NOT NULL,     -- execution order
    depends_on          UUID[],               -- sub_order ids this depends on
    
    -- Assignment
    maker_node_id       UUID REFERENCES maker_nodes(id),
    maker_role_id       UUID REFERENCES maker_roles(id),
    assigned_at         TIMESTAMP,
    
    -- Status
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN (
                            'pending',        -- waiting for dependencies / assignment
                            'assigned',       -- maker accepted
                            'in_progress',    -- maker working
                            'shipped',        -- output shipped to next step
                            'received',       -- next maker received input
                            'completed',      -- done
                            'failed',         -- maker reported issue
                            'cancelled'
                        )),
    
    -- Financials
    price_cny           DECIMAL(10, 2),
    platform_fee_cny    DECIMAL(10, 2),
    escrow_status       TEXT DEFAULT 'held'
                        CHECK (escrow_status IN ('held', 'released', 'refunded')),
    
    -- Logistics
    input_tracking      TEXT,     -- tracking number for incoming parts
    output_tracking     TEXT,     -- tracking number for outgoing parts
    ship_to_address     TEXT,     -- next maker's address or customer
    
    -- Timestamps
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sub_orders_order ON sub_orders(order_id);
CREATE INDEX idx_sub_orders_maker ON sub_orders(maker_node_id);
CREATE INDEX idx_sub_orders_status ON sub_orders(status);


-- ─── Custom Variants（定制变体）──────────────────────────

CREATE TABLE custom_variants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_component_id   TEXT NOT NULL REFERENCES components(id),
    designer_node_id    UUID REFERENCES maker_nodes(id),
    
    -- Customer request
    customer_brief      TEXT NOT NULL,
    
    -- Designer output
    variant_name        TEXT,
    manifest_json       JSONB,            -- modified manufacturing manifest
    file_urls           TEXT[],           -- custom STL/3MF files
    
    -- Status
    status              TEXT NOT NULL DEFAULT 'requested'
                        CHECK (status IN ('requested', 'quoted', 'in_design', 'completed', 'published')),
    design_fee_cny      DECIMAL(10, 2),
    
    -- If published to marketplace
    is_public           BOOLEAN DEFAULT FALSE,
    royalty_rate         DECIMAL(5, 4),    -- e.g., 0.05 = 5%
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custom_variants_component ON custom_variants(base_component_id);


-- ─── Views for backward compatibility ────────────────────

-- Drop-in replacement for code that queries "farms"
CREATE OR REPLACE VIEW farms_compat AS
SELECT
    mn.id,
    me.brand AS printer_brand,
    me.model AS printer_model,
    me.build_volume_x,
    me.build_volume_y,
    me.build_volume_z,
    me.materials,
    mn.location_province,
    mn.location_city,
    mn.availability,
    (mr.pricing_json->>'per_hour_cny')::DECIMAL AS pricing_per_hour_cny,
    mn.description,
    mn.rating,
    mn.total_orders,
    mn.success_rate,
    mn.verified,
    mn.created_at
FROM maker_nodes mn
JOIN maker_roles mr ON mr.maker_node_id = mn.id AND mr.role = 'printer'
LEFT JOIN maker_equipment me ON me.maker_node_id = mn.id AND me.equipment_type = '3d_printer';
```

---

## 6. Migration Impact Assessment

### 6.1 Files That Must Change

| File | Change Type | Effort |
|------|-------------|--------|
| `frontend/lib/types.ts` | Replace `FarmPublic` with `ForgeNode`, add sub-order types | Medium |
| `frontend/app/farms/page.tsx` | Rename to `forge/page.tsx`, redesign UI for multi-role | High |
| `frontend/components/Header.tsx` | Update navigation labels | Low |
| `frontend/lib/mock-data.ts` | Replace farm mock data with maker node data | Medium |
| `frontend/lib/api.ts` | Update API endpoints `/farms` → `/forge/nodes` | Low |
| `frontend/app/page.tsx` | Update homepage references | Low |
| `frontend/app/layout.tsx` | Update metadata/titles | Low |
| `platform/data/seed-data.sql` | Add maker_nodes seed data | Medium |
| `docs/api-reference.md` | Document new endpoints | High |
| `docs/architecture/platform.md` | Update matching engine section | Medium |
| `docs/architecture/open-core.md` | Update monetization model | Medium |
| `README.md` | Update project description | Low |

### 6.2 What Can Be Reused

| Component | Reusability | Notes |
|-----------|-------------|-------|
| `components` table + schema | ✅ 100% | No changes needed |
| Component CRUD API | ✅ 100% | Untouched |
| Agent system | ✅ 90% | Agents become maker node owners; agent types expand |
| Order base table | ✅ 80% | Enhanced with new columns, not replaced |
| Rating/reputation system | ✅ 70% | Per-role scoring added on top |
| Matching engine logic | ⚠️ 50% | Core algorithm reusable, but needs multi-role routing |
| Frontend component library | ✅ 80% | Cards, tables, layouts all reusable |
| Payment/escrow flow | ✅ 70% | Needs sub-order escrow but same pattern |

### 6.3 Recommended Migration Strategy

```
Phase 1 — Schema + Backend (Week 1-2)
├── Create new tables (maker_nodes, maker_roles, etc.)
├── Create farms_compat view (zero downtime)
├── New API endpoints: /forge/nodes, /forge/roles
├── Migrate existing farm data → maker_nodes (printer role)
└── Old /farms endpoints proxy to new schema via view

Phase 2 — Frontend (Week 2-3)
├── Rename farms/ → forge/
├── New ForgeNode card with role badges
├── Multi-role registration flow
├── Sub-order tracking UI
└── Custom order request form

Phase 3 — Certification System (Week 3-4)
├── Certification kit ordering flow
├── Photo/video upload for certification
├── Peer review system
└── Automated scoring for print quality

Phase 4 — Order Decomposition (Week 4-6)
├── Manufacturing manifest format + editor
├── Decomposition engine
├── Inter-maker logistics coordination
├── Sub-order escrow management
└── End-to-end testing with real orders
```

### 6.4 API Versioning

Existing `/v1/farms` endpoints will continue to work via the compatibility view. New endpoints live under `/v1/forge/`. When v2 launches, farms endpoints deprecated with 6-month sunset.

---

## Appendix A: Glossary

| English | Chinese | Definition |
|---------|---------|------------|
| Maker Node | 制造者节点 | A registered maker with capabilities |
| Forge Network | 锻造网络 | The distributed manufacturing network |
| Manufacturing Manifest | 制造清单 | YAML spec defining how to make a product |
| Sub-order | 子订单 | A single manufacturing step assigned to one maker |
| Custom Variant | 定制变体 | A designer-modified version of a standard product |
| Certification Kit | 认证套件 | Physical kit used to test maker capabilities |
| Decomposition Engine | 拆分引擎 | Algorithm that breaks orders into sub-orders |

---

*Document authored by 慢羊羊🧓, Chief Advisor. Reviewed by: pending.*
*This is a living document. Update as implementation progresses.*
