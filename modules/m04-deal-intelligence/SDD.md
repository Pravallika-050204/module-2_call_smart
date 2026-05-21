# SDD — Module M-04 Deal-intelligence

## 1. What This Module Does
Strategic implementation for features inside lifecycle stage of the platform.

## 2. APIs
- `GET /api/v1/deal-intelligence`
- `POST /api/v1/deal-intelligence`

## 3. Events Consumed
- Upstream events triggered in platform.

## 4. Events Emitted
- `deal.stage.changed`

## 5. Database Tables (Independently Owned)
- `m04_deal_intelligence`

## 6. AI Service Calls
- Internal AI Python router integration if needed.
