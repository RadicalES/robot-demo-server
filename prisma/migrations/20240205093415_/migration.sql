/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `Device` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Device_uuid_key" ON "Device"("uuid");
