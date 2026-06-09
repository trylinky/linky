-- Composite indexes for hot lookups that filter on deletedAt alongside an
-- already-indexed column (see 2026-06-09 performance review).
CREATE INDEX "Page_organizationId_deletedAt_idx" ON "Page"("organizationId", "deletedAt");
CREATE INDEX "Page_slug_deletedAt_idx" ON "Page"("slug", "deletedAt");
CREATE INDEX "Page_customDomain_deletedAt_idx" ON "Page"("customDomain", "deletedAt");
CREATE INDEX "Integration_organizationId_deletedAt_idx" ON "Integration"("organizationId", "deletedAt");
