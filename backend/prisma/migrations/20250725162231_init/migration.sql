-- CreateTable
CREATE TABLE "ClearEvent" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClearEvent_pkey" PRIMARY KEY ("id")
);
