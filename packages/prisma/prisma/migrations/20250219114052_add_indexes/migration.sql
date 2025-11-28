-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Block_pageId_idx" ON "Block"("pageId");

-- CreateIndex
CREATE INDEX "Block_integrationId_idx" ON "Block"("integrationId");

-- CreateIndex
CREATE INDEX "Integration_userId_idx" ON "Integration"("userId");

-- CreateIndex
CREATE INDEX "Integration_teamId_idx" ON "Integration"("teamId");

-- CreateIndex
CREATE INDEX "InviteCode_assignedToId_idx" ON "InviteCode"("assignedToId");

-- CreateIndex
CREATE INDEX "InviteCode_claimedById_idx" ON "InviteCode"("claimedById");

-- CreateIndex
CREATE INDEX "Orchestration_pageId_idx" ON "Orchestration"("pageId");

-- CreateIndex
CREATE INDEX "Page_userId_idx" ON "Page"("userId");

-- CreateIndex
CREATE INDEX "Page_teamId_idx" ON "Page"("teamId");

-- CreateIndex
CREATE INDEX "Page_themeId_idx" ON "Page"("themeId");

-- CreateIndex
CREATE INDEX "TeamInvite_teamId_idx" ON "TeamInvite"("teamId");

-- CreateIndex
CREATE INDEX "TeamInvite_claimedById_idx" ON "TeamInvite"("claimedById");

-- CreateIndex
CREATE INDEX "TeamUser_userId_idx" ON "TeamUser"("userId");

-- CreateIndex
CREATE INDEX "TeamUser_teamId_idx" ON "TeamUser"("teamId");

-- CreateIndex
CREATE INDEX "Theme_createdById_idx" ON "Theme"("createdById");

-- CreateIndex
CREATE INDEX "Theme_teamId_idx" ON "Theme"("teamId");

-- CreateIndex
CREATE INDEX "VerificationRequest_requestedByUserId_idx" ON "VerificationRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "VerificationRequest_pageId_idx" ON "VerificationRequest"("pageId");
