MBMB Module

This module provides a small, self-contained client to call MBMB public APIs (hosted at https://api.mbmb.gov.my).

Installation
- Ensure dependencies are installed: the project should include `@nestjs/axios` and `axios`.

Configuration
- MBMB client base URL is read from env var `MBMB_API_BASE`. Default: `https://api.mbmb.gov.my`.

Usage
- Import `MbmbModule` into any module and inject `MbmbService`.
- Use `mbmbService.getPublicResource('mps', { state: '11' })` to call `/mbmb/public/api/mps?state=11`.

Notes
- The module is intentionally independent from the rest of the IXORA codebase and only depends on Nest's HttpModule and ConfigModule.
- For production use, consider adding retries, caching, and stricter typing for known endpoints.
