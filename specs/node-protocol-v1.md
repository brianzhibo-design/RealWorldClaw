# RealWorldClaw Node Protocol Specification v1.0

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Node Registration](#node-registration)
4. [Node Heartbeat](#node-heartbeat)
5. [Task Management](#task-management)
6. [Progress Reporting](#progress-reporting)
7. [Privacy and Security](#privacy-and-security)
8. [Developer Integration](#developer-integration)
9. [Error Handling](#error-handling)
10. [SDK Reference](#sdk-reference)

---

## Overview

The RealWorldClaw Node Protocol defines the communication interface between manufacturing nodes and the RealWorldClaw platform. This protocol enables decentralized manufacturing by allowing any compatible device to join the network and participate in the manufacturing ecosystem.

### Key Principles

- **Decentralization**: Any manufacturer can register and operate nodes
- **Privacy**: User and node identities are protected through anonymization
- **Reliability**: Robust heartbeat and progress reporting mechanisms
- **Extensibility**: Support for diverse device types through adapter patterns

### Protocol Version

- **Version**: 1.0
- **Status**: Draft
- **Last Updated**: February 2026

---

## Authentication

All API requests must include authentication via Bearer token in the Authorization header.

### Header Format
```
Authorization: Bearer <node_api_key>
```

### Token Management
- API keys are issued during node registration
- Keys have no expiration but can be revoked by the platform
- Keys must be securely stored and never transmitted in plain text

---

## Node Registration

### Overview
Manufacturing entities must register both an account and individual nodes before participating in the network.

### 1. Account Registration

**Endpoint**: `POST /api/v1/accounts/register`

**Request Body**:
```json
{
  "manufacturer_name": "string",
  "contact_email": "string",
  "legal_entity": "string",
  "country_code": "string (ISO 3166-1 alpha-2)"
}
```

**Response**:
```json
{
  "account_id": "string",
  "status": "pending_verification",
  "verification_token": "string"
}
```

### 2. Node Registration

**Endpoint**: `POST /api/v1/nodes/register`

**Request Headers**:
```
Authorization: Bearer <account_api_key>
Content-Type: application/json
```

**Request Body**:
```json
{
  "device_type": "string",
  "build_volume": {
    "x": "number (mm)",
    "y": "number (mm)", 
    "z": "number (mm)"
  },
  "supported_materials": ["string"],
  "location": {
    "city": "string",
    "country_code": "string",
    "timezone": "string"
  },
  "capabilities": {
    "max_resolution": "number (microns)",
    "temperature_range": {
      "min": "number (°C)",
      "max": "number (°C)"
    }
  },
  "metadata": {
    "firmware_version": "string",
    "adapter_version": "string"
  }
}
```

**Response**:
```json
{
  "node_id": "string (UUID)",
  "api_key": "string",
  "status": "registered",
  "network_address": "string",
  "registration_timestamp": "string (ISO 8601)"
}
```

### Registration States
- `pending_verification`: Account requires email verification
- `registered`: Node successfully registered and active
- `suspended`: Node temporarily disabled
- `revoked`: Node permanently disabled

---

## Node Heartbeat

### Overview
Nodes must send periodic heartbeat signals to maintain their active status and report current state.

### Heartbeat Interval
- **Frequency**: Every 60 seconds
- **Tolerance**: ±10 seconds
- **Timeout**: 5 minutes without heartbeat marks node as offline

### Heartbeat Request

**Endpoint**: `POST /api/v1/nodes/heartbeat`

**Request Headers**:
```
Authorization: Bearer <node_api_key>
Content-Type: application/json
```

**Request Body**:
```json
{
  "node_id": "string (UUID)",
  "timestamp": "string (ISO 8601)",
  "status": "string (idle|busy|offline|maintenance)",
  "queue_length": "number",
  "estimated_availability": "string (ISO 8601)",
  "current_job_id": "string (UUID, optional)",
  "system_metrics": {
    "temperature": "number (°C)",
    "utilization": "number (0-100%)",
    "error_count": "number"
  }
}
```

**Response**:
```json
{
  "acknowledged": "boolean",
  "server_timestamp": "string (ISO 8601)",
  "pending_tasks": "number",
  "platform_messages": ["string"]
}
```

### Status Definitions
- `idle`: Ready to accept new tasks
- `busy`: Currently manufacturing
- `offline`: Node unavailable (maintenance, power off, etc.)
- `maintenance`: Scheduled maintenance mode

---

## Task Management

### Task Assignment Flow

1. Platform matches user request to available nodes
2. Platform sends task offer to selected node
3. Node can accept or reject the task
4. Upon acceptance, node transitions to `manufacturing` state

### Task Offer

**Endpoint**: `POST /api/v1/nodes/{node_id}/tasks/offer` (Platform → Node)

**Request Body**:
```json
{
  "task_id": "string (UUID)",
  "priority": "string (low|normal|high|urgent)",
  "deadline": "string (ISO 8601)",
  "estimated_duration": "number (minutes)",
  "material_requirements": {
    "type": "string",
    "quantity": "number (grams)",
    "color": "string (hex)"
  },
  "job_specification": {
    "file_url": "string (signed URL)",
    "file_format": "string (stl|obj|3mf)",
    "print_settings": {
      "layer_height": "number (mm)",
      "infill": "number (0-100%)",
      "supports": "boolean"
    }
  }
}
```

### Task Response

**Endpoint**: `POST /api/v1/tasks/{task_id}/response`

**Request Body**:
```json
{
  "node_id": "string (UUID)",
  "decision": "string (accept|reject)",
  "reason": "string (optional)",
  "estimated_completion": "string (ISO 8601, if accepted)",
  "cost_estimate": {
    "material_cost": "number (USD)",
    "processing_time": "number (minutes)",
    "total_cost": "number (USD)"
  }
}
```

---

## Progress Reporting

### Overview
During manufacturing, nodes must provide regular progress updates and final completion reports.

### Progress Update

**Endpoint**: `POST /api/v1/tasks/{task_id}/progress`

**Request Body**:
```json
{
  "node_id": "string (UUID)",
  "timestamp": "string (ISO 8601)",
  "progress_percentage": "number (0-100)",
  "current_stage": "string (preparing|printing|cooling|finishing)",
  "estimated_completion": "string (ISO 8601)",
  "quality_metrics": {
    "layer_adhesion": "string (good|fair|poor)",
    "surface_quality": "string (excellent|good|acceptable|poor)"
  }
}
```

### Completion Report

**Endpoint**: `POST /api/v1/tasks/{task_id}/complete`

**Request Body**:
```json
{
  "node_id": "string (UUID)",
  "completion_timestamp": "string (ISO 8601)",
  "final_status": "string (success|failed|partial)",
  "quality_report": {
    "dimensional_accuracy": "number (mm tolerance)",
    "surface_finish": "string (excellent|good|acceptable|poor)",
    "defects": ["string"]
  },
  "photos": [
    {
      "type": "string (overview|detail|defect)",
      "url": "string (signed upload URL)",
      "timestamp": "string (ISO 8601)"
    }
  ],
  "material_usage": {
    "consumed": "number (grams)",
    "waste": "number (grams)"
  }
}
```

### State Transitions
- `queued` → `preparing` → `printing` → `cooling` → `finishing` → `completed`
- Any state can transition to `failed` or `cancelled`

---

## Privacy and Security

### Privacy Guarantees

#### User Privacy
- Nodes never receive user personal information
- All requests are anonymized through platform intermediation
- User location is never disclosed to nodes
- Payment information is handled exclusively by the platform

#### Node Privacy
- Node precise location is not disclosed to users
- Public location information is fuzzy (±1km radius)
- Node operator identity is protected
- Financial information is kept confidential

### Location Anonymization
```json
{
  "public_location": {
    "city": "San Francisco",
    "region": "California",
    "country": "United States",
    "approximate_coordinates": {
      "lat": "37.7749",
      "lng": "-122.4194",
      "accuracy_radius_km": 1.0
    }
  }
}
```

### Data Retention
- Task data: 30 days after completion
- Progress logs: 7 days after completion
- Node metrics: 90 days rolling window
- Photos: 14 days after quality approval

---

## Developer Integration

### SDK Architecture

The RealWorldClaw SDK provides a standardized interface for device integration through adapter patterns.

### Core Adapter Interface

```python
class NodeAdapter(ABC):
    @abstractmethod
    def register(self, config: NodeConfig) -> RegistrationResult:
        """Register node with platform"""
        pass
    
    @abstractmethod
    def heartbeat(self) -> HeartbeatData:
        """Generate heartbeat data"""
        pass
    
    @abstractmethod
    def accept_job(self, task: Task) -> AcceptanceDecision:
        """Evaluate and respond to task offers"""
        pass
    
    @abstractmethod
    def report_progress(self, task_id: str) -> ProgressReport:
        """Report manufacturing progress"""
        pass
    
    @abstractmethod
    def complete_job(self, task_id: str) -> CompletionReport:
        """Report job completion"""
        pass
```

### JavaScript SDK Example

```javascript
const { RealWorldClawSDK } = require('@realworldclaw/node-sdk');

const adapter = new RealWorldClawSDK({
  apiKey: process.env.RWC_API_KEY,
  nodeId: process.env.RWC_NODE_ID,
  deviceType: '3d_printer'
});

// Initialize heartbeat
adapter.startHeartbeat({
  interval: 60000,
  onTaskOffer: (task) => evaluateTask(task),
  onError: (error) => handleError(error)
});
```

### Python SDK Example

```python
from realworldclaw_sdk import NodeAdapter, NodeConfig

class CustomPrinterAdapter(NodeAdapter):
    def __init__(self, config: NodeConfig):
        super().__init__(config)
        self.printer = initialize_printer_connection()
    
    def accept_job(self, task: Task) -> AcceptanceDecision:
        if self.can_handle_material(task.material_type):
            return AcceptanceDecision.ACCEPT
        return AcceptanceDecision.REJECT
    
    def report_progress(self, task_id: str) -> ProgressReport:
        current_progress = self.printer.get_progress()
        return ProgressReport(
            progress_percentage=current_progress,
            stage=self.printer.current_stage
        )
```

### Supported Device Types

- `3d_printer_fdm`: Fused Deposition Modeling printers
- `3d_printer_sla`: Stereolithography printers
- `cnc_mill`: CNC milling machines
- `laser_cutter`: Laser cutting systems
- `custom`: Custom device implementations

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)",
    "timestamp": "string (ISO 8601)"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_API_KEY` | 401 | Authentication failed |
| `NODE_NOT_FOUND` | 404 | Node ID not registered |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `HEARTBEAT_TIMEOUT` | 408 | Heartbeat interval exceeded |
| `TASK_CONFLICT` | 409 | Node already has active task |
| `INVALID_PROGRESS` | 400 | Progress data validation failed |
| `NETWORK_ERROR` | 503 | Platform temporarily unavailable |

### Retry Strategy

- **Heartbeat failures**: Exponential backoff (1s, 2s, 4s, max 30s)
- **Task operations**: 3 retries with 5s intervals
- **File uploads**: 3 retries with 10s intervals

---

## SDK Reference

### Installation

#### Python
```bash
pip install realworldclaw-sdk
```

#### JavaScript/Node.js
```bash
npm install @realworldclaw/node-sdk
```

### Configuration

#### Environment Variables
```bash
RWC_API_KEY=your_api_key_here
RWC_NODE_ID=your_node_uuid_here
RWC_API_BASE_URL=https://api.realworldclaw.com/v1
RWC_HEARTBEAT_INTERVAL=60
```

#### Configuration File (`rwc-config.json`)
```json
{
  "api_key": "string",
  "node_id": "string",
  "api_base_url": "string",
  "heartbeat_interval": 60,
  "device_config": {
    "type": "3d_printer_fdm",
    "connection": "serial:///dev/ttyUSB0:115200"
  }
}
```

### Testing

The SDK includes a test mode for development:

```python
from realworldclaw_sdk import TestAdapter

# Simulates a node for testing
test_adapter = TestAdapter(simulate_delays=True)
test_adapter.run_test_scenario()
```

---

## Appendices

### A. Message Flow Diagrams

```
Node Registration Flow:
1. Manufacturer → Platform: POST /accounts/register
2. Platform → Manufacturer: Email verification
3. Manufacturer → Platform: POST /nodes/register
4. Platform → Node: Registration confirmation + API key

Heartbeat Flow:
1. Node → Platform: POST /heartbeat (every 60s)
2. Platform → Node: ACK + pending tasks count

Task Flow:
1. Platform → Node: POST /tasks/offer
2. Node → Platform: POST /tasks/{id}/response
3. Node → Platform: POST /tasks/{id}/progress (periodic)
4. Node → Platform: POST /tasks/{id}/complete
```

### B. Changelog

- **v1.0 (February 2026)**: Initial specification
  - Node registration and heartbeat protocols
  - Task management and progress reporting
  - Privacy and security requirements
  - SDK architecture and examples

---

**Document Status**: Draft  
**Last Updated**: February 23, 2026  
**Next Review**: March 2026  
**Approval Required**: Platform Architecture Team