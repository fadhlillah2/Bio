# Go backend proof

Status updated 17 September 2026: local tests, race checks, coverage and a real HTTP demonstration **passed** on 16 September 2026, 23:50:08–23:50:33 WIB (UTC+7). The changes were subsequently committed and pushed as `cb4bced819d2b1ece7c7662a908844586acf6fc1`; [GitHub Actions run 35127882994](https://github.com/fadhlillah2/rate-limiter-project-go/actions/runs/35127882994) passed on that exact commit. No benchmark or commercial outcome is claimed.

## Source and changes

- Repository: https://github.com/fadhlillah2/rate-limiter-project-go
- Local verification baseline: `543b62b38ebb5413155c5157a5c006a362e17d68`, plus the then-uncommitted patch in sibling `rate-limiter-project-go`, subsequently published as `cb4bced819d2b1ece7c7662a908844586acf6fc1`.
- Standalone examples now have separate packages: `examples/basic/main.go` and `examples/http/main.go`. The basic example also replaces five redundant-newline `Println` calls with output-equivalent `Print` calls so Go vet passes. README command paths and Docker builder now match Go 1.24.7.
- Redis `AllowN` now accounts for the entire batch atomically; rejected batches consume no quota. Each batch uses a random nonce plus member index. Redis sliding/fixed windows consistently use milliseconds, round positive fractions up to Redis resolution, and safely convert rounded durations. HTTP `Retry-After` rounds up to avoid advertising an earlier retry.
- No public API, dependency version, `go.mod` or `go.sum` changed. Local verification did not install a global toolchain, pull containers or deploy the service. The later commit/push and remote CI are recorded above.

## Runtime and reproduction

Official archive: [Go 1.24.7 Linux amd64](https://go.dev/dl/go1.24.7.linux-amd64.tar.gz), **78,584,952 bytes**. SHA-256 was checked against [official download metadata](https://go.dev/dl/?mode=json&include=all) before extraction:

```text
da18191ddb7db8a9339816f3e2b54bdded8047cdc2a5d67059478f8d1595c43f
```

Runtime reported `go version go1.24.7 linux/amd64`. The toolchain, source snapshot, module cache, build cache and logs are retained in session-owned `/tmp/bio-go-proof-XCcUuy` (temporary paths are not permanent public evidence). GCC was available for race builds. Redis tests use miniredis; no external Redis service was started.

The approved download resolved the locked module graph without changing manifests; `go mod verify` returned `all modules verified`. These environment settings isolate caches and prevent implicit toolchain/module downloads during tests:

```sh
export PATH=/tmp/bio-go-proof-XCcUuy/go/bin:$PATH
export GOPATH=/tmp/bio-go-proof-XCcUuy/gopath
export GOMODCACHE=/tmp/bio-go-proof-XCcUuy/modules
export GOCACHE=/tmp/bio-go-proof-XCcUuy/cache
export GOTOOLCHAIN=local GOFLAGS=-mod=readonly
cd /tmp/bio-go-proof-XCcUuy/source
go version
go mod download
go mod verify
export GOPROXY=off
go test -count=1 -timeout=120s ./...
go test -race -count=1 -timeout=120s ./...
go test -count=1 -timeout=120s -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
go test -count=1 -timeout=30s -v -run '^TestIntegration_RateLimitEnforcement$' ./test/integration
```

All final commands returned exit 0. Ordinary and race runs passed the middleware, ratelimiter and integration packages; the server and both examples compiled with no test files. These are tested paths, not a guarantee that all possible races or bugs are absent.

## Results and regression evidence

| Coverage scope | Statement coverage |
| --- | ---: |
| `pkg/ratelimiter` | 86.1% |
| `pkg/middleware` | 74.4% |
| Whole coverage profile | 51.2% |
| `cmd/server`, `examples/basic`, `examples/http` | 0.0% each |

The integration package reports no statements of its own. The whole-profile figure is Go's statement-weighted total, not an average of package percentages. Original README coverage/throughput claims are not fresh measurements; README now distinguishes the actual verification from unvalidated historical benchmark figures.

The existing loopback `httptest.Server` demonstration logged:

```text
Request 1: HTTP 200
Request 2: HTTP 200
Request 3: HTTP 200
Request 4: HTTP 200
Request 5: HTTP 200
Request 6: HTTP 429, Retry-After=1
PASS
```

The test closes its server and limiter. It demonstrates fixed-window HTTP enforcement, not Redis cluster behavior or throughput.

Failures were observed before fixes: original examples could not compile together (`main redeclared`); Go vet rejected redundant newlines; Redis batch counts and retry durations failed existing tests. New regressions first exposed rejected-batch quota use, zero fractional-window TTLs, fixed-window division by zero, premature HTTP retry rounding, and duration-conversion overflow. A temporary mutation replacing the batch nonce with timestamp-based member IDs made the deterministic same-millisecond test fail (two stored entries instead of four); restoring the nonce passed. Final tests include these regressions.

Raw local evidence: `test.log`, `race.log`, `coverage.log`, `coverage-functions.log`, `http-demo.log`, and `source/coverage.out` under the retained session directory. All Go files were byte-compared with the final tested snapshot; `go.mod` and `go.sum` also match baseline HEAD. `source-manifest.sha256` binds the final local repository files, including the CI/documentation additions, while those documentation additions were not part of runtime execution.

## CI and limits

The Go repository's README contains the commands and coverage interpretation. `.github/workflows/ci.yml` uses `go-version-file: go.mod`, read-only repository permissions, locked dependencies, ordinary/race/coverage checks and the HTTP demonstration. [checkout v6](https://raw.githubusercontent.com/actions/checkout/v6/action.yml) and [setup-go v6](https://raw.githubusercontent.com/actions/setup-go/v6/action.yml) use Node 24 according to their official action manifests. The completed remote run linked above verified all modules and passed every step with Go 1.24.7 Linux amd64. Its logs independently report the same package/whole-profile coverage and five HTTP 200 responses followed by HTTP 429 with `Retry-After: 1`.

Known limits outside this patch, inspected in `pkg/ratelimiter/redis.go` without additional runtime reproduction:

- `RedisConfig.KeyPrefix` is documented but `buildKey` hardcodes `ratelimit:`; configurable namespace isolation is not established.
- `Reset` scans `redisKey + "*"`, so resetting `a` can also match keys beginning with `ab`; prefix isolation is not established.
- Sliding-window `ResetAt` retains `now + window`, rather than always describing the oldest entry's expiry.

Real Redis/cluster compatibility, production deployment, server/example execution, benchmarks and business impact remain unverified. miniredis emitted a go-redis maintenance-notification fallback warning during verbose failure diagnosis; it did not fail the final tests. No production-readiness claim should be inferred from this evidence.
