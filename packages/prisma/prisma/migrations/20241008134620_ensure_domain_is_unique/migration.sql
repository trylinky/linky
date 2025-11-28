/*
  Warnings:

  - A unique constraint covering the columns `[customDomain]` on the table `Page` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Page_customDomain_key" ON "Page"("customDomain");
